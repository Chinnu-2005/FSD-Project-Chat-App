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
        if (!filePath) {
            console.log('No file path provided');
            return null;
        }
        
        console.log('Uploading file to Cloudinary:', filePath);
        console.log('Cloudinary config:', {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
            api_secret: process.env.CLOUDINARY_SECRET_KEY ? 'Set' : 'Not set'
        });
        
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto'
        });
        
        console.log('Cloudinary upload successful:', response.secure_url);
        
        // Remove file from local storage after upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return response;
        
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        // Remove file from local storage if upload fails
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw error; // Throw error instead of returning null
    }
};

module.exports = { uploadOnCloudinary };