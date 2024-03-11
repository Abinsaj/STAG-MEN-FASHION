const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
        user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
        },
        name:{
            type:String,
            required:true,
        },
        mobile:{
            type:Number,
            required:true
        },
        pincode:{
            type:Number,
            required:true
        },
        locality:{
            type:String
        },
        Address:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        country:{
            type:String
        },
        createdAt:{
            type:Date,
            default:Date.now()
        }

       
    
})

module.exports = mongoose.model('Address',addressSchema)