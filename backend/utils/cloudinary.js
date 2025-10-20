const cloudinary=require('cloudinary').v2
const fs=require('fs')

cloudinary.config(
    {
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret:process.env.CLOUDINARY_SECRET_KEY
    }
)

const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;
        
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto'
        });
        
        // Remove file from local storage after upload
        fs.unlinkSync(filePath);
        return response;
        
    } catch (error) {
        // Remove file from local storage if upload fails
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return null;
    }
};

module.exports = { uploadOnCloudinary };