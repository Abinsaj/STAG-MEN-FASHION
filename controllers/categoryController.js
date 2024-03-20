const { disconnect } = require('mongoose');
const Category = require('../models/categorySchema')

const displayAddCategories = async(req,res)=>{
    try {
        const category = await Category.find({})
        res.render('Categories',{category})
    } catch (error) {
        console.log(error.message);
    }
}

const postAddCategories = async(req,res)=>{
    try {
        const {name,description} = req.body
        const categories = await Category.find({}); 
        
        const allNames = categories.map(category => category.name); 
        
        let unique = !allNames.some(catName => catName.toLowerCase() === name.toLowerCase()); 
        

        if (!unique) {
            const category = await Category.find({})

            res.render('Categories',{category,message:"Category already exist"})
        } else {
            const Categories = new Category({
                name:name,
                description:description,
                isActive:true
            })   
            
            const categoryData = await Categories.save()
            if (categoryData) {
                const category = await Category.find({})
                res.render('Categories',{category})
            } else {
                const category = await Category.find({})
                res.render('Categories',{category})
            } 
        }
    } catch (error) {
        console.log(error.message);
    }
}

const blockCategory = async(req,res)=>{
    try {
       
        const id = req.query._id
        const category = await Category.findOne({_id:id})
        if (category.isActive == true) {
            await Category.updateOne({_id:id},{$set:{isActive:false}})
        } else {
            await Category.updateOne({_id:id},{$set:{isActive:true}})
        }
        res.redirect("/admin/Categories")
    } catch (error) {
        console.log(error.message);
    }
}

const editCategory = async(req,res)=>{

    try {
        const cid = req.query._id
        const category = await Category.findOne({_id:cid})
        res.render('editCategory',{category})
    } catch (error) {
        console.log(error.message);
    }

}

const postEditCategory = async (req, res) => {
    try {
        const categoryId = req.body._id;
        const { name, description } = req.body;
        let category = await Category.findOne({ _id: categoryId });
        const catname = name.trim();

        if (catname !== category.name) {
            const ucat = await Category.findOne({ name: catname });

            if (!ucat) {
                category = await Category.findOneAndUpdate({ _id: categoryId }, { $set: { name: catname, description: description } });
                res.redirect("/admin/Categories");
            } else {
                res.render('editCategory', { category, message: "Category already exists" });
            }
        } else {
            category = await Category.findOneAndUpdate({ _id: categoryId }, { $set: { name: catname, description: description } });
            res.redirect('/admin/Categories');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const categoryOffer = async(req,res)=>{
    try {
        const category = await Category.find({})
        res.render('categoryOffer',{category})
    } catch (error) {
        console.log(error.message);
    }
}

const getCategoryOffer = async(req,res)=>{
    try {
        const category = await Category.find({})
        res.render('addcategoryoffer',{category})
    } catch (error) {
        console.log(error.message);
    }
}

const postCategoryOffer = async(req,res)=>{
    try {
        const {name,discount,startdate,enddate} = req.body
        console.log(req.body);
        const category = await Category.findOne({name:name})
        console.log(category);
        const offerdata = {
            discount:discount,
            startDate:startdate,
            endDate:enddate
        }

        console.log('the offer data is',offerdata);
        const categoryOffer = await Category.findByIdAndUpdate({_id:category._id},{
            $set:{
                offer:offerdata
            }
        })

        res.redirect("/admin/categoryOffer")

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    displayAddCategories,
    postAddCategories,
    blockCategory,
    editCategory,
    postEditCategory,
    categoryOffer,
    getCategoryOffer,
    postCategoryOffer 
}
