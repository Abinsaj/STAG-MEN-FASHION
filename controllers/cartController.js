const Cart = require('../models/cartSchema')
const Product = require('../models/productSchema')
const Address = require('../models/useraddressSchema')
const Order = require('../models/orderSchema')
const Coupon = require('../models/couponSchema')

const addToCart = async (req, res) => {
    try {
        const user = req.session.user;
        const { productID, quantity, size } = req.body;
        const product = await Product.findOne({ _id: productID });

        if (product) {
            const price = product.price.salesPrice * quantity;
            const userCart = await Cart.findOne({ user: user });

            if (userCart) {
                const existingCartItem = userCart.items.find(item => item.productID.equals(productID) && item.size == size);

                if (existingCartItem) {
                    
                    return res.status(200).json({ success: false, message: 'Item already in the cart' });
                } else {
                    // Add a new item to the cart
                    userCart.items.push({
                        productID: productID,
                        quantity,
                        price,
                        size,
                    });
                    userCart.totalPrice += price;
                    await userCart.save();
                    console.log('heloooooooo');
                    return res.status(200).json({ success: true, message: 'Item added to the cart' });
                }
            } else {
                // Create a new cart
                const newCart = new Cart({
                    user: user,
                    items: [{
                        productID: productID,
                        quantity,
                        price,
                        size,
                    }],
                    totalPrice: price,
                });
                await newCart.save();
                return res.status(200).json({ success: true, message: 'Item added to the cart' });
            }
        }

        res.status(404).json({ success: false, message: 'Product not found' });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const selectS = async(req,res)=>{
    try {
        const datafrom = req.body.s
        if(datafrom){
            res.status(200).json({size:"s"})
        }
    } catch (error) {
        console.log(error)
    }
}

const selectM = async(req,res)=>{
    try {
        const datafrom = req.body.m
        console.log(' the data form is ',datafrom);
        const product = await Product.find({})
        console.log(product);
        if(datafrom){
            // const quantity = product.size.m
            // console.log(quantity);
            res.status(200).json({size:"m"})
        }
    } catch (error) {
        console.log(error)
    }
}

const selectL = async(req,res)=>{
    try {
        const datafrom = req.body.l
        if(datafrom){
            res.status(200).json({size:"l"})
        }
    } catch (error) {
        console.log(error)
    }
}

const incrementProduct = async(req,res)=>{
    try {
        const user = req.session.user
        const {productID,quantity,size,price} = req.body
        
        
        const cart = await Cart.findOne({user:user})
       if (cart) {

            const stock = cart.items.find(item => item.productID.equals(productID)&&item.size==size)
            if(stock){
                const product = await Product.findOne({_id:productID})
                const availableQuantity = product?product.size[size]:0;
                const pquantity = parseInt(stock.quantity)
                const squantity = parseInt(availableQuantity.quantity)
                if (pquantity<squantity) {
                    stock.quantity += 1
                    stock.price+=product.price.salesPrice
                    cart.totalPrice +=product.price.salesPrice
                    await cart.save()
                    res.status(200).json({success:true})
                } else {
                    res.status(400).json({ success: false, message: 'Exceeded available quantity for the selected size.' });
                }
            }else{
                res.status(404).json({ success: false, message: 'Item not found in the cart.' });
            }
       } else {
        res.status(404).json({ success: false, message: 'Cart not found.' });
       } 
    } catch (error) {
        console.log(error.message);
    }
}

const decrementProduct = async(req,res)=>{
    try {
        const user = req.session.user
        const {quantity,size,productID,price} = req.body
        const cart = await Cart.findOne({user:user})

        if (cart) {
            const usercart = cart.items.find(item => item.productID.equals(productID)&&item.size == size)
            if (usercart) {
                const product = await Product.findOne({_id:productID})
                const cquantity = parseInt(usercart.quantity)
                const minquantity = 1;
                if (cquantity>minquantity) {
                    usercart.quantity -= 1
                    usercart.price -= product.price.salesPrice
                    cart.totalPrice -=product.price.salesPrice
                    await cart.save()
                    res.status(200).json({success:true})
                } else {
                    res.status(400).json({success:false,message:'Quantity cant be zero'})
                }
            } else {
                res. status(404).json({success:false,message:"item not found in the cart"})
            } 
        } else {
           res.status(404).json({success:false,message:"Cart not found"})
        }
    } catch (error) {
        console.log(error.message);
    }
}
const deleteCart = async(req,res)=>{
    try {
        const user = req.session.user
        const pid = req.body.productID
        const psize = req.body.size
        const userCart = await Cart.findOne({user:user})
        const scart = userCart.items.find(el=>el.productID.equals(pid)&&el.size==psize)
        const price =scart.price
        const cart = await Cart.updateOne(
            { user: user },
            {
                $pull: {
                    items: {
                        productID: { _id: pid },
                        size: psize
                    }
                },
            $inc:{totalPrice:-price}
            }
        );
          
            res.status(200).json({success:true})
    
    } catch (error) {
        console.log(error.message);
    }
}

const getCheckout = async(req,res)=>{
    try {
        const userID = req.session.user
        const coupon = await Coupon.find({isActive:true})
        const uadd = await Address.find({user:userID})
        const ucart = await Cart.findOne({user:userID}).populate('items.productID')
        res.render('checkout',{uadd,ucart,userID,coupon})
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    addToCart,
    selectS,
    selectM,
    selectL,
    incrementProduct,
    decrementProduct,
    deleteCart,
    getCheckout,
}