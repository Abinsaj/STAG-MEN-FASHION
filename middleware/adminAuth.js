

const isLogin = async(req,res,next)=>{
    try {
        if (req.session.adminData) {
            
            res.redirect('/admin/adminDash')
        } else {
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.adminData){
           next()
        }else{
            res.redirect('/admin/adminLogin')
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}