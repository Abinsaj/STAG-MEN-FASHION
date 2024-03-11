const User = require("../models/userSchema")
const bcrypt = require("bcrypt")
const sentOtpmail = require("../controllers/otpController/otpUtils")
const otp = require("../controllers/otpController/generateOtp")
const Product = require("../models/productSchema")
const session = require("express-session")
const Address = require("../models/useraddressSchema")
const Cart = require('../models/cartSchema')
const generateOtp = require("../controllers/otpController/generateOtp")
const Wallet = require('../models/walletSchema')
const { v4:uuidv4} = require('uuid')
const Category = require('../models/categorySchema')



const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async (req, res) => {
    try {
        res.render('registration')
    } catch (error) {
        console.log(error.message);
    }
}



function generateReferalcode(){
    return uuidv4().substring(0,8)
}

const insertUser = async (req, res) => {
    try {
        console.log("Getting inside insert user");
        const email = req.body.email;
        const name = req.body.name;
        const mobile = req.body.mobile;
        const password = req.body.password;
        const otherreferalcode = req.body.otherreferalcode
        console.log(otherreferalcode);

        // Retrieve confirmPassword from the request body
        const confirmPassword = req.body.confirmPassword;
        const referalcode = generateReferalcode()
        

        // Check if password and confirmPassword match
        if (password !== confirmPassword) {
            return res.render("registration", { message: "Passwords do not match" });
        }

        // Check if the user already exists
        const userExist = await User.find({ $or: [{ mobile: mobile }, { email: email }] });

        if (userExist.length > 0) {
            return res.render("registration", { message: "User already exists" });
        }

        // Hash the password securely
        const spassword = await securePassword(password);

        // Create a new user data object
        const userData = {
            name: name,
            email: email,
            password: spassword,
            mobile: mobile,
            referalcode:referalcode,
            otherreferalcode:otherreferalcode
        };

        // Store user data in the session for OTP verification
        req.session.userData = userData;

        // Generate OTP and send it via email
        const generatedOtp = otp();
        req.session.otp = generatedOtp;
        req.session.timer = Date.now()
        console.log("Generated OTP:", generatedOtp);

        // Send OTP via email
        sentOtpmail(email, generatedOtp);

        // Set OTP expiration time (e.g., 1 minute)
        const otpExpiration = Date.now() + 60 * 1000;
        req.session.otpExpiration = otpExpiration;

        req.session.userEmail = email
        // Redirect to the OTP verification page
        res.redirect("/otp");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const verifyOtp = async (req, res) => {
    try {
        const otpExpiration = req.session.otpExpiration
        console.log(otpExpiration);
        const email = req.session.userEmail
        console.log(email);
        res.render('otp', { email: email, otpExpiration: otpExpiration })
    } catch (error) {
        console.log(error.message);
    }
}

const createUser = async (userData) => {
    return await User.create(userData)
}

const createWallet = async (wallet) => {
    console.log("getting in wallet");
   return await Wallet.create(wallet)

}

const otpVerificationPost = async (req, res) => {
    try {
        const currentTimer = Date.now();
        const timer = req.session.timer;

        if (currentTimer - timer > 60000) {
            console.log("OTP timeout");
            res.render('otp', { message: "OTP has been timed out" });
        } else {
            const storedOtp = req.session.otp;
            const enteredOtp = req.body.otp;

            console.log("Stored OTP:", storedOtp);
            console.log("Entered OTP:", enteredOtp);

            if (storedOtp == enteredOtp) {
                const userData = req.session.userData;

                const createdUser = await createUser(userData);
                if (createdUser) {
                    console.log("yessss");
                    const wallet = {
                        user:createdUser._id
                    }
                    const createdWallet = await createWallet(wallet)
                }
                res.redirect("/login");

            } else {
                const email = req.session.email
                const otpExpiration = req.session.otpExpiration
                res.render('otp', { otpExpiration, email, message: "Incorrect OTP" });
            }
        }
    } catch (error) {
        console.error("Error:", error.message);
        // res.status(500).render('error', { message: "Internal Server Error" });
    }
};



//load login

const loadLogin = async (req, res) => {
    try {

        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        console.log('getting inside');
        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({ email: email, isActive: true })
        console.log(userData);
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {

                req.session.user = userData._id

                res.redirect('/')
            }
        } else {
            res.render('login', { message: "Incorrect password or email" })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadHome = async (req, res) => {
    try {
        const userID = req.session.user
        const user = await User.findOne({ _id: userID })
        console.log('user :' + user);
        const product = await Product.find({ isActive: true })
        console.log(product);
        res.render('home', { user, product, userID })
    } catch (error) {
        console.log(error.message);
    }
}

const getProductDetails = async (req, res) => {
    try {
        const userID = req.session.user
        const user = await User.find({ _id: userID })
        const cart = await Cart.findOne({user:userID}).populate('items.productID')
        console.log('the cart is ',cart);
        const id = req.query.id

        const product = await Product.findOne({ _id: id })

        res.render('productDetails', { product, user, userID, })

    } catch (error) {
        console.log(error.message);
    }
}

const logout = async (req, res) => {
    try {

        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

let lastotpGeneration = 0
const resendOTP = async (req, res) => {
    try {
        console.log('gets here');
        const currentTime = Date.now();
        const timediff = currentTime - lastotpGeneration / 1000
        console.log(timediff);
        if (timediff < 60) {
            res.send(400).json({ message: 'Wait before resending' })
        }
        const generateOtp = otp()
        const email = req.session.userEmail
        console.log(email);
        const globalOtp = generateOtp
        req.session.otp = globalOtp
        req.session.timer = Date.now()
        console.log(email, globalOtp);
        console.log('ivida unde..');
        sentOtpmail(email, globalOtp)

        const otpExpiration = Date.now() + 60 * 1000;
        req.session.otpExpiration = otpExpiration;
        console.log('haooo ivida ethi');
        res.redirect('/otp')

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getaddresses = async (req, res) => {
    try {
        const userID = req.session.user
        const addresses = await Address.find({ user: userID })
        console.log(addresses);
        res.render('addresses', { addresses, userID })
    } catch (error) {
        console.log(error.message);
    }
}

const getaddAddress = async (req, res) => {
    try {
        const userID = req.session.user
        res.render("addaddress", { userID })
    } catch (error) {
        console.log(error.message);
    }
}


const userProfile = async (req, res) => {
    try {
        const userID = req.session.user
        console.log(userID);
        const user = await User.find({ _id: userID })
        console.log(user);
        res.render('profile', { user, userID })
    } catch (error) {
        console.log(error.message);
    }
}

const postaddAddress = async (req, res) => {
    try {

        const { name, mobile, pincode, locality, address, city, state, addressType, country } = req.body
        const user = req.session.user
        console.log(user);
        if (!user) {
            res.redirect('/login')
        } else {
            const useraddress = new Address({
                user: user,
                name: name,
                mobile: mobile,
                pincode: pincode,
                locality: locality,
                Address: address,
                city: city,
                state: state,
                country: country,

            })
            const addresses = await useraddress.save()
            console.log(addresses);
            res.redirect('/addresses')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const editAddress = async (req, res) => {
    try {
        const userID = req.query._id
        req.session.aid = userID
        const address = await Address.findOne({ _id: userID })
        console.log(address);
        res.render('editaddress', { address, userID })
    } catch (error) {
        console.log(error.message);
    }
}

const postEditAddress = async (req, res) => {
    try {
        const aid = req.session.aid
        console.log(aid);
        const { name, mobile, pincode, locality, address, city, state, addressType, country } = req.body
        const newaddress = await Address.findOneAndUpdate({ _id: aid }, {
            $set: {
                name: name,
                mobile: mobile,
                pincode: pincode,
                locality: locality,
                Address: address,
                city: city,
                state: state,
                country: country,

            }
        })
        res.redirect('/addresses')

    } catch (error) {
        console.log(error.message);
    }
}

const deleteAddress = async (req, res) => {
    try {
        const aid = req.query._id
        const addr = await Address.findOneAndDelete({ _id: aid })
        console.log(addr);
        if (addr) {
            res.redirect('/addresses')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const getCart = async (req, res) => {
    try {
        const userID = req.session.user
        const ucart = await Cart.findOne({ user: userID }).populate('items.productID')
        console.log(ucart);
        if (ucart == null) {
            res.render('cart', { userID })
        } else {
            res.render('cart', { ucart, userID })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const getChangePassword = async (req, res) => {
    try {
        const userID = req.session.user
        res.render('changePassword', { userID })
    } catch (error) {
        console.log(error.message);
    }
}

const postChangePassword = async (req, res) => {
    try {
        const user = req.session.user
        const { currentpassword, newpassword, confirmnewpassword } = req.body
        const upass = await User.findOne({ _id: user })
        const password = upass.password
        const checking = await bcrypt.compare(currentpassword, password);
        if (checking) {
            if (newpassword == confirmnewpassword) {
                const hashpass = await bcrypt.hash(newpassword, 10)
                const newpass = await User.findOneAndUpdate({ _id: user }, { $set: { password: hashpass } })
                res.render('changePassword', { message3: 'Password has changed' })
            } else {
                res.render('changePassword', { message2: 'password does not match' })
            }
        } else {
            res.render('changePassword', { message1: 'invalid password!!!' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const getShop = async (req, res) => {
    try {
        const page = req.query.page || 1
        const pageSize = 9
        const pdtskip = (page-1)*pageSize
        const pdtcount = await Product.find({ isActive: true }).count()
        const numofPage = Math.ceil(pdtcount/pageSize)
        
        const category = await Category.find({isActive:true})
        console.log('the category',category);
        const userID = req.session.user
        const user = await User.findOne({ _id: userID })
        const product = await Product.find({ isActive: true }).skip(pdtskip).limit(pageSize)
        res.render('shop', { user, product, userID,numofPage, })
    } catch (error) {
        console.log(error.message);
    }
}

const forgetPassword = async (req, res) => {
    try {
        res.render('email')
    } catch (error) {
        console.log(error.message);
    }
}

const postVerifyEmail = async (req, res) => {
    try {
        const email = req.body.email
        const users = req.session.user
        const user = await User.findOne({ email: email })
        if (user) {

            const generatedOtp = otp();
            req.session.otp2 = generatedOtp;
            req.session.timer = Date.now()
            console.log("Generated OTP:", generatedOtp);

            sentOtpmail(email, generatedOtp);

            const otpExpiration = Date.now() + 60 * 1000;
            req.session.otpExpiration = otpExpiration;
            req.session.userEmail = email

            res.redirect('/forgetOtp')
        } else {
            res.render('email', { message: 'please enter a verified email!!' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const forgetOtp = async (req, res) => {
    try {
        const otpExpiration = req.session.otpExpiration
        res.render('forgetOtp', { otpExpiration })
    } catch (error) {
        console.log(error.message);
    }
}

const postforgetOtp = async (req, res) => {
    try {
        console.log('it here');
        const currentTimer = Date.now();
        const timer = req.session.timer;

        if (currentTimer - timer > 60000) {
            console.log("OTP timeout");
            res.render('otp', { message: "OTP has been timed out" });
        } else {
            const storedOtp = req.session.otp2;
            const enteredOtp = req.body.otp;

            console.log("Stored OTP:", storedOtp);
            console.log("Entered OTP:", enteredOtp);

            if (storedOtp == enteredOtp) {


                console.log("User created successfully");

                res.redirect("/changepass");
            } else {
                console.log("Incorrect OTP");
                res.redirect('/forgetOtp');
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const postforgetResendOtp = async (req, res) => {
    try {
        console.log('gets here');
        const currentTime = Date.now();
        const timediff = currentTime - lastotpGeneration / 1000
        if (timediff < 60) {
            res.send(400).json({ message: 'Wait before resending' })
        }
        const generateOtp = otp()
        const email = req.session.userEmail
        console.log(email);
        const globalOtp = generateOtp
        req.session.otp = globalOtp
        req.session.timer = Date.now()
        console.log(email, globalOtp);
        sentOtpmail(email, globalOtp)

        const otpExpiration = Date.now() + 60 * 1000;
        req.session.otpExpiration = otpExpiration;
        res.redirect('/changepass')
    } catch (error) {
        console.log(error.message);
    }
}

const getPasswordset = async (req, res) => {
    try {
        res.render('changepass')
    } catch (error) {
        console.log(error.message);
    }
}

const postPasswordset = async (req, res) => {
    try {
        const user = req.session.userEmail
        console.log(user);

        const newpass = req.body.newpassword
        const confirmnewpass = req.body.confirmnewpassword
        if (newpass == confirmnewpass) {
            const Newpass = await bcrypt.hash(newpass, 10)
            await User.findOneAndUpdate({ email: user }, { $set: { password: Newpass } })
            res.redirect('/login')
        } else {
            res.render('changepass', { message: 'password not match' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const productLowtohigh = async (req, res) => {
    try {
        const page = req.query.page || 1
        const pageSize = 9
        const pdtskip = (page-1)*pageSize
        const pdtcount = await Product.find({ isActive: true }).count()
        const numofPage = Math.ceil(pdtcount/pageSize)
        const userID = req.session.user
        const product = await Product.find({ isActive: true }).sort({ 'price.salesPrice': 1 }).skip(pdtskip).limit(pageSize);
        res.render('shop', { product, userID,numofPage });
    } catch (error) {
        console.log(error.message);
        // Handle the error and send an appropriate response
        res.status(500).send('Internal Server Error');
    }
}


const productHightolow = async (req, res) => {
    try {
        const page = req.query.page || 1
        const pageSize = 9
        const pdtskip = (page-1)*pageSize
        const pdtcount = await Product.find({ isActive: true }).count()
        const numofPage = Math.ceil(pdtcount/pageSize)
        const userID = req.session.user
        const product = await Product.find({ isActive: true }).sort({ 'price.salesPrice': -1 }).skip(pdtskip).limit(pageSize);
        res.render('shop', { product, userID ,numofPage });
    } catch (error) {
        console.log(error.message);
        // Handle the error and send an appropriate response
        res.status(500).send('Internal Server Error');
    }
}

const aAzZ = async (req, res) => {
    try {
        const page = req.query.page || 1
        const pageSize = 9
        const pdtskip = (page-1)*pageSize
        const pdtcount = await Product.find({ isActive: true }).count()
        const numofPage = Math.ceil(pdtcount/pageSize)
        const userID = req.session.user
        const product = await Product.find({ isActive: true }).sort({ name: 1 }).skip(pdtskip).limit(pageSize);
        res.render('shop', { product, userID ,numofPage  });
    } catch (error) {
        console.log(error.message);
        // Handle the error and send an appropriate response
        res.status(500).send('Internal Server Error');
    }
}

const zZaA = async (req, res) => {
    try {
        const page = req.query.page || 1
        const pageSize = 9
        const pdtskip = (page-1)*pageSize
        const pdtcount = await Product.find({ isActive: true }).count()
        const numofPage = Math.ceil(pdtcount/pageSize)
        const userID = req.session.user
        const product = await Product.find({ isActive: true }).sort({ name: -1 }).skip(pdtskip).limit(pageSize);
        res.render('shop', { product, userID,numofPage });
    } catch (error) {
        console.log(error.message);
        // Handle the error and send an appropriate response
        res.status(500).send('Internal Server Error');
    }
}

const newArrival = async (req, res) => {
    try {
        const userID = req.session.user
        const user = await User.findOne({ _id: userID })
        const product = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(8);
        res.render('home', { userID, user, product });
    } catch (error) {
        console.log(error.message);
        // Handle the error and send an appropriate response
        res.status(500).send('Internal Server Error');
    }
}

// const productSorting = async (req, res) => {
//     try {
//         const { sort } = req.query;
//         let sortedProducts;

//         if (sort === 'low-to-high') {
//             sortedProducts = await Product.find({ isActive: true }).sort({ 'price.salesPrice': 1 });
            
//         } else if (sort === 'high-to-low') {
//             sortedProducts = await Product.find({ isActive: true }).sort({ 'price.salesPrice': -1 });
//             console.log(sortedProducts);
//         } else if (sort === 'a-Z') {
//             sortedProducts = await Product.find({ isActive: true }).sort({ name: 1 });
//         } else if (sort === 'z-A') {
//             sortedProducts = await Product.find({ isActive: true }).sort({ name: -1 });
//         }

//         res.status(200).json({ success: true, sortedProducts });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

const getCategory=async(req,res)=>{
    try {
        console.log('jhgfkldhkj;dgf;kadjkf;db');
        const id=req.query.id;
        const findCat=await Category.findById({_id:id})
        console.log(findCat);
        const category=await Category.find({isActive:true})
        const page = req.query.page || 1
        const pageSize = 9
        const pdtskip = (page-1)*pageSize
        const pdtcount = await Product.find({ isActive: true }).count()
        const numofPage = Math.ceil(pdtcount/pageSize)
        
        const product = await Product.find({ isActive: true ,category:findCat._id}).skip(pdtskip).limit(pageSize)
        const userID = req.session.user
        const user = await User.findOne({ _id: userID })

        res.render('category', { user, product, userID,numofPage, category })
        
    } catch (error) {
        console.log(error.message)
    }
}


module.exports = {
    loadRegister,
    insertUser,
    loadLogin,
    verifyLogin,
    verifyOtp,
    otpVerificationPost,
    loadHome,
    getProductDetails,
    logout,
    resendOTP,
    getaddAddress,
    postaddAddress,
    userProfile,
    getaddresses,
    editAddress,
    postEditAddress,
    deleteAddress,
    getCart,
    getChangePassword,
    postChangePassword,
    getShop,
    forgetPassword,
    postVerifyEmail,
    forgetOtp,
    postforgetOtp,
    postforgetResendOtp,
    getPasswordset,
    postPasswordset,
    productLowtohigh,
    productHightolow,
    aAzZ,
    zZaA,
    newArrival,
    getCategory
    
}