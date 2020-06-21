const express=require('express')
const User = require('../models/users')
const auth=require('../middlewares/auth')
const multer=require('multer')
const { findById } = require('../models/users')
const sharp=require('sharp')
const router= new express.Router()

router.post('/users', async (req,res)=>
{
    const user=new User(req.body)

    try{
        const token=await user.generateToken()
        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send(e)

    }
})
router.post('/users/login',async (req,res)=>{
    try{
        const user= await  User.findByCredentials(req.body.Email,req.body.Password)
        const token = await user.generateToken()
        res.send({user,token})
    }catch(e){
        res.status(400).send({error:'Wrong credentials'})
    }
})
router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>{
            return token.token!==req.token
        })
        await req.user.save()
        res.send('Logged out Successfully')
    }catch(e){
        res.status(400).send({error:'Something went wrong'})
    }
})
router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send('Logged out of all sessions Successfully')
    }catch(e){
        res.status(400).send({error:'Something went wrong'})
    }
})
router.get('/users/me', auth, async(req,res)=>{
    
    res.send(req.user)
})
router.patch('/users/update',auth,async(req,res)=>{
    const updates=Object.keys(req.body)
    const AllowedUpdates=['Name','Email','Password','Age']
    const isValidUpdate=updates.every((update)=>AllowedUpdates.includes(update))
    if(!isValidUpdate)
    {
     return    res.status(400).send({error:'Invalid request'})
    }
    
    try{
       
        updates.forEach((update)=>{
            req.user[update]=req.body[update]
        })
        await req.user.save()
        //const user= await User.findByIdAndUpdate(req.params.id,req.body,{new:true, runValidators:true})

        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})
router.delete('/users/delete_me',auth,async(req,res)=>{
    try{
        await req.user.remove()
       res.send(req.user)

}catch(e){
    res.status(400).send(e)
}
})
const upload=multer({
    limits:{
            fileSize:1000000
    },
    fileFilter(req,file,cb){
            if(!file.originalname.match(/\.(jpeg|jpg|png)$/))
            {
                return cb(new Error('Please upload a jpeg/jpg/png  File'))
            }
            cb(undefined,true)
    }
})
router.post('/users/me/avatar',auth,upload.single('avatar'),async (req,res)=>{
    const buffer=await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar=buffer
    await req.user.save()
    res.send()  
},(error,req,res,next)=>{
    res.status(400).send({error:error.message})
})
router.get('/users/:id/avatar',async(req,res)=>{
    try{
        const user=await User.findById(req.params.id)
        if(!user|| !user.avatar){
            throw new Error
        }
        res.set('Content-Type','Image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send({error:'Something went wrong'})
    }
})
router.delete('/users/me/remavatar',auth,async(req,res)=>{
    try{
   req.user.avatar=undefined
   await req.user.save()
        res.status(200).send('Avatar removed Successfully')
    }catch(e)
    {
        res.status(404).send({error:'Something went wrong  '})
    }
})

module.exports=router