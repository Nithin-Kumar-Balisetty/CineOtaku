//jshint esversion:6
const express = require("express");
const flash=require("express-flash");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongo=require("mongoose");
const path=require("path");
const md5=require("md5");
require('dotenv').config()


mongo.connect(process.env.MONGODB_URI||process.env.MONGOCLUSTER,{useNewUrlParser : true,useUnifiedTopology : true});


const User= require("./dbmodels/User")
const userrating = require("./dbmodels/userrating");

const app=express();
app.listen(process.env.PORT||3000,(req,res) => console.log("Running server at port 3000"));

const fs = require('fs');
var multer  = require('multer');

const fetch = require('node-fetch');
app.use(express.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


const session	= require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

app.use(flash());
app.use(session({
	secret: "verygoodsecret",
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(new localStrategy({
  usernameField: 'email',
  passwordField: 'password',
  session: true
},function (email, password, done) {
	User.findOne({ "email": email }, function (err, user) {
		if (err) return done(err);
		if (!user) return done(null, false, { message: 'No account with that email address' });

			if (user.password==md5(password)) return done(null,user);
			else return done(null, false, { message: 'Incorrect password' });
		
	});
}));

// v3 is deprecated. Update API URL points and change the configuration in respective ejs files
// app.use('/otaku',require('./routes/otaku'));  

app.use('/binger',require('./routes/binger'));

app.get("/",async (req,res) => {
  res.sendFile(__dirname+"/landingPage.html");
}
);

app.get("/login",authenicatedto,async (req,res)=>{
  let bool;
  if(req.session.recaptcha===undefined){
    req.session.recaptcha=false;
    bool =false;
  }
  else bool=req.session.recaptcha;
  console.log(req.session.recaptcha);
  res.status(200).render("login",{alreadyaccount : false , alreadyaccountusername : false ,signin : false,captcha : bool, captcha_notfill : req.session.recaptcha_notfill});
});

function authenicatedto(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/myaccount");
  }
  next()      
}

const { stringify } = require('querystring');

app.post("/login",async(req,res,next)=>{
  if(req.body.semail==null){
   // console.log(req.body);
    if(req.isAuthenticated()){
       res.redirect("/myaccount");
    }
    else{
      if(req.session.timesTried && !req.isAuthenticated()) req.session.timesTried+=1;
      else req.session.timesTried=1;
      
      if(req.session.timesTried>=5){
        req.session.recaptcha=true;
        //console.log(req.body);
        const secretKey = '6Le0wSkdAAAAANCpIfvz0cIEBC44zYmrdDQk0fNW';
       // console.log('logs : '+req.body["g-recaptcha-response"]);
        // Verify URL
        const query = stringify({
          secret: secretKey,
          response: req.body["g-recaptcha-response"],
        });
        const verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;
        const body = await fetch(verifyURL).then(res => res.json());

        if (body.success !== undefined && !body.success){
          req.session.recaptcha_notfill = true;
          res.redirect("/login");
          return ;
        }
        else{
          req.session.recaptcha_notfill = false;
          passport.authenticate("local",{
            successRedirect : "/binger/suggestions",
            failureRedirect : "/login",
            failureFlash : true
          })(req,res,next);
        }
      //  console.log('Checking '+req.session.recaptcha+" is "+req.session.timesTried);
      }
      else{
        passport.authenticate("local",{
          successRedirect : "/binger/suggestions",
          failureRedirect : "/login",
          failureFlash : true
        })(req,res,next);
      }
    }
  }
  else{
    let email=req.body.semail;
    let un=req.body.susername;
    let alreadyaccout=[];
    let alreadyaccout1=[];
    await User.findOne({email : email},async (err,item)=>
    {
          if(item && item.email==email){
            alreadyaccout.push("1");
          }
    });
    await User.findOne({username : un},async (err,item)=>
    {
          if(item && item.username==un)
          {
            alreadyaccout1.push("1");
          }
    });
    let boo=false;
    let boo1=false;
    if(alreadyaccout.length==1) boo=true;
    if(alreadyaccout1.length==1) boo1=true;
    if(alreadyaccout.length==1||alreadyaccout1.length==1)
    {
      alreadyaccout.pop();
      alreadyaccout1.pop();
      res.render("login",{alreadyaccount : boo,alreadyaccountusername : boo1,signin : true,captcha : false,captcha_notfill : null});
    }
    else
    {
      let email = req.body.semail;
      let username=req.body.susername;
      let pass=req.body.pass;
      let cpass=req.body.confirmpass;
      let nuser=new User({email : email,username: username,password : md5(pass),profile_image : "/uploads/deafult.webp"});
      nuser.save();
      let nuserrate=new userrating({email : email,animerating : [],mangarating : [],movierating : [],seriesrating : []});
      nuserrate.save();
      res.redirect("/login");
    }
  }
});

app.get("/signup",async(req,res)=>{
  res.status(200).render("login",{alreadyaccount : false , alreadyaccountusername : false ,signin : true,captcha : false,captcha_notfill : null});
});

app.get("/signout",async (req,res)=>{
  if(req.session.timesTried) req.session.timesTried=0;
  req.session.recaptcha=false;
  req.logOut();
  res.redirect("/");
});


/*function dategen()
{
  let d = new Date();
  let month=["January","Febuary","March","April","June","July","August","September","October","Novmeber","December"];
  return d.getDate()+" "+month[d.getMonth()]+" "+d.getFullYear();
} */

var storage = multer.diskStorage({
  destination: "./public/uploads",
  filename : async  (req, file, cb)=> {
    fname(file,cb);
  }
});

function fname(file,cb)
{
  let temp=req.user[0].email;
  return cb(null, temp+path.extname(file.originalname))
};

const upload = multer({
    storage: storage,
    fileFilter : async (req,file,cb)=>
    {
      if([".jpeg",".jpg",".png",".webp"].includes(path.extname(file.originalname).toLowerCase()))
      {
        await user.updateOne({"email" : req.user[0].email}, 
        {"profile_image":"/uploads/"+req.user[0].email+path.extname(file.originalname).toLowerCase()}, function (er) {
        if (er){
            console.log(err);
          }
        }); 
        console.log("Uploading");
        fs.readdir("public/uploads",function(err,files){
          if(err)
            console.log("error");
          else
            files.forEach((file)=>{
              if(file.includes(req.user[0].email))
              {
                fs.unlink("public/uploads/"+file,async (err)=>
                {
                    if(err)
                      console.log("File cannot be deleted.refer fs.unlink method");
                    //else
                      //console.log("Successfully deleted previous profile picture");
                });
                //console.log(file+"found !!!!");
              }
            });
        });
        req.user[0].profile_image="/uploads/"+req.user[0].email+path.extname(file.originalname).toLowerCase();
        return cb(null,true);
      }
      else
        return cb("File is not in .jpeg or .webp or .jpg or .png format");
    }
}).single("profile_img");

app.get("/myaccount",async (req,res)=>{
  if(req.isAuthenticated())
  {
    userrating.findOne({email : req.user.email},async (err,doc)=>
    {
      if(err)
        console.log("Error in find mongo method");
      res.render("myaccount", { userinfo: req.user, ratingdata: doc }, function (err) {
        if (err) {
          console.log(err);
          res.status(200).render("myaccount", { userinfo: req.user, ratingdata: {'movierating' : [],'seriesrating' : [],'animerating': [],'mangarating' : []} });
        }

        else 
          res.status(200).render("myaccount", { userinfo: req.user, ratingdata: doc });
      });
    });
  }
  else
     res.redirect("/");
});

app.post("/myaccountpi",async(req,res)=>{
  upload(req,res,async (err)=>{    
    if(err){
      console.log("testing..");
      res.render("profile",{user : req.user,error :err});
    }
    res.redirect("/accprofilephoto");
  });
});


// comments : [{commentid : Number ,date: String ,username : String,commentbody : String ,reply : [{replyid : Number,date : String, username : String,replybody : String}]}]
/* var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
console.log(time);

var DateDiff = {

  inDays: function(d1, d2) {
      var t2 = d2.getTime();
      var t1 = d1.getTime();

      return parseInt((t2-t1)/(24*3600*1000));
  },

  inWeeks: function(d1, d2) {
      var t2 = d2.getTime();
      var t1 = d1.getTime();

      return parseInt((t2-t1)/(24*3600*1000*7));
  },

  inMonths: function(d1, d2) {
      var d1Y = d1.getFullYear();
      var d2Y = d2.getFullYear();
      var d1M = d1.getMonth();
      var d2M = d2.getMonth();

      return (d2M+12*d2Y)-(d1M+12*d1Y);
  },

  inYears: function(d1, d2) {
      return d2.getFullYear()-d1.getFullYear();
  }
} */

app.get("/accprofilephoto",async (req,res)=>
{
  if(req.isAuthenticated())
    res.render("profile",{user : req.user,error:null});
  else res.redirect("/");
});

app.get("/accpasschange",async (req,res)=>{
  if(!req.isAuthenticated())
    res.status(404).send("Cannot GET /accpasschange");
  else
    res.render("password");
});
app.post("/accpasschange", function(req,res){
  user.updateOne({"email" : req.user.email},{$set : {"password" : md5(req.body.pass)}},function(err){
    if(err){
      console.log("password updation error");
      res.redirect("/myaccount");
    }
    else
    {
      res.redirect("/myaccount");
    }
  })
});




