const Product = require('../models/productSchema')
const Category = require('../models/categorySchema')
const fs = require("fs")
const path = require("path")


const displayAddProduct = async(req,res)=>{
    try {
        const product = await Category.find({isActive:true})
        res.render('addProduct',{product}) 
    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async(req,res)=>{
    try {
        const images = req.files

        const imageFile = images.map(image =>image.filename)
        const {name,description,salesPrice,regularPrice,category,small,medium,large} = req.body
        const product = new Product({
            name:name,
            description:description,
            price:{
                salesPrice:salesPrice,
                regularPrice:regularPrice,
            },
            category:category,
            image:imageFile,
            size:{
                s:{
                    quantity:small,
                },
                m:{
                    quantity:medium,
                },
                l:{
                    quantity:large,
                }
            }
        })

        const sproduct = await product.save();
        res.redirect('/admin/addProduct')
    
    } catch (error) {
        console.log(error.message);
    }
}

const displayProductList = async(req,res)=>{
    try {
        const product = await Product.find({})
        res.render('productList',{product})
    } catch (error) {
        console.log(error.message);
    }
}

const blockProduct = async(req,res)=>{
    try {
        const id = req.query._id
        const product = await Product.findById({_id:id})
        if (product.isActive==true) {
            await Product.findOneAndUpdate({_id:id},{$set:{isActive:false}})
        } else {
            await Product.findOneAndUpdate({_id:id},{$set:{isActive:true}})
        }
        res.redirect('/admin/productList')
    } catch (error) {
        console.log(error.message);
    }
}

const editProduct = async(req,res)=>{
    try {
        const pid = req.query._id
        req.session.pid=pid
        
        const product = await Product.findOne({_id:pid}).populate('category')
        const category = await Category.find({})
        res.render('editProduct',{product,category})
    } catch (error) {
        console.log(error.message);
    }
}

const postEditProduct = async(req,res)=>{
    try {
        const pid = req.session.pid
        const images = req.files
        const imageFile = await images.map(image => image.filename)
        const {name,description,salesPrice,regularPrice,category,small,medium,large} = req.body
        if (images.length>0) {
            await Product.findByIdAndUpdate({_id:pid},{$push:{image:{$each:imageFile}}})
        }
        
            const product = await Product.findOneAndUpdate({_id:pid},{$set:{
                name:name,
                description:description,
                price:{
                    salesPrice:salesPrice,
                    regularPrice:regularPrice
                },
                category:category,
                size:{
                    s:{
                        quantity:small,
                    },
                    m:{
                        quantity:medium
                    },
                    l:{
                        quantity:large
                    }
                }
                
            }})
            res.redirect('/admin/productList')

    } catch (error) {
        console.log(error.message);
    }
}

const deleteImage = async(req,res)=>{
    try {

        const index = req.body.index
        const pdtId = req.body.id
        const product = await Product.findById({_id:pdtId})
        
        const deletePDTimage = product.image[index]
        fs.unlink(deletePDTimage,(err)=>{
            if (err) {
                console.error(err.message)
            } else {
                console.log('set');
            }
        })
         product.image.splice(index,1)
         await product.save()
        res.status(200).json({success:true})
    } catch (error) {
        console.log(error.message);
    }
}

const searchProducts = async(req,res)=>{
    try{
        const {searchDataValue} = req.body
        const searchProducts = await Product.find({name:{
            $regex: searchDataValue , $options: 'i'
        }})
        console.log(searchProducts)
        res.json({status:"searched",searchProducts})

    }catch(err){
        console.log(err);
    }
 }

module.exports = {
    displayAddProduct,
    addProduct,
    displayProductList,
    blockProduct,
    editProduct,
    postEditProduct,
    deleteImage,
    searchProducts
}