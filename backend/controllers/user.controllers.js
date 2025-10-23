const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const User = require('../models/user.models');
const ApiResponse = require('../utils/apiResponse');
const { uploadOnCloudinary } = require('../utils/cloudinary');

const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
});

const updateProfile = asyncHandler(async (req, res) => {
    try {
        const { bio } = req.body;
        const updateData = { bio };
        
        console.log('Profile update request:', { bio, hasFile: !!req.file });
        
        if (req.file) {
            try {
                console.log('Uploading file to Cloudinary:', req.file.path);
                const avatarResult = await uploadOnCloudinary(req.file.path);
                if (avatarResult) {
                    updateData.avatar = avatarResult.secure_url;
                    console.log('Avatar uploaded successfully:', avatarResult.secure_url);
                } else {
                    console.log('Avatar upload failed - no result');
                }
            } catch (uploadError) {
                console.error('Avatar upload error:', uploadError);
                // Continue without avatar update if upload fails
            }
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        ).select('-password -refreshToken');
        
        console.log('Profile updated successfully for user:', req.user._id);
        res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
    } catch (error) {
        console.error('Profile update error:', error);
        throw error;
    }
});

const sendConnectionRequest = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
        throw new ApiError(400, 'Cannot send request to yourself');
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    if (targetUser.pendingRequests.includes(currentUserId)) {
        throw new ApiError(400, 'Request already sent');
    }

    if (targetUser.connections.includes(currentUserId)) {
        throw new ApiError(400, 'Already connected');
    }

    targetUser.pendingRequests.push(currentUserId);
    await targetUser.save();

    res.status(200).json(new ApiResponse(200, null, 'Connection request sent'));
});

const acceptConnectionRequest = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user._id);

    if (!currentUser.pendingRequests.includes(userId)) {
        throw new ApiError(400, 'No pending request from this user');
    }

    currentUser.pendingRequests.pull(userId);
    currentUser.connections.push(userId);
    await currentUser.save();

    const otherUser = await User.findById(userId);
    otherUser.connections.push(req.user._id);
    await otherUser.save();

    // Clear socket session cache for both users to force refresh
    const { userSessions, chatSessions } = require('../socket/socketHandlers');
    userSessions.delete(req.user._id.toString());
    userSessions.delete(userId);
    chatSessions.delete(req.user._id.toString());
    chatSessions.delete(userId);

    res.status(200).json(new ApiResponse(200, null, 'Connection request accepted'));
});

const declineConnectionRequest = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user._id);

    currentUser.pendingRequests.pull(userId);
    await currentUser.save();

    res.status(200).json(new ApiResponse(200, null, 'Connection request declined'));
});

const getConnections = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('connections', 'username avatar status lastseen');
    res.status(200).json(new ApiResponse(200, user.connections, 'Connections fetched'));
});

const getPendingRequests = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('pendingRequests', 'username avatar bio');
    res.status(200).json(new ApiResponse(200, user.pendingRequests, 'Pending requests fetched'));
});

const searchUsers = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const users = await User.find({
        $and: [
            { _id: { $ne: req.user._id } },
            {
                $or: [
                    { username: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ]
            }
        ]
    }).select('username avatar bio status').limit(10);

    res.status(200).json(new ApiResponse(200, users, 'Users found'));
});

module.exports = {
    getUserProfile,
    updateProfile,
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    getConnections,
    getPendingRequests,
    searchUsers
};