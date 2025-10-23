const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const PrivateChat = require('../models/onechat.models');
const Message = require('../models/message.models');
const User = require('../models/user.models');
const ApiResponse = require('../utils/apiResponse');
const { uploadOnCloudinary } = require('../utils/cloudinary');

const createOrGetPrivateChat = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check if users are connected
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.connections.includes(userId)) {
        throw new ApiError(403, 'You can only chat with connected users');
    }

    let chat = await PrivateChat.findOne({
        participants: { $all: [currentUserId, userId] }
    }).populate('participants', 'username avatar status')
      .populate('latestMessage');

    if (!chat) {
        chat = await PrivateChat.create({
            participants: [currentUserId, userId]
        });
        chat = await PrivateChat.findById(chat._id)
            .populate('participants', 'username avatar status');
    }

    res.status(200).json(new ApiResponse(200, chat, 'Chat retrieved'));
});

const getUserChats = asyncHandler(async (req, res) => {
    const chats = await PrivateChat.find({
        participants: req.user._id
    }).populate('participants', 'username avatar status lastseen')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json(new ApiResponse(200, chats, 'Chats retrieved'));
});

const sendMessage = asyncHandler(async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, messageType = 'text' } = req.body;

        console.log('Send message request:', { chatId, content, messageType, userId: req.user._id });

        // Allow empty content if there's a file
        if (!content?.trim() && !req.file) {
            throw new ApiError(400, 'Message content or file is required');
        }

        const chat = await PrivateChat.findById(chatId);
        if (!chat) {
            throw new ApiError(404, 'Chat not found');
        }

        if (!chat.participants.includes(req.user._id)) {
            throw new ApiError(403, 'Not authorized to send message in this chat');
        }

        let fileUrl = null;
        let finalMessageType = messageType;
        
        if (req.file) {
            try {
                const uploadResult = await uploadOnCloudinary(req.file.path);
                if (uploadResult) {
                    fileUrl = uploadResult.secure_url;
                    finalMessageType = uploadResult.resource_type === 'image' ? 'image' : 'file';
                }
            } catch (uploadError) {
                console.error('File upload error:', uploadError);
                throw new ApiError(500, 'File upload failed');
            }
        }

        const message = await Message.create({
            sender: req.user._id,
            content: content || '',
            messageType: finalMessageType,
            fileUrl,
            privateChat: chatId,
            readBy: [req.user._id]
        });

        chat.latestMessage = message._id;
        await chat.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username avatar');

        res.status(201).json(new ApiResponse(201, populatedMessage, 'Message sent'));
    } catch (error) {
        console.error('Send message error:', error);
        throw error;
    }
});

const getChatMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await PrivateChat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
        throw new ApiError(403, 'Not authorized to view this chat');
    }

    const messages = await Message.find({ privateChat: chatId })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    res.status(200).json(new ApiResponse(200, messages.reverse(), 'Messages retrieved'));
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    await Message.updateMany(
        { 
            privateChat: chatId,
            readBy: { $ne: req.user._id }
        },
        { $push: { readBy: req.user._id } }
    );

    res.status(200).json(new ApiResponse(200, null, 'Messages marked as read'));
});

module.exports = {
    createOrGetPrivateChat,
    getUserChats,
    sendMessage,
    getChatMessages,
    markMessagesAsRead
};