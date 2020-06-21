const mongoose=require('mongoose')
const validator=require('validator')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const Task = require('./tasks')
const userSchema=mongoose.Schema({
    Name:{
        type:String,
        required:true,
        trim:true

    },
    Email:{
        unique:true,
        type:String,
        autoIndex:true,
        required:true,
        lowercase:true,
        trim:true,
        validate(value){
            if(!validator.isEmail(value))
            {
                throw new Error("Invalid Email Address Provided")
            }
        }
    },
    Password:{
        type:String,
        required:true,
        minlength:7,
        validate(value)
        {
            if(validator.contains(value.toLowerCase(),"password"))
            
            {
                throw new Error("Invalid Passsword")
            }
        },
        trim:true
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
},{
    timestamps: true
})


userSchema.index({  Email: 1 }, { unique: true});

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'Owner'
})

userSchema.methods.toJSON=function(){
    const user=this
    const userObject=user.toObject()

    delete userObject.Password
    delete userObject.__v
    delete userObject.tokens
    delete userObject.avatar
    
    return userObject
}

userSchema.methods.generateToken = async function (){
     const user=this
     const token=jwt.sign({_id:user._id.toString()},'process.env.JWT_SECRET')
    user.tokens=user.tokens.concat({token})

    await user.save()

     return token
}

userSchema.statics.findByCredentials= async (Email,Password)=>{
    const user= await User.findOne({Email})
    if(!user)
    {
        throw new Error('Wrong Credentials')
    }
    const isMatch= await bcrypt.compare(Password,user.Password)
    if(!isMatch)
    {
        throw new Error('Wrong Credentials')
        
    }
    return user

}
userSchema.pre('save', async function(next){
    const user = this

    if(user.isModified('Password')){
        user.Password=await bcrypt.hash(user.Password,8)

    }

    next()
})
userSchema.pre('remove',async function(next){
    const user = this
    await Task.deleteMany({Owner: user._id})

    next()
})

const User = mongoose.model('users',userSchema)




module.exports=User