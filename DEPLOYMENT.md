# Deployment Guide for Render

## Backend Deployment

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the `backend` folder as root directory
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Set Environment Variables**
   ```
   PORT=10000
   DB_URI=mongodb+srv://username:password@cluster.mongodb.net
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ACCESS_TOKEN_SECRET=your-access-token-secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your-refresh-token-secret
   REFRESH_TOKEN_EXPIRY=10d
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_SECRET_KEY=your-cloudinary-secret
   ```

## Frontend Deployment

1. **Create a new Static Site on Render**
   - Connect your GitHub repository
   - Select the `frontend` folder as root directory
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_SOCKET_URL=https://your-backend-url.onrender.com
   ```

## Important Notes

- Deploy backend first, then update frontend environment variables with backend URL
- Update CORS_ORIGIN in backend with frontend URL after frontend deployment
- Use MongoDB Atlas for database (free tier available)
- Use Cloudinary for file storage (free tier available)

## Post-Deployment

1. Update backend CORS_ORIGIN with actual frontend URL
2. Test all functionality including real-time messaging
3. Verify file uploads work with Cloudinary