const Order = require('../models/orderSchema')
const Product = require('../models/productSchema')
const User = require('../models/userSchema')
const Address = require('../models/useraddressSchema')
const Cart = require('../models/cartSchema')
const Wallet = require('../models/walletSchema')
const generatedOtp = require('../controllers/otpController/generateOtp')
const Razorpay = require('razorpay');
const Coupon = require('../models/couponSchema')
const dateGenerator = require('../controllers/otpController/dateGenerator')
const { log } = require('node:console')

var instance = new Razorpay({
  key_id:"rzp_test_lTepvaZWAfuQBF",
  key_secret:"Nf5XW1S8TbnegZtxx7LM3QsB",
});

const createOrder = async(req,res)=>{
    try {
        const amount = parseInt(req.body.totalPrice) 
        const order = await instance.orders.create({
            amount: amount*100,
            currency: "INR",
            receipt: req.session.user
        })
        console.log(order);
        res.json({orderID:order})
    } catch (error) {
        console.log(error.message);
    }
}

const paymentsuccess = async(req,res)=>{
    try {
        const {paymentid,razorpayorderid,signature,orderid} = req.body 
        const {createHmac} = require('node:crypto')
        const hash = createHmac("sha256",'Nf5XW1S8TbnegZtxx7LM3QsB')
        .update(orderid + "|" + paymentid,).digest('hex');

  if (hash == signature) {
    res.status(200).json({success:true})
  }
    } catch (error) { 
        console.log(error.message);
    }
}

const placeOrder = async(req,res)=>{
    try {
        const user = req.session.user
        const userData = await User.findOne({_id:user})
        const cartID = req.body.cartID
        const address = req.body.radiovalue
        const uaddress = await Address.findOne({_id:address})
        const paymentMethod = req.body.paymentMethod
        const Totalprice = req.body.totalPrice 
        const coup = req.body.coupon
        const discount = req.body.discount
        const coupon = await Coupon.findOne({couponcode:coup})
   
        if(paymentMethod=='COD'|| paymentMethod == 'razorpay'){
            const cart = await Cart.findOne({_id:cartID}).populate('items.productID')
            console.log('the cart is',cart);
            const cproduct = cart.items.map((element=>{
                let pdata = {
                    product:element.productID,
                    size:element.size,
                    quantity:element.quantity,
                    amount:element.amount
                }
                console.log(pdata);
                return pdata;
            }))
            if(coupon){
                await Coupon.findOneAndUpdate({couponcode:coup},{$push:{user:user}})
            }
            const date = dateGenerator()
            const order =   new Order({
                user:userData.email,
                address:uaddress,
                products:cproduct,
                coupon:coup,
                discount:discount,
               
                totalamount:Totalprice,
                paymentmethod:paymentMethod,
                date:date
            })
            const myorder = await order.save()

            const typedreferalcode = userData.otherreferalcode
            const refereduser = await User.findOne({referalcode:typedreferalcode})
            if(myorder){
                if (typedreferalcode&&refereduser) {
                    const userorder = await Order.find({user:userData.email})
                    if (userorder.length == 1) {
                        const referalAmount = parseInt(500)
                        const otherwallet = await Wallet.findOneAndUpdate({user:refereduser._id},{$inc:{balance:referalAmount}})
                        const userreferalamount = parseInt(250)
                        const userwallet = await Wallet.findOneAndUpdate({user:userData._id},{$inc:{balance:userreferalamount}})
                    }
                }
            }

            let productArray = []
            myorder.products.forEach(element => {
                let prodata = {
                    productId:element.product,
                    quantity:element.quantity,
                    size:element.size
                }
                productArray.push(prodata)
            });
            productArray.forEach(async(el)=>{
                await Product.findByIdAndUpdate({_id:el.productId},{$inc:{[`size.${el.size}.quantity`]:-el.quantity}})
            })
            console.log('item decremented');
            const delcart = await Cart.findOneAndDelete({_id:cartID})

            // const userreferalcode = userData.referalcode
          
            res.status(200).json({success:true,id:myorder._id})
        }else {
            res.status(400).json({success:false})
        }

    } catch (error) {
        console.log(error.message);
    }
}

const orderSuccess = async(req,res)=>{
    try {
       
        res.render('ordersuccess')
    } catch (error) {
        console.log(error.message);
    }
}

const getOrder = async(req,res)=>{
    try {
        const userID = req.session.user
        const userr = await User.findOne({_id:userID})
        console.log(' the user id ',userr);
        const order = await Order.find({user:userr.email}).populate('products.product')
        console.log('the order is', order);
        res.render('orders',{ order,userID})
    } catch (error) {
        console.log(error.message);
    }
}

const getViewOrder = async(req,res)=>{
    try {
        const userID = req.session.user
        const orderID = req.query.id
        const order = await Order.find({_id:orderID}).populate("products.product")
        console.log('the order :'+order);
        
        res.render('viewOrder',{order,userID})
    } catch (error) {
        console.log(error.message);
    }
}

const usercancelOrder = async(req,res)=>{
    try {
        const user = req.session.user
        const orderID = req.body.orderID
        
        const corder = await Order.findByIdAndUpdate({_id:orderID},
            {$set:{
                status:"Cancelled"
            }})
            let productArray = []
            corder.products.forEach(element =>{
                let prodata = {
                    productID:element.product,
                    quantity:element.quantity,
                    size:element.size
                }
                productArray.push(prodata)
            })
            productArray.forEach(async(el)=>{
                await Product.findByIdAndUpdate({_id:el.productID},{$inc:{[`size.${el.size}.quantity`]:el.quantity}})
            })
            if(corder.paymentmethod = 'razorpay'){
                const wallet = await Wallet.find({user:user})
                if(wallet){
                    
                    await Wallet.findOneAndUpdate({user:user},{$push:{walletdata:{history:corder.totalamount,date:new Date(),paymentmethod:"razorpay",transactionID:generatedOtp()}},$inc:{balance:corder.totalamount}})
                }
            }
            res.status(200).json({success:true})
    } catch (error) { 
        console.log(error.message);
    }
}

const displayOrder = async(req,res)=>{
    try { 
        const userID = req.session.user
        const order = await Order.find({})
        res.render('orderlist',{order,userID})
    } catch (error) {
        console.log(error.message);
    }
}

const returnOrder = async(req,res)=>{
    try {
        const orderID = req.body.orderID
        const order = await Order.findByIdAndUpdate({_id:orderID},
            {$set:{
                status:"Return Processing"
            }})

        if(order.status =="Returned"){
            let productArray = []
            order.products.forEach(element =>{
                let prodata = {
                    productID:element.productID,
                    quantity:element.quantity,
                    size:element.size
                }
                productArray.push(prodata)
            })
            console.log('the product array is ',productArray);
            productArray.forEach(async(el)=>{
                 await Product.findByIdAndUpdate({_id:el.productID},{$inc:{[`size.${el.size}.quantity`]:el.quantity}})
            })
        }
        res.status(200).json({succes:true})

    } catch (error) {
        console.log(error.message);
    }
}

const cancelReturn = async(req,res)=>{
    try {
        const orderID = req.body.orderID
        const order = await Order.findByIdAndUpdate({_id:orderID},{$set:{status:"Delivered"}})
        res.status(200).json({success:true})
    } catch (error) {
        console.log(error.message);
    }
}

const displayOrderDetailes = async(req,res)=>{
    try {

        const orderID = req.query.id
        const order = await Order.find({_id:orderID}).populate('products.product').populate('user').populate('address')
        console.log("orderis :"+order);
        res.render('orderdetails',{order})
    } catch (error) {
        console.log(error.message);
    }
}

const paymentfailed = async(req,res)=>{
    try {
        const user = req.session.user
        const userData = await User.findOne({_id:user})
        const cartID = req.body.cartID
        const address = req.body.radiovalue
        const uaddress = await Address.findOne({_id:address})
        const price = req.body.totalPrice
        const coupon = req.body.coupon
        const paymentMethod = req.body.paymentMethod

        const cart = await Cart.findOne({_id:cartID}).populate('items.productID')
            const cproduct = cart.items.map((element=>{
                let pdata = {
                    product:element.productID,
                    size:element.size,
                    quantity:element.quantity,
                    amount:element.amount
                }
                return pdata;
            }))

            const date = dateGenerator()
            const order =   new Order({
                user:userData.email,
                address:uaddress,
                products:cproduct,
                coupon:coupon,
                totalamount:price,
                paymentmethod:paymentMethod,
                date:date,
                status:"Payment Failed"
            })
            const myorder = await order.save()
            res.status(200).json({success:true,id:myorder._id})

    } catch (error) {
        console.log(error);
    }
}

const payAgain = async(req,res)=>{
    try {
        const orderId = req.body.id
        console.log(orderId);
        const orders = await Order.findOne({_id:orderId})
        console.log('the orders is',orders);
        const order = await instance.orders.create({
            amount: orders.totalamount*100,
            currency: "INR",
            receipt: req.session.user
        })
        console.log('the orderis :',order);
        res.json({orderID:order})
    } catch (error) {
        console.log(error.message);
    }
}

const successPayment = async(req,res)=>{
    try {
        const user = req.session.user
        const {response,orderId,orderid} = req.body
        console.log(req.body);
        const {createHmac} = require('node:crypto')
        const hash = createHmac("sha256",'Nf5XW1S8TbnegZtxx7LM3QsB')
        .update(orderId + "|" + response.razorpay_payment_id,).digest('hex');

        if(hash == response.razorpay_signature){
            const order = await Order.findByIdAndUpdate({_id:orderid},{
                $set:{
                    status:"Confirmed"
                }
            })
        } 

        const myorder = await Order.findOne({_id:orderid})
        let productArray=[]
        myorder.products.forEach(element => {
            let prodata = {
                productId:element.product,
                quantity:element.quantity,
                size:element.size
            }
            productArray.push(prodata)
        });
        productArray.forEach(async(el)=>{
            const product = await Product.findById({_id:el.productId})
            console.log('the product is',product);
            if(product.size[el.size].quantity <= 0){
                return res.status(200).json({ success: false, message: 'Out of Stock' });
            }else{
            await Product.findByIdAndUpdate({_id:el.productId},{$inc:{[`size.${el.size}.quantity`]:-el.quantity}})
            const cart = await Cart.findOneAndDelete({user:user})
            }
        })
        res.json({success:true})

    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    placeOrder,
    orderSuccess,
    getOrder,
    getViewOrder,
    usercancelOrder,
    displayOrder,
    displayOrderDetailes,
    returnOrder,
    cancelReturn,
    createOrder,    
    paymentsuccess,
    paymentfailed,
    payAgain,
    successPayment
}