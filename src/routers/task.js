const express=require('express')
const Task = require('../models/tasks')
const auth=require('../middlewares/auth')
const User=require('./users')
const router= new express.Router()

router.get('/tasks/:id',auth,async (req,res)=>{
    const _id=req.params.id

    try{
        const task = await Task.findOne({_id,Owner:req.user._id})
        if(!task){
            return res.status(404).send(e)
        }
        res.send(task)
    }catch(e){
        res.send(e)

    }
})
router.get('/tasks',auth, async (req,res)=>{
    const match={}
    const sort={}
    if(req.query.completed){
        match.Completed=req.query.completed === "true"
        }
    if(req.query.sortBy)
    {
        const parts=req.query.sortBy.split('-')
        sort[parts[0]]=parts[1]==='desc'? -1 : 1
    }
    try{
        
        await req.user.populate({
            path:'tasks',
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
     }catch(e){
         res.status(500).send(e)
 
     }
})
router.post('/tasks',auth,async(req,res)=>{
    const task= new Task({
        ...req.body,
        Owner:req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }
    catch(e){
        res.status(400).send(e)
    }
})
router.patch('/tasks/:id', auth,async(req,res)=>{
    const updates=Object.keys(req.body)
    const AllowedUpdates=['Description','Completed']
    const isValidUpdate=updates.every((update)=>AllowedUpdates.includes(update))
    if(!isValidUpdate)
    {
     return    res.status(400).send({error:'Invalid request'})
    }
    try{
        const task= await Task.findOne({_id:req.params.id, Owner:req.user._id}  )
        updates.forEach((update)=>{
            task[update]=req.body[update]
        })
        await task.save()
        //const task= await Task.findByIdAndUpdate(req.params.id,req.body,{new:true, runValidators:true})
        if(!task){
            return res.status(400).send({error:"No task found"})
        }
        res.send(task)
    }catch(e){
        res.status(400).send(e)
    }
})
router.delete('/tasks/:id',auth,async(req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id:req.params.id,Owner:req.user._id})
    if(!task){
       return  res.status(404).send({error:"Task with the id not found"})
    }
    res.send(task)
}catch(e){
    res.status(400).send(e)
}
})

module.exports= router