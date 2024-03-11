const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
   user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
   },
   items:[{
    productID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        require:true
    },
    quantity:{
        type:Number,
    },
    price:{
        type:Number
    },
    size:{
        type:String,
        required:true
    }
   }],
   totalPrice:{
    type:Number
   }
})

module.exports = mongoose.model('Cart',cartSchema)