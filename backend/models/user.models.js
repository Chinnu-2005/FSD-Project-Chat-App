const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const {Schema}=require('mongoose');

const userSchema=new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true
        },
        email:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true
        },
        avatar:{
            type:String
        },
        bio:{
            type:String,
            default:"",
            maxlength:150
        },
        status:{
            type:String,
            enum:['online','offline'],
            default:'offline'
        },
        connections:[{  
            type:Schema.Types.ObjectId,
            ref:'User'
        }],
        pendingRequests:[{  
            type:Schema.Types.ObjectId,
            ref:'User'  
        }],
        lastseen:{
            type:Date,
            default:Date.now
        },
        refreshToken:{
            type:String
        }

    },
    {
        timestamps:true
    }
)

userSchema.pre("save",async function(next){
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
})

userSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAuthtoken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
   return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


module.exports=mongoose.model('User',userSchema);