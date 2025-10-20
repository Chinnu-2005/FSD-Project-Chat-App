// Simple test script to verify the setup
const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
    try {
        await mongoose.connect(`mongodb://localhost:27017/ChatApp`);
        console.log('✅ Database connection successful');
        
        // Test environment variables
        const requiredEnvVars = [
            'ACCESS_TOKEN_SECRET',
            'REFRESH_TOKEN_SECRET',
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_API_KEY',
            'CLOUDINARY_SECRET_KEY'
        ];
        
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.log('❌ Missing environment variables:', missingVars);
        } else {
            console.log('✅ All environment variables are set');
        }
        
        mongoose.connection.close();
        console.log('✅ Test completed successfully');
        
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
    }
};

testConnection();