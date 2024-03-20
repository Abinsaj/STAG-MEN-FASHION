const Cart = require('../models/cartSchema')
const Product = require('../models/productSchema')
const Address = require('../models/useraddressSchema')
const Order = require('../models/orderSchema')
const Coupon = require('../models/couponSchema')
const Category = require('../models/categorySchema')

const addToCart = async (req, res) => {
    try {
        const user = req.session.user;
        const { productID, quantity, size } = req.body;
        const product = await Product.findOne({ _id: productID });

        if (product) {
            if (product.size[size].quantity <= 0) {
                return res.status(200).json({ success: false, message: 'Out of Stock' });
            }
            const category = await Category.findOne({ _id: product.category })
            let discount;
            if (category.offer.discount) {
                const product = await Product.findOne({ _id: productID });
                discount = (product.price.regularPrice * category.offer.discount) / 100
            }
            let amount = product.price.regularPrice - discount
            console.log(amount);
            let price
            if (amount < product.price.salesPrice) {
                
                price = amount*quantity
            } else {
        
                price = product.price.salesPrice*quantity
            }
            if (price == null) {
        
                price == amount*quantity
            }
            // const price = product.price.salesPrice * quantity;
            const userCart = await Cart.findOne({ user: user });
            console.log('the price ios ',price);
            if (userCart) {

                const existingCartItem = userCart.items.find(item => item.productID.equals(productID) && item.size == size);

                if (existingCartItem) {

                    return res.status(200).json({ success: false, message: 'Item already in the cart' });
                } else {
                    // Add a new item to the cart
                    userCart.items.push({
                        productID: productID,
                        quantity,
                        amount:price,
                        price,
                        size,
                    });
                    userCart.totalPrice += price;
                    await userCart.save();
                    console.log(userCart);
                    return res.status(200).json({ success: true, message: 'Item added to the cart' });
                }
            } else {
                // Create a new cart
                const newCart = new Cart({
                    user: user,
                    items: [{
                        productID: productID,
                        quantity,
                        amount:price,
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


const selectS = async (req, res) => {
    try {
        const datafrom = req.body.s
        const id = req.body.pdtID
        console.log('the id is ', id);
        const product = await Product.findOne({ _id: id })
        const stock = product.size.s.quantity
        console.log('the stock is ', stock);
        if (datafrom) {
            res.status(200).json({ size: "s", stock: stock })
        }
    } catch (error) {
        console.log(error)
    }
}

const selectM = async (req, res) => {
    try {
        const datafrom = req.body.m
        console.log(' the data form is ', datafrom);
        const id = req.body.pdtID
        console.log('the id is ', id);
        const product = await Product.findOne({ _id: id })
        const stock = product.size.m.quantity
        console.log('the stock is ', stock)
        console.log(product);
        if (datafrom) {
            // const quantity = product.size.m
            // console.log(quantity);
            res.status(200).json({ size: "m", stock: stock })
        }
    } catch (error) {
        console.log(error)
    }
}

const selectL = async (req, res) => {
    try {
        const datafrom = req.body.l
        const id = req.body.pdtID
        console.log('the id is ', id);
        const product = await Product.findOne({ _id: id })
        const stock = product.size.l.quantity
        console.log('the stock is ', stock)
        if (datafrom) {
            res.status(200).json({ size: "l", stock: stock })
        }
    } catch (error) {
        console.log(error)
    }
}

const incrementProduct = async (req, res) => {
    try {
        console.log('getting here');
        const user = req.session.user
        const { productID, quantity, size, price } = req.body
        console.log(req.body);
        const amount = parseInt(price)
        
        const cart = await Cart.findOne({ user: user })
        if (cart) {

            const stock = cart.items.find(item => item.productID.equals(productID) && item.size == size)
            if (stock) {
                const product = await Product.findOne({ _id: productID })
                const availableQuantity = product ? product.size[size] : 0;
                const pquantity = parseInt(stock.quantity)
                const squantity = parseInt(availableQuantity.quantity)
                if (pquantity < squantity) {
                    stock.quantity += 1
                    

                    stock.price += amount
                    cart.totalPrice += amount
                    await cart.save()
                    res.status(200).json({ success: true })
                } else {
                    res.status(400).json({ success: false, message: 'Exceeded available quantity for the selected size.' });
                }
            } else {
                res.status(404).json({ success: false, message: 'Item not found in the cart.' });
            }
        } else {
            res.status(404).json({ success: false, message: 'Cart not found.' });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const decrementProduct = async (req, res) => {
    try {
        const user = req.session.user
        const { quantity, size, productID, price } = req.body
        const amount = parseInt(price)
        
        const cart = await Cart.findOne({ user: user })

        if (cart) {
            const usercart = cart.items.find(item => item.productID.equals(productID) && item.size == size)
            if (usercart) {
                const product = await Product.findOne({ _id: productID })
                const cquantity = parseInt(usercart.quantity)
                const minquantity = 1;
                if (cquantity > minquantity) {
                    usercart.quantity -= 1
                    usercart.price -= amount
                    cart.totalPrice -= amount
                    await cart.save()
                    res.status(200).json({ success: true })
                } else {
                    res.status(400).json({ success: false, message: 'Quantity cant be zero' })
                }
            } else {
                res.status(404).json({ success: false, message: "item not found in the cart" })
            }
        } else {
            res.status(404).json({ success: false, message: "Cart not found" })
        }
    } catch (error) {
        console.log(error.message);
    }
}
const deleteCart = async (req, res) => {
    try {
        const user = req.session.user
        const pid = req.body.productID
        const psize = req.body.size
        const userCart = await Cart.findOne({ user: user })
        const scart = userCart.items.find(el => el.productID.equals(pid) && el.size == psize)
        const price = scart.price
        const cart = await Cart.updateOne(
            { user: user },
            {
                $pull: {
                    items: {
                        productID: { _id: pid },
                        size: psize
                    }
                },
                $inc: { totalPrice: -price }
            }
        );

        res.status(200).json({ success: true })

    } catch (error) {
        console.log(error.message);
    }
}

const getCheckout = async (req, res) => {
    try {
        const userID = req.session.user
        const coupon = await Coupon.find({ isActive: true })
        const uadd = await Address.find({ user: userID })
        const userCart = await Cart.findOne({ _id: userID })
        const ucart = await Cart.findOne({ user: userID }).populate('items.productID')


        res.render('checkout', { uadd, ucart, userID, coupon, userCart })
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