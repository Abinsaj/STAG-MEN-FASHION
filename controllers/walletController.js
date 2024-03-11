const Wallet = require('../models/walletSchema')
const User = require('../models/userSchema')

const getwallet = async(req,res)=>{
    try {
        const userID = req.session.user
        const wallet = await Wallet.findOne({user:userID})
        console.log('wallet: '+wallet);
        res.render('wallet',{userID,wallet})
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    getwallet
}