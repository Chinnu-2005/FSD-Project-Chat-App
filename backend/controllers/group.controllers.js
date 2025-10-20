const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const GroupChat = require('../models/groupchat.models');
const Message = require('../models/message.models');
const User = require('../models/user.models');
const ApiResponse = require('../utils/apiResponse');
const { uploadOnCloudinary } = require('../utils/cloudinary');

const createGroup = asyncHandler(async (req, res) => {
    const { groupName, description, groupImage, memberIds = [] } = req.body;

    if (!groupName) {
        throw new ApiError(400, 'Group name is required');
    }

    const members = [req.user._id, ...memberIds];
    const uniqueMembers = [...new Set(members)];

    const group = await GroupChat.create({
        groupName,
        description,
        groupImage,
        members: uniqueMembers,
        admins: [req.user._id]
    });

    const populatedGroup = await GroupChat.findById(group._id)
        .populate('members', 'username avatar')
        .populate('admins', 'username avatar');

    res.status(201).json(new ApiResponse(201, populatedGroup, 'Group created successfully'));
});

const getUserGroups = asyncHandler(async (req, res) => {
    const groups = await GroupChat.find({
        members: req.user._id
    }).populate('members', 'username avatar status')
      .populate('admins', 'username avatar')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json(new ApiResponse(200, groups, 'Groups retrieved'));
});

const getGroupDetails = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await GroupChat.findById(groupId)
        .populate('members', 'username avatar status lastseen')
        .populate('admins', 'username avatar');

    if (!group) {
        throw new ApiError(404, 'Group not found');
    }

    const isMember = group.members.some(member => member._id.toString() === req.user._id.toString());
    if (!isMember) {
        throw new ApiError(403, 'Not a member of this group');
    }

    res.status(200).json(new ApiResponse(200, group, 'Group details retrieved'));
});

const sendGroupMessage = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { content, messageType = 'text' } = req.body;

    const group = await GroupChat.findById(groupId);
    if (!group) {
        throw new ApiError(404, 'Group not found');
    }

    const isMember = group.members.some(member => member._id.toString() === req.user._id.toString());
    if (!isMember) {
        throw new ApiError(403, 'Not authorized to send message in this group');
    }

    let fileUrl = null;
    let finalMessageType = messageType;
    
    if (req.file) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (uploadResult) {
            fileUrl = uploadResult.secure_url;
            finalMessageType = uploadResult.resource_type === 'image' ? 'image' : 'file';
        }
    }

    const message = await Message.create({
        sender: req.user._id,
        content: content || '',
        messageType: finalMessageType,
        fileUrl,
        groupChat: groupId,
        readBy: [req.user._id]
    });

    group.latestMessage = message._id;
    await group.save();

    const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username avatar');

    res.status(201).json(new ApiResponse(201, populatedMessage, 'Message sent'));
});

const getGroupMessages = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const group = await GroupChat.findById(groupId);
    if (!group || !group.members.includes(req.user._id)) {
        throw new ApiError(403, 'Not authorized to view this group');
    }

    const messages = await Message.find({ groupChat: groupId })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    res.status(200).json(new ApiResponse(200, messages.reverse(), 'Messages retrieved'));
});

const addMember = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await GroupChat.findById(groupId);
    if (!group) {
        throw new ApiError(404, 'Group not found');
    }

    if (!group.admins.includes(req.user._id)) {
        throw new ApiError(403, 'Only admins can add members');
    }

    if (group.members.includes(userId)) {
        throw new ApiError(400, 'User is already a member');
    }

    group.members.push(userId);
    await group.save();

    res.status(200).json(new ApiResponse(200, null, 'Member added successfully'));
});

const removeMember = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await GroupChat.findById(groupId);
    if (!group) {
        throw new ApiError(404, 'Group not found');
    }

    if (!group.admins.includes(req.user._id)) {
        throw new ApiError(403, 'Only admins can remove members');
    }

    group.members.pull(userId);
    group.admins.pull(userId);
    await group.save();

    res.status(200).json(new ApiResponse(200, null, 'Member removed successfully'));
});

const promoteToAdmin = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await GroupChat.findById(groupId);
    if (!group) {
        throw new ApiError(404, 'Group not found');
    }

    if (!group.admins.includes(req.user._id)) {
        throw new ApiError(403, 'Only admins can promote members');
    }

    if (!group.members.includes(userId)) {
        throw new ApiError(400, 'User is not a member');
    }

    if (!group.admins.includes(userId)) {
        group.admins.push(userId);
        await group.save();
    }

    res.status(200).json(new ApiResponse(200, null, 'Member promoted to admin'));
});

const updateGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { groupName, description } = req.body;
    
    const group = await GroupChat.findById(groupId);
    if (!group) {
        throw new ApiError(404, 'Group not found');
    }
    
    const isAdmin = group.admins.some(admin => admin._id.toString() === req.user._id.toString());
    if (!isAdmin) {
        throw new ApiError(403, 'Only admins can edit group');
    }
    
    const updateData = {};
    if (groupName) updateData.groupName = groupName;
    if (description !== undefined) updateData.description = description;
    
    if (req.file) {
        const imageResult = await uploadOnCloudinary(req.file.path);
        if (imageResult) {
            updateData.groupImage = imageResult.secure_url;
        }
    }
    
    const updatedGroup = await GroupChat.findByIdAndUpdate(
        groupId,
        updateData,
        { new: true }
    ).populate('members', 'username avatar status')
     .populate('admins', 'username avatar');
    
    res.status(200).json(new ApiResponse(200, updatedGroup, 'Group updated successfully'));
});

const leaveGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await GroupChat.findById(groupId);
    if (!group) {
        throw new ApiError(404, 'Group not found');
    }

    group.members.pull(req.user._id);
    group.admins.pull(req.user._id);
    await group.save();

    res.status(200).json(new ApiResponse(200, null, 'Left group successfully'));
});

module.exports = {
    createGroup,
    getUserGroups,
    getGroupDetails,
    sendGroupMessage,
    getGroupMessages,
    addMember,
    removeMember,
    promoteToAdmin,
    updateGroup,
    leaveGroup
};