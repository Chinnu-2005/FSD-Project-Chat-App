const jwt = require('jsonwebtoken');
const User = require('../models/user.models');
const Message = require('../models/message.models');
const PrivateChat = require('../models/onechat.models');
const GroupChat = require('../models/groupchat.models');
const Notification = require('../models/notification.models');

const connectedUsers = new Map();

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
    
    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, { 
        status: 'online',
        lastseen: new Date()
    });

    // Store connected user
    connectedUsers.set(socket.userId, socket.id);

    // Join user to their personal room
    socket.join(socket.userId);

    // Join user to all their chat rooms
    const privateChats = await PrivateChat.find({ participants: socket.userId });
    const groupChats = await GroupChat.find({ members: socket.userId });

    privateChats.forEach(chat => {
        socket.join(chat._id.toString());
    });

    groupChats.forEach(group => {
        socket.join(group._id.toString());
    });

    // Notify connections about online status and send queued notifications
    const user = await User.findById(socket.userId).populate('connections');
    user.connections.forEach(connection => {
        socket.to(connection._id.toString()).emit('user_online', {
            userId: socket.userId,
            username: socket.user.username
        });
    });
    
    // Send queued notifications for offline messages
    const queuedNotifications = await Notification.find({
        recipient: socket.userId,
        isRead: false
    }).populate('sender', 'username').populate('message');
    
    if (queuedNotifications.length > 0) {
        socket.emit('queued_notifications', {
            count: queuedNotifications.length,
            notifications: queuedNotifications
        });
        
        // Mark notifications as read
        await Notification.updateMany(
            { recipient: socket.userId, isRead: false },
            { isRead: true }
        );
    }

    // Handle private message
    socket.on('send_private_message', async (data) => {
        try {
            const { chatId, content, messageType = 'text', fileUrl } = data;

            const chat = await PrivateChat.findById(chatId);
            if (!chat || !chat.participants.includes(socket.userId)) {
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

            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'username avatar');

            // Update chat's latest message
            chat.latestMessage = message._id;
            await chat.save();

            // Emit to all participants and queue for offline users
            const otherParticipant = chat.participants.find(p => p.toString() !== socket.userId);
            const isRecipientOnline = connectedUsers.has(otherParticipant.toString());
            
            socket.to(chatId).emit('new_private_message', populatedMessage);
            socket.emit('message_sent', populatedMessage);
            
            // Queue notification for offline user
            if (!isRecipientOnline) {
                await Notification.create({
                    recipient: otherParticipant,
                    type: 'message',
                    message: message._id,
                    sender: socket.userId,
                    chatId: chatId,
                    isGroup: false
                });
            }

        } catch (error) {
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
        
        // Update user status to offline
        await User.findByIdAndUpdate(socket.userId, { 
            status: 'offline',
            lastseen: new Date()
        });

        // Remove from connected users
        connectedUsers.delete(socket.userId);

        // Notify connections about offline status
        const user = await User.findById(socket.userId).populate('connections');
        user.connections.forEach(connection => {
            socket.to(connection._id.toString()).emit('user_offline', {
                userId: socket.userId,
                username: socket.user.username,
                lastseen: new Date()
            });
        });
    });
};

module.exports = {
    socketAuth,
    handleConnection,
    connectedUsers
};