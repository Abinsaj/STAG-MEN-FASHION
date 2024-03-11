const express = require("express");
const userRoute = express();
const bodyParser = require("body-parser");

const session = require("express-session");
// const config = require("../config/sessionConfig");
userRoute.use(session({secret:"123456"}));

userRoute.set("view engine","ejs");
userRoute.set("views","./views/Users");

userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({extended:true}));

const userController = require("../controllers/userController")
const cartController = require("../controllers/cartController")
const orderController = require('../controllers/orderController')
const wishlistController = require('../controllers/wishlistController')
const walletcontroller = require('../controllers/walletController')
const couponController = require('../controllers/couponController')
const productController = require('../controllers/productController')

const auth = require("../middleware/userAuth")
const blockAuth = require('../middleware/userBlock')

userRoute.get('/',userController.loadHome)


userRoute.get("/register",auth.isLogin,userController.loadRegister)
userRoute.post("/register",userController.insertUser)

userRoute.get('/otp',userController.verifyOtp)
userRoute.post('/otp',userController.otpVerificationPost)

userRoute.get('/login',auth.isLogin,userController.loadLogin)
userRoute.post('/login',userController.verifyLogin)

userRoute.get('/productDetails',blockAuth.isBlock,userController.getProductDetails)
userRoute.get('/logout',auth.isLogout,userController.logout)

userRoute.post('/resendOTP',userController.resendOTP)

userRoute.get('/profile',auth.isLogout,userController.userProfile)
userRoute.get('/shop',userController.getShop)

userRoute.get('/addresses',auth.isLogout,userController.getaddresses)

userRoute.get('/addaddress',auth.isLogout,userController.getaddAddress)
userRoute.post('/addaddress',userController.postaddAddress)

userRoute.get('/editaddress',auth.isLogout,userController.editAddress)
userRoute.post('/editaddress',userController.postEditAddress)

userRoute.get('/deleteadd',auth.isLogout,userController.deleteAddress)

userRoute.get('/cart',auth.isLogout,userController.getCart)
userRoute.post('/addcart',cartController.addToCart)

userRoute.post('/selects',cartController.selectS)
userRoute.post('/selectm',cartController.selectM)
userRoute.post('/selectl',cartController.selectL)

userRoute.post('/increment',cartController.incrementProduct)
userRoute.post('/decrement',cartController.decrementProduct)
userRoute.patch('/remove',cartController.deleteCart)

// userRoute.get('/checkout',cartController.getCheckout)
userRoute.get('/checkout',auth.isLogout,cartController.getCheckout)
userRoute.get('/changePassword',auth.isLogout,userController.getChangePassword)
userRoute.post('/changePassword',userController.postChangePassword)

userRoute.post('/COD',orderController.placeOrder)
userRoute.get('/ordersuccess',auth.isLogout,orderController.orderSuccess)

userRoute.get('/orders',auth.isLogout,orderController.getOrder)
userRoute.get('/viewOrder',auth.isLogout,orderController.getViewOrder)
userRoute.post('/cancelorder',orderController.usercancelOrder)
userRoute.post('/return',orderController.returnOrder)
userRoute.post('/cancelreturn',orderController.cancelReturn)

userRoute.get('/email',userController.forgetPassword)
userRoute.post('/email',userController.postVerifyEmail)

userRoute.get('/forgetOtp',userController.forgetOtp)
userRoute.post('/forgetOtp',userController.postforgetOtp)
userRoute.post('/resendotp',userController.postforgetResendOtp)

userRoute.get('/changepass',userController.getPasswordset)
userRoute.post('/changepass',userController.postPasswordset)

userRoute.get('/lowtohigh',userController.productLowtohigh)
userRoute.get('/hightolow',userController.productHightolow),
userRoute.get('/aAzZ',userController.aAzZ)
userRoute.get('/zZaA',userController.zZaA)
userRoute.get('/newarrival',userController.newArrival)

userRoute.get('/wishlist',auth.isLogout,wishlistController.displayWishlist)
userRoute.post('/addwishlist',wishlistController.addToWishlist),
userRoute.patch('/removewishlist',wishlistController.removeWishlist)

userRoute.post('/createorder',orderController.createOrder)
userRoute.post('/paymentsuccess',orderController.paymentsuccess)

userRoute.get('/wallet',auth.isLogout,walletcontroller.getwallet)
userRoute.post('/applycoupon',couponController.applyCoupon)

userRoute.post('/search',productController.searchProducts)

userRoute.get('/category',userController.getCategory)


module.exports = userRoute


