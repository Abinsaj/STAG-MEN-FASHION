const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/website");
const path = require("path");
const express = require('express');
const app = express();
const userRoute = require("./Routes/userRoute");
const adminRoute = require("./Routes/adminRoute")
const nocache = require("nocache")
require('dotenv').config()



app.use('/public',express.static(path.join(__dirname,"/public")));
app.use('/uploads',express.static(path.join(__dirname,"/uploads")));

app.use(nocache())



app.use('/',userRoute)
app.use("/admin",adminRoute)



app.listen(5050,()=>{
    console.log("server is running on port 5050");
})