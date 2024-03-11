const Coupon = require("../models/couponSchema")

const displayCoupon = async(req,res)=>{
    try {
        const coupon = await Coupon.find({})
        console.log(coupon);
        res.render('couponList',{coupon})
    } catch (error) {
        console.log(error.message);
    }
}

const displayAddCoupon = async(req,res)=>{
    try {
        res.render('addCoupon')
    } catch (error) {
        console.log(error.message);
    }
}

const addCoupon = async(req,res)=>{
    try {
        const {name,discount,maxdiscount,expirydate,minpurchase} = req.body
        console.log(req.body);
        const coupon = new Coupon ({
            name:name,
            discount:discount,
            maxdiscount:maxdiscount,
            expiryDate:expirydate,
            minPurchase:minpurchase
        })
        console.log(coupon);
        await coupon.save();
        res.redirect("/admin/couponList")
    } catch (error) {
        console.log(error.message);
    }
}

const getEditCoupon = async(req,res)=>{
    try {
        const couponID = req.query.id
        req.session.cid = couponID
        const coupon = await Coupon.findById({_id:couponID})
        res.render('editCoupon',{coupon})
    } catch (error) {
        console.log(error.message);
    }
}

const postEditCoupon = async(req,res)=>{
    try {
        const couponID = req.session.cid
        const {name,discount,maxdiscount,expirydate,minpurchase} = req.body
        const coupon = await Coupon.findByIdAndUpdate({_id:couponID},
            {$set:{
                name:name,
                discount:discount,
                maxdiscount:maxdiscount,
                minPurchase:minpurchase,
                expiryDate:expirydate
            }})
            res.redirect('/admin/couponList')
    } catch (error) {
        console.log(error.message);
    }
}

const blockCoupon = async(req,res)=>{
    try {
        const couponID = req.query.id
        const coupon = await Coupon.findById({_id:couponID})
        if(coupon.isActive == true){
            await Coupon.findOneAndUpdate({_id:couponID},{$set:{isActive:false}})
        }else{
            await Coupon.findOneAndUpdate({_id:couponID},{$set:{isActive:true}})
        }
        res.redirect('/admin/couponList')
    } catch (error) {
        console.log(error.message);
    }
}

const applyCoupon = async(req,res)=>{
    try {
        const user = req.session.user
        const {couponcode,totalprice} = req.body
        const coupon = await Coupon.findOne({couponcode:couponcode,isActive:true})
        if(coupon){
            if(!coupon.user.includes(user)){
                if(totalprice>=coupon.minPurchase){
                    const randomDiscount = Math.floor(Math.random() * (coupon.maxdiscount - coupon.discount + 1)) + coupon.discount;
                    const discountAmount = (randomDiscount / 100) * totalprice;
                    const discountedTotal = Math.floor(totalprice - discountAmount);
                    res.json({success:true, discount: randomDiscount,
                        discounted: discountedTotal})
                }else{
                    res.json({success:false,message:'Order amount does not meet the minimum purchase requirement for this coupon.'})
                }
            }else{
                res.json({success:false,message:"You have already used this coupon code"})
            }
        }else{
            res.json({success:false,message:"Invalid coupon code or the coupon is inactive."})
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    displayCoupon,
    displayAddCoupon,
    addCoupon,
    getEditCoupon,
    postEditCoupon,
    blockCoupon,
    applyCoupon
}