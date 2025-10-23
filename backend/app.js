const express=require('express');
const app=express();
// Updated CORS configuration
const cors=require('cors');
const cookieParser=require('cookie-parser');

app.use(express.json());

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(cookieParser());
app.use(express.urlencoded({extended:true}));

// Routes
const authRoutes=require('./routes/auth.routes');
const userRoutes=require('./routes/user.routes');
const chatRoutes=require('./routes/chat.routes');
const groupRoutes=require('./routes/group.routes');
const uploadRoutes=require('./routes/upload.routes');

app.use('/api/auth',authRoutes);
app.use('/api/users',userRoutes);
app.use('/api/chats',chatRoutes);
app.use('/api/groups',groupRoutes);
app.use('/api/upload',uploadRoutes);

// Health check route
app.get('/', (req, res) => {
    res.json({ message: 'Chat App Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || []
    });
});





module.exports=app;




