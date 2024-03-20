const Review = require('../models/reviewSchema')
const Product = require('../models/productSchema')
const generateDate = require('../controllers/otpController/dateGenerator')

const addreview = async(req,res)=>{
    try {
        const user = req.session.user
        const {id,name,email,dis,rating} = req.body
        const product = await Product.findOne({_id:id});
        const date = generateDate()

        const reviews = await Review.find

        const review = new Review({
            product:product._id,
            name:name,
            email:email,
            description:dis,
            date:date,
            star:rating
        })
        const newreview = await review.save()

        if(newreview){

            const totalRating = await Review.find({product:product._id},{star:true})
            let total=[]
            for(let i=0; i<totalRating.length;i++){
                total.push(totalRating[i].star)
            }
            const sumTotal = total.reduce((acc,crr)=>acc+crr)
            const avgTotal = sumTotal/totalRating.length
            let totalAvg = (avgTotal*2)*10
            const updateProduct = await Product.findByIdAndUpdate(
                { _id:id },
                { $set: { rating: totalAvg } },
                { new: true } 
            );
      
            res.status(200).json({success:true,avg:totalAvg,id:product._id})
        }
        

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    addreview
}

