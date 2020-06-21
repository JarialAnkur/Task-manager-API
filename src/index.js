const express=require('express')
require('./db/mongoose')

const UserRoute= require('./routers/users')
const TaskRoute= require('./routers/task')



const app=express()

app.use(express.json())
app.use(UserRoute)
app.use(TaskRoute)

const port=process.env.PORT




app.listen(port,()=>{
    console.log("Server is successfully running on Port "+ port)
})

