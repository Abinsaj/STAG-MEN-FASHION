const express = require('express')
const adminRoute = express()
const adminController = require("../controllers/adminController")
const categoryController = require("../controllers/categoryController")
const productController = require("../controllers/productController")
const orderController = require("../controllers/orderController")
const couponController = require("../controllers/couponController")

const path = require('path')
const auth = require("../middleware/adminAuth")

const session = require('express-session');
adminRoute.use(session({secret:"1234567"}));

adminRoute.set("view engine","ejs");
adminRoute.set("views","./views/Admin");

const multer = require("multer");

const storage = multer.diskStorage({
    destination:(req,file,cb) =>{
        cb(null,'uploads')
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now() + '-' + path.extname(file.originalname))
    }
})
const upload = multer({storage:storage})

adminRoute.get("/adminLogin",auth.isLogin,adminController.loadAdmin)
adminRoute.post("/adminLogin",adminController.PostAdminLogin)

adminRoute.get("/adminDash",auth.isLogout,adminController.dashboard)
adminRoute.get("/adminDash/monthdata",auth.isLogout,adminController.fetchMonthlySales)
adminRoute.get("/adminDash/yeardata",auth.isLogout,adminController.fetchYearlySales)
// adminRoute.get('/fetchlables',auth.isLogout,adminController.fetchCategory)


adminRoute.get("/userslist",auth.isLogout,adminController.displayUser)
adminRoute.get('/userStatus',auth.isLogout,adminController.unblockUser)

adminRoute.get('/Categories',auth.isLogout,categoryController.displayAddCategories)
adminRoute.post('/Categories',categoryController.postAddCategories)
adminRoute.get('/categoryStatus',auth.isLogout,categoryController.blockCategory)
adminRoute.get('/editCategory',auth.isLogout,categoryController.editCategory)
adminRoute.post('/editCategory',categoryController.postEditCategory)

adminRoute.get('/addProduct',auth.isLogout,productController.displayAddProduct)
adminRoute.post('/addProduct',upload.array('image'),productController.addProduct)

adminRoute.get('/productList',auth.isLogout,productController.displayProductList)
adminRoute.get('/productStatus',auth.isLogout,productController.blockProduct)
adminRoute.get('/editProduct',auth.isLogout,productController.editProduct)
adminRoute.post('/editProduct',upload.array('image'),productController.postEditProduct)
adminRoute.post('/deleteImage',productController.deleteImage)

adminRoute.get('/adminLogout',auth.isLogout,adminController.adminLogout)

adminRoute.get('/orderlist',auth.isLogout,orderController.displayOrder)
adminRoute.get('/orderdetails',auth.isLogout,orderController.displayOrderDetailes)
adminRoute.post('/orderdetails',adminController.adminchangestatus)

adminRoute.get('/couponList',auth.isLogout,couponController.displayCoupon)
adminRoute.get('/addCoupon',auth.isLogout,couponController.displayAddCoupon)
adminRoute.post('/addCoupon',couponController.addCoupon)
adminRoute.get('/editCoupon',couponController.getEditCoupon)
adminRoute.post('/editCoupon',couponController.postEditCoupon)
adminRoute.get('/blockCoupon',couponController.blockCoupon)

adminRoute.get('/salesReport',adminController.getSalesReport)
adminRoute.get('/salesDate',adminController.customDate)
adminRoute.get('/data',adminController.filterDate)

adminRoute.get('/categoryOffer',categoryController.categoryOffer)
adminRoute.get('/addcategoryoffer',categoryController.getCategoryOffer)
adminRoute.post('/addcategoryoffer',categoryController.postCategoryOffer)

module.exports = adminRoute