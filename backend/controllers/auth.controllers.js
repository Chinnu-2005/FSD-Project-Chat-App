const asyncHandler=require('../utils/asyncHandler');
const ApiError=require('../utils/apiError');
const User=require('../models/user.models');
const ApiResponse=require('../utils/apiResponse');
const jwt=require('jsonwebtoken');


const generateAuthandRefreshToken=async (userId)=>{
    try{

        const user=await User.findById(userId);
        if(!user){
            throw new ApiError(404,'User not found');
        }
        const authToken=user.generateAuthtoken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {authToken,refreshToken};

    }catch(err){
        throw new ApiError(500,'Internal server error');
    }
}   

const registerUser=asyncHandler(
    async(req,res)=>{
        const {username,email,password}=req.body;
        
        if( [
                email,username,password
            ].some((field)=>field?.trim()==="")
            ){
                throw new ApiError(400,"All fields are required");
            }
        
        const existingUser=await User.findOne({$or:[{email},{username}]});
        

        if(existingUser){
            throw new ApiError(400,'User with given email or username already exists');
        }


        const user=await User.create({
            username,
            email,
            password
        })

         const createduser=await User.findById(user._id).select(
        "-password -refreshToken"
        )

        if(!createduser){
            throw new ApiError(500,"Something error has occured while registering");
        }

        return res.status(201).json(
            new ApiResponse(201,"User created successfully",createduser)    
        );  
        
    }
)


const loginUser=asyncHandler(
    async (req,res)=>{
        const {username,password}=req.body;
        if(!username){
            throw new ApiError(402,"Username is required");
        }
        const user=await User.findOne({username});

        
        if(!user){
            throw new ApiError(402,"User doesnot exists");
        }

        const isPasswordValid=await user.validatePassword(password);
        if(!isPasswordValid){
            throw new ApiError(402,"Invalid Credentials");
        }

        const {authToken,refreshToken}=await generateAuthandRefreshToken(user._id);

        const loggedinUser=await User.findById(user._id).select("-password -refreshToken");

        const options={
            httpOnly:true,
            secure:true 
        }

        return res.status(200)
        .cookie("refreshToken",refreshToken,options).cookie("authToken",authToken,options).json(
            new ApiResponse(
                200,
                {
                    user:loggedinUser,
                    authToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )

    }
);


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
        .clearCookie('authToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged out'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unauthorized request');
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used');
        }

        const { authToken, refreshToken } = await generateAuthandRefreshToken(user._id);

        const options = {
            httpOnly: true,
            secure: true
        };

        return res.status(200)
            .cookie('authToken', authToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(new ApiResponse(200, { authToken, refreshToken }, 'Access token refreshed'));

    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token');
    }
});

module.exports = { registerUser, loginUser, logoutUser, refreshAccessToken };



