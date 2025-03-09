const Admin = require('../models/adminShema')
const User = require('../models/userSchema')
const Order = require("../models/orderSchema")
const Product = require("../models/productSchema")
const Wallet = require('../models/walletSchema')
const Category = require('../models/categorySchema')

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
        console.log(email);
        const password = req.body.password
        const adminData = await Admin.findOne({ email: email })
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

const fetchMonthlySales = async (req, res) => {
   
    const monthlySales = Array.from({ length: 12 }, () => 0);
    const orders = await Order.find({ status: "Delivered" });
    for (const order of orders) {
        const month = order.createdAt.getMonth();
        monthlySales[month] += order.totalamount;
    }
    res.json({ monthlySales })
};

const fetchYearlySales = async (req, res) => {
    try {
        const START_YEAR = 2022;
        const currentYear = new Date().getFullYear();
        const yearlySales = Array.from({ length: currentYear - START_YEAR + 1 }, () => 0); 


        const orders = await Order.find({ status: "Delivered" });


        for (const order of orders) {
            const year = order.createdAt.getFullYear();
            yearlySales[year - START_YEAR] += order.totalamount;
        }

        res.json({ yearlySales, START_YEAR })
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const dashboard = async (req, res) => {
    try {
        console.log('its hererererer')
        const order = await Order.find({ status: "Delivered" }).populate('products.product');
        let revenue = 0
        order.forEach(element=>{
            amount = element.totalamount
            revenue+=amount
        })
        const totalOrder = await Order.find({}).count()
        const bestSellingProducts = await Order.aggregate([
            { $unwind: "$products" },
 
            {
                $group: {
                    _id: "$products.product",
                    totalQuantity: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 4 }
        ]);

        let topProductDetails = [];

        if (bestSellingProducts.length > 0) {
            for (const product of bestSellingProducts) {
                const productDetails = await Product.findById(product._id);
                topProductDetails.push({
                    product: productDetails,
                    totalQuantity: product.totalQuantity
                });
            }
        }
        console.log(topProductDetails);


        const totalDeliveredProducts = await Order.aggregate([
            
            {
                $group: {
                    _id: null, 
                    totalProducts: { $sum: { $size: "$products" } } 
                }
            }
        ]);
        
        let totalProducts = 0;
        
        if (totalDeliveredProducts.length > 0) {
            totalProducts = totalDeliveredProducts[0].totalProducts;
        }
       
       

        const categoryCounts = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { $unwind: "$products" },
            { $lookup: { from: 'products', localField: 'products.product', foreignField: '_id', as: 'productDetails' } },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } }, 
            { $lookup: { from: 'categories', localField: 'productDetails.category', foreignField: '_id', as: 'categoryDetails' } },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$categoryDetails.name", count: { $sum: { $ifNull: ["$products.quantity", 0] } } } }
        ]);
        console.log(categoryCounts);        

        const category = await Category.find({})
    
        const categoryNames = [];
        const categoryCountsMap = {};


        category.forEach(cat => {
            categoryNames.push(cat.name);
        });


        categoryNames.forEach(catName => {
            categoryCountsMap[catName] = 0;
        });


        categoryCounts.forEach(catCount => {
            const categoryName = catCount._id;
            categoryCountsMap[categoryName] = catCount.count;
        });


        const categoryData = categoryNames.map(catName => categoryCountsMap[catName]);



        const catnames = JSON.stringify(categoryNames)
        res.render("admindash", { topProductDetails, categoryData,categoryNames,revenue,totalOrder,totalProducts});
    } catch (error) {
        console.log(error.message);
    }
};


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
        const aorder = await Order.findOne({ _id: orderID })
        if (aorder) {
            const corder = await Order.findByIdAndUpdate({ _id: orderID },
                { $set: { status: status } }, { new: true })
            res.status(200).json({ success: true })
            if (corder.status == "Cancelled" || corder.status == "Returned") {
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
        const order = await Order.find({status:"Delivered"}).populate('products.product').sort({_id:-1})
        console.log("the order is",order);
        res.render('salesReport', { order })
    } catch (error) {
        console.log(error.message);
    }
}

const customDate = async (req, res) => {
    try {
        const date = req.query.value;
        const date2 = req.query.value2
        const parts = date.split("-");
        const parts2 = date2.split("_")
        const day = parseInt(parts[2], 10);
        const day2 = parseInt(parts2[2], 10);

        const month = parseInt(parts[1], 10);
        const month2 = parseInt(parts2[1], 10);

        const rotatedDate = day + "-" + month + "-" + parts[0];
        const rotatedDate2 = day2 + "_" + month2 + "_" + parts2[0]
        console.log('teh rotated date is ', rotatedDate,rotatedDate2);
        const order = await Order.find({
            status: { $nin: ["Ordered", "Cancelled", "Shipped"] },
            date: { $gte: rotatedDate, $lte: rotatedDate2 },
        }).populate('products.product');
        console.log('the orders is ', order);


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
            date: orderDateQuery
        }).populate('products.product');
        console.log('the order is ', order);

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
    filterDate,
    fetchMonthlySales,
    fetchYearlySales
}  
