require('dotenv').config('./.env');
const app=require('./app');
const connectDB=require('./db/db');
const http = require('http');
const initializeSocket = require('./socket');

const server = http.createServer(app);
const io = initializeSocket(server);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.log('MongoDB connection failed:', err);
});






