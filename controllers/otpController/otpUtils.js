const nodemailer = require("nodemailer")
const generateOtp = require("../otpController/generateOtp")

// const serveremail = "abinsaj39045@gmail.com";
// const serverpassword = "xhfd znkn pkzm hlgx"

const sentOtpmail = function(email,otp){
    
    const transporter = nodemailer.createTransport({
        service :'gmail',
        auth:{
            user : process.env.EMAIL_USER,
            pass : process.env.EMAIL_PASSWORD
        }
    })
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to:email,
        subject : "STAG MEN FASHION",
        text : `Hello ${email} your Otp for signIn in STAG MEN FASHION is ${otp}`
    }
    
    transporter.sendMail(mailOptions,(error,info)=>{
        if (error) {
            console.log(error.message);            
        } else {
            console.log("OTP has send to your Mail");
            const otpExpiration = Date.now() + 60*1000
            req.session.otpExpiration = otpExpiration
            res.status(200).json({message:'resend success'})
        }
       
    })
}

module.exports = sentOtpmail;