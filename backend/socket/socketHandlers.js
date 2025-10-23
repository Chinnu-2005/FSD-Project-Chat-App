const jwt = require('jsonwebtoken');
const User = require('../models/user.models');
const Message = require('../models/message.models');
const PrivateChat = require('../models/onechat.models');
const GroupChat = require('../models/groupchat.models');
const Notification = require('../models/notification.models');

const connectedUsers = new Map();
const userSessions = new Map(); // Cache user data
const chatSessions = new Map(); // Cache chat data
const groupSessions = new Map(); // Cache group data

const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded._id);
        
        if (!user) {
            return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
};

const handleConnection = async (socket) => {
    console.log(`User ${socket.user.username} connected`);
    
    // Cache user session data
    let userSession = userSessions.get(socket.userId);
    if (!userSession) {
        const user = await User.findById(socket.userId).populate('connections');
        userSession = {
            user: user,
            connections: user.connections.map(c => c._id.toString()),
            lastUpdated: Date.now()
        };
        userSessions.set(socket.userId, userSession);
    }
    
    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, { 
        status: 'online',
        lastseen: new Date()
    });

    // Store connected user with session data
    connectedUsers.set(socket.userId, {
        socketId: socket.id,
        username: socket.user.username,
        connections: userSession.connections
    });

    // Join user to their personal room
    socket.join(socket.userId);

    // Cache and join chat rooms
    let userChats = chatSessions.get(socket.userId);
    if (!userChats || Date.now() - userChats.lastUpdated > 300000) { // 5 min cache
        const privateChats = await PrivateChat.find({ participants: socket.userId });
        const groupChats = await GroupChat.find({ members: socket.userId });
        
        userChats = {
            privateChats: privateChats.map(c => ({ id: c._id.toString(), participants: c.participants })),
            groupChats: groupChats.map(g => ({ id: g._id.toString(), members: g.members })),
            lastUpdated: Date.now()
        };
        chatSessions.set(socket.userId, userChats);
    }

    // Join rooms using cached data
    userChats.privateChats.forEach(chat => socket.join(chat.id));
    userChats.groupChats.forEach(group => socket.join(group.id));

    // Notify connections using cached data
    userSession.connections.forEach(connectionId => {
        socket.to(connectionId).emit('user_online', {
            userId: socket.userId,
            username: socket.user.username
        });
    });
    
    // Send queued notifications (keep DB query for accuracy)
    const queuedNotifications = await Notification.find({
        recipient: socket.userId,
        isRead: false
    }).populate('sender', 'username').populate('message');
    
    if (queuedNotifications.length > 0) {
        socket.emit('queued_notifications', {
            count: queuedNotifications.length,
            notifications: queuedNotifications
        });
        
        await Notification.updateMany(
            { recipient: socket.userId, isRead: false },
            { isRead: true }
        );
    }

    // Handle private message
    socket.on('send_private_message', async (data) => {
        try {
            console.log('Received private message via socket:', data);
            const { chatId, content, messageType = 'text', fileUrl } = data;

            // Check cached chat data first
            const userChats = chatSessions.get(socket.userId);
            console.log('User chats from cache:', userChats?.privateChats?.length || 0);
            
            let cachedChat = userChats?.privateChats.find(c => c.id === chatId);
            console.log('Found cached chat:', !!cachedChat);
            
            // If chat not found in cache, refresh cache and try again
            if (!cachedChat) {
                console.log('Chat not in cache, refreshing...');
                const privateChats = await PrivateChat.find({ participants: socket.userId });
                const groupChats = await GroupChat.find({ members: socket.userId });
                
                const refreshedChats = {
                    privateChats: privateChats.map(c => ({ id: c._id.toString(), participants: c.participants })),
                    groupChats: groupChats.map(g => ({ id: g._id.toString(), members: g.members })),
                    lastUpdated: Date.now()
                };
                chatSessions.set(socket.userId, refreshedChats);
                
                cachedChat = refreshedChats.privateChats.find(c => c.id === chatId);
                console.log('Found chat after refresh:', !!cachedChat);
            }
            
            if (!cachedChat || !cachedChat.participants.includes(socket.userId)) {
                console.log('Unauthorized chat access:', { cachedChat: !!cachedChat, userId: socket.userId });
                return socket.emit('error', { message: 'Unauthorized' });
            }

            const message = await Message.create({
                sender: socket.userId,
                content,
                messageType,
                fileUrl,
                privateChat: chatId,
                readBy: [socket.userId]
            });
            console.log('Message created:', message._id);

            // Use cached user data for sender info
            const senderData = connectedUsers.get(socket.userId);
            const populatedMessage = {
                ...message.toObject(),
                sender: {
                    _id: socket.userId,
                    username: senderData.username,
                    avatar: socket.user.avatar
                }
            };
            console.log('Populated message created');

            // Update chat's latest message (async, no await)
            PrivateChat.findByIdAndUpdate(chatId, { latestMessage: message._id }).exec();

            // Emit using cached participant data
            const otherParticipant = cachedChat.participants.find(p => p.toString() !== socket.userId);
            const isRecipientOnline = connectedUsers.has(otherParticipant.toString());
            
            console.log('Emitting message to room:', chatId);
            socket.to(chatId).emit('new_private_message', populatedMessage);
            socket.emit('message_sent', populatedMessage);
            
            // Queue notification for offline user
            if (!isRecipientOnline) {
                Notification.create({
                    recipient: otherParticipant,
                    type: 'message',
                    message: message._id,
                    sender: socket.userId,
                    chatId: chatId,
                    isGroup: false
                }).exec();
            }

        } catch (error) {
            console.error('Socket message error:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Handle group message
    socket.on('send_group_message', async (data) => {
        try {
            const { groupId, content, messageType = 'text', fileUrl } = data;

            const group = await GroupChat.findById(groupId);
            if (!group || !group.members.includes(socket.userId)) {
                return socket.emit('error', { message: 'Unauthorized' });
            }

            const message = await Message.create({
                sender: socket.userId,
                content,
                messageType,
                fileUrl,
                groupChat: groupId,
                readBy: [socket.userId]
            });

            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'username avatar');

            // Update group's latest message
            group.latestMessage = message._id;
            await group.save();

            // Emit to all group members and queue for offline users
            socket.to(groupId).emit('new_group_message', populatedMessage);
            socket.emit('message_sent', populatedMessage);
            
            // Queue notifications for offline members
            const offlineMembers = group.members.filter(memberId => 
                memberId.toString() !== socket.userId && !connectedUsers.has(memberId.toString())
            );
            
            for (const memberId of offlineMembers) {
                await Notification.create({
                    recipient: memberId,
                    type: 'message',
                    message: message._id,
                    sender: socket.userId,
                    chatId: groupId,
                    isGroup: true
                });
            }

        } catch (error) {
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
        const { chatId, isGroup } = data;
        const eventName = isGroup ? 'user_typing_group' : 'user_typing_private';
        
        socket.to(chatId).emit(eventName, {
            userId: socket.userId,
            username: socket.user.username,
            chatId
        });
    });

    socket.on('typing_stop', (data) => {
        const { chatId, isGroup } = data;
        const eventName = isGroup ? 'user_stopped_typing_group' : 'user_stopped_typing_private';
        
        socket.to(chatId).emit(eventName, {
            userId: socket.userId,
            chatId
        });
    });

    // Handle join room
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
    });

    // Handle leave room
    socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
    });

    // Handle message read
    socket.on('mark_messages_read', async (data) => {
        try {
            const { chatId, isGroup } = data;
            
            const query = isGroup 
                ? { groupChat: chatId, readBy: { $ne: socket.userId } }
                : { privateChat: chatId, readBy: { $ne: socket.userId } };

            await Message.updateMany(query, { $push: { readBy: socket.userId } });

            const eventName = isGroup ? 'messages_read_group' : 'messages_read_private';
            socket.to(chatId).emit(eventName, {
                userId: socket.userId,
                chatId
            });

        } catch (error) {
            socket.emit('error', { message: 'Failed to mark messages as read' });
        }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        console.log(`User ${socket.user.username} disconnected`);
        
        const userData = connectedUsers.get(socket.userId);
        
        // Update user status to offline (async, no await)
        User.findByIdAndUpdate(socket.userId, { 
            status: 'offline',
            lastseen: new Date()
        }).exec();

        // Notify connections using cached data
        if (userData?.connections) {
            userData.connections.forEach(connectionId => {
                socket.to(connectionId).emit('user_offline', {
                    userId: socket.userId,
                    username: userData.username,
                    lastseen: new Date()
                });
            });
        }

        // Remove from connected users
        connectedUsers.delete(socket.userId);
    });
};

// Clean up stale sessions every 30 minutes
setInterval(() => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [userId, session] of userSessions.entries()) {
        if (now - session.lastUpdated > maxAge) {
            userSessions.delete(userId);
        }
    }
    
    for (const [userId, chats] of chatSessions.entries()) {
        if (now - chats.lastUpdated > maxAge) {
            chatSessions.delete(userId);
        }
    }
}, 30 * 60 * 1000);

module.exports = {
    socketAuth,
    handleConnection,
    connectedUsers,
    userSessions,
    chatSessions
};