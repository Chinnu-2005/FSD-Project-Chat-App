const { Server } = require('socket.io');
const { socketAuth, handleConnection } = require('./socketHandlers');

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    // Authentication middleware
    io.use(socketAuth);

    // Handle connections
    io.on('connection', handleConnection);

    return io;
};

module.exports = initializeSocket;