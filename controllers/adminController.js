const Admin = require('../models/adminShema')
const User = require('../models/userSchema')
const Order = require("../models/orderSchema")
const Product = require("../models/productSchema")
const Wallet = require('../models/walletSchema')

const loadAdmin = async (req, res) => {
    try {

        res.render('adminLogin')

    } catch (error) {
        console.log(error.message);
    }
}

const PostAdminLogin = async (req, res) => {

    try {
        const email = req.body.email
        const password = req.body.password
        const adminData = await Admin.findOne({ email: email })
        console.log(adminData);
        if (adminData) {
            if (adminData.password == password) {
                req.session.adminData = adminData
                res.redirect('/admin/adminDash')
            } else {
                res.render('adminLogin', { message: 'Incorrect password' })
            }
        } else {
            res.render("adminLogin", { message: 'Incorrect eamil or password' })
        }
    } catch (error) {
        console.log(error.message);
    }

}

const dashboard = async (req, res) => {
    try {
        res.render("adminDash")
    } catch (error) {
        console.log(error.message);
    }
}

const displayUser = async (req, res) => {
    try {
        const user = await User.find({})
        res.render('userslist', { user })
    } catch (error) {
        console.log(error.message);
    }
}


const unblockUser = async (req, res) => {
    try {
        const userData = req.query._id
        const user = await User.findOne({ _id: userData })
        if (user.isActive == true) {
            await User.updateOne({ _id: userData }, { $set: { isActive: false } })
        }
        else {
            await User.updateOne({ _id: userData }, { $set: { isActive: true } })
        }

        res.redirect("/admin/userslist")
    } catch (error) {
        console.log(error.message);
    }
}

const adminLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin/adminLogin')
    } catch (error) {
        console.log(error.message);
    }
}

const adminchangestatus = async (req, res) => {
    try {
        const user = req.session.user
        const orderID = req.body.orderID
        const status = req.body.statusID
        const aorder = await Order.findOne({_id:orderID})
        if(aorder){
        const corder = await Order.findByIdAndUpdate({ _id: orderID },
            { $set: { status: status } }, { new: true })
        if (corder.status == "Cancelled"||corder.status == "Returned") {
            let productarray = []
            corder.products.forEach((element) => {
                let prodata = {
                    productid: element.product,
                    quantityid: element.quantity,
                    size: element.size
                }
                productarray.push(prodata)
            })
        
            productarray.forEach(async (el) => {
                await Product.findByIdAndUpdate({ _id: el.productid }, { $inc: { [`size.${el.size}.quantity`]: el.quantityid } })
            })
        }
            if (corder.paymentmethod = 'razorpay') {
                const userr = corder.user
                const wallet = await Wallet.find({ user: userr })
                if (wallet) {
                    await Wallet.findOneAndUpdate({ user: userr }, { $push: { walletdata: { history: corder.totalamount, date: new Date(), paymentmethod: "razorpay" } } })
                }
            }
            res.status(200).json({ success: true })
        } else {
            res.status(400).json({ success: false, message: 'Failed to update status.' });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const getSalesReport = async (req, res) => {
    try {
        const order = await Order.find({})
        console.log('the order is :', order);
        res.render('salesReport', { order })
    } catch (error) {
        console.log(error.message);
    }
}

const customDate = async (req, res) => {
    try {
        const date = req.query.value;
        const parts = date.split("-");
        const day = parseInt(parts[2], 10);
        const month = parseInt(parts[1], 10);

        const rotatedDate = day + "-" + month + "-" + parts[0];
        console.log('teh rotated date is ',rotatedDate);
        const order = await Order.find({
            status: { $nin: ["Ordered", "Cancelled", "Shipped"] },
            createdAt: rotatedDate,
        });
        console.log('the orders is ',order);
    
       
        res.render("salesReport", { order });
    } catch (error) {
        console.log(error.message);
    }
}

const filterDate = async (req, res) => {
    try {
        console.log('getttting herererererereeeeeeeeee');
        const sort = req.query.value
        let orderDateQuery = {};

        const currentDate = new Date();

        const currentDateString = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;

    
        if (sort === "Day") {

            orderDateQuery = currentDateString;
        } else if (sort === "Week") {
 
            const firstDayOfWeek = new Date(currentDate);
            firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const lastDayOfWeek = new Date(currentDate);
            lastDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6); 
            const firstDayOfWeekString = `${firstDayOfWeek.getDate()}-${firstDayOfWeek.getMonth() + 1}-${firstDayOfWeek.getFullYear()}`;
            const lastDayOfWeekString = `${lastDayOfWeek.getDate()}-${lastDayOfWeek.getMonth() + 1}-${lastDayOfWeek.getFullYear()}`;
            orderDateQuery = {
                $gte: firstDayOfWeekString,
                $lte: lastDayOfWeekString
            };
        } else if (sort === "Month") {
            
            orderDateQuery = {
                $regex: `-${currentDate.getMonth() + 1}-`
            };
        } else if (sort === "Year") {

            orderDateQuery = {
                $regex: `-${currentDate.getFullYear()}$`
            };
        }

        console.log(orderDateQuery)


        const order = await Order.find({
            status: { $nin: ["Ordered", "Cancelled", "Shipped"] },
            createdAt:orderDateQuery
        });
        console.log('the order is ',order);
       
        res.render("salesReport", { order });
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadAdmin,
    PostAdminLogin,
    dashboard,
    displayUser,
    unblockUser,
    adminLogout,
    adminchangestatus,
    getSalesReport,
    customDate,
    filterDate
}  
