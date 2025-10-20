const jwt=require('jsonwebtoken')
const User=require('../models/user.models');
const ApiError=require('../utils/apiError');
const asyncHandler=require('../utils/asyncHandler');

const verifyJWT = asyncHandler(
    async (req, res, next) => {
        try {
            const token = req.cookies?.authToken || req.header("Authorization")?.replace("Bearer ", "");
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized Access"
                });
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            
            if (!decoded?._id) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid Token"
                });
            }

            const user = await User.findById(decoded._id);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User Not Found"
                });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid Token"
            });
        }
    }
)


module.exports={
    verifyJWT
}