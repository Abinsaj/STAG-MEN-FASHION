const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product'
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    date:{
        type:String,
        required:true
    },
    star:{
        type:Number,
        default:1
    }
})

module.exports = mongoose.model('Review',reviewSchema)