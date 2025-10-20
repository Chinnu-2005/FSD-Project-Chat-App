const mongoose=require('mongoose');
const DB_NAME='ChatApp';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.DB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected successfully - Host: ${conn.connection.host}`);

    } catch (err) {
        console.log('Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports=connectDB;

