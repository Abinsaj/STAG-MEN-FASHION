const mongoose = require('mongoose')

const adminSchema = mongoose.Schema({
    
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_Admin:{
        type:Boolean,
        default:true
    }
})



module.exports =  mongoose.model('Admin',adminSchema)