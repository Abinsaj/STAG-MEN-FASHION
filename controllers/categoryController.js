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
        const CategoryExist = await Category.findOne({name:name})
        if (CategoryExist) {
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


module.exports = {
    displayAddCategories,
    postAddCategories,
    blockCategory,
    editCategory,
    postEditCategory
}
