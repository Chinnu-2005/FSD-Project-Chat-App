const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadOnCloudinary } = require('../utils/cloudinary');

const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
    }

    const result = await uploadOnCloudinary(req.file.path);
    
    if (!result) {
        throw new ApiError(500, 'Failed to upload file');
    }

    res.status(200).json(new ApiResponse(200, {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type
    }, 'File uploaded successfully'));
});

module.exports = { uploadFile };