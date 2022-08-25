//jshint esversion:6
const express = require("express");
const flash=require("express-flash");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const url = require('url');
const mongo=require("mongoose");
const path=require("path");
const md5=require("md5");
require('dotenv').config()
const jsnop=require("parse-jsonp");
mongo.connect(process.env.MONGODB_URI||process.env.MONGOCLUSTER,{useNewUrlParser : true,useUnifiedTopology : true});
var Schema = mongo.Schema;
const User= require("./dbmodels/User")
const articleschema=new Schema({
  postid : Number,
  postauthor :  String,
  posttitle: String,
  postdata : String,
  postimg : String,
  postdate : String,
  comments : [{commentid : Number ,date: String ,profile_pic : String,username : String,commentbody : String ,reply : [{replyid : Number,date : String, profile_pic : String,username : String,replybody : String}]}]
});
let arr=[];
const users=[];
const userratingschema=new Schema({
  email : String,
  animerating : [{animeid : Number,image : String,name : String,rating : Number,release : String}],
  mangarating : [{mangaid : Number,image : String,name : String,rating : Number,release : String}],
  movierating : [{movieid : Number,image : String,name : String,rating : Number,release : String}],
  seriesrating : [{seriesid  : Number,image : String,name : String,rating : Number,release : String}]
});
const app=express();

const ejsLint= require('ejs-lint');
const fs = require('fs');
var multer  = require('multer');
const otakuarticle=mongo.model("otakuarticle",articleschema);
const bingerarticle =mongo.model("bingerarticle",articleschema);
const userrating = mongo.model("userrating",userratingschema);
var Buffer = require('buffer/').Buffer;
const { response } = require("express");
const parseJson = require('parse-json');
const fetch = require('node-fetch');
app.use(express.json());
const https=require("https");
const loadash=require("lodash");
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const ISO6391 = require('iso-639-1');
const session			= require('express-session');
const passport			= require('passport');
const localStrategy		= require('passport-local').Strategy;
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

/* const { RSA_NO_PADDING } = require("constants");
const { isUndefined } = require("lodash");
const { discriminator } = require("./dbmodels/User"); */
app.get("/otaku",async (req,res) => {
    console.log(req.isAuthenticated());
    let topanimeresponse = await fetch("https://api.jikan.moe/v3/top/anime/1/bypopularity");
    let jsontopanime=await topanimeresponse.json();
    let topairanime= await fetch("https://api.jikan.moe/v3/top/anime/1/airing");
    let jsonairanime=await topairanime.json();
    otakuarticle.find({},function(error,docs){
      if(error)
      {
        if(req.isAuthenticated())
          res.render("animehome",{topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),postdetails : [],user : req.user});
        else
          res.render("animehome",{topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),postdetails : [],user : {}});
      }
      else{
        if(req.isAuthenticated())
          res.render("animehome",{topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),postdetails : docs.slice(-10),user : req.user});
        else
          res.render("animehome",{topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),postdetails : docs.slice(-10),user : {}});     
      }
    });
});
app.get("/",async (req,res) => {
  res.sendFile(__dirname+"/landingPage.html");
}
);
app.get("/otaku/search",async (req,res) =>
{
    const myURL = new URL("https:/"+req.url);
    const animeresponse = await fetch("https://api.jikan.moe/v3/search/anime"+myURL.search);
    const jsonanime=await animeresponse.json();
    const mangaresponse = await fetch("https://api.jikan.moe/v3/search/manga?q="+myURL.search.slice(2));
    const jsonmanga=await mangaresponse.json();
    let topanimeresponse = await fetch("https://api.jikan.moe/v3/top/anime/1/bypopularity");
    let jsontopanime=await topanimeresponse.json();
    let topairanime= await fetch("https://api.jikan.moe/v3/top/anime/1/airing");
    let jsonairanime=await topairanime.json();
    if(req.isAuthenticated())
      res.render("searchresult",{animeobject :jsonanime.results.slice(0,10),mangaobject :jsonmanga.results.slice(0,10),topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : req.user});
    else 
     res.render("searchresult",{animeobject :jsonanime.results.slice(0,10),mangaobject :jsonmanga.results.slice(0,10),topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : {}});   
});
app.get("/otaku/anime/:animeid",async (req,res)=>{
    const jsonanime = await fetch("https://api.jikan.moe/v3/anime/"+req.params.animeid);
    let jsonachar=await fetch("https://api.jikan.moe/v3/anime/"+req.params.animeid+"/characters_staff");
    if(jsonanime.status===undefined || jsonachar.status===undefined) res.send("Error in loading apge");
    if(!(jsonanime.ok && jsonachar.ok)) res.send("Eror in loading page");
    let jsonchar = await jsonachar.json();
    const jsonanimedata=await jsonanime.json();
    if(req.isAuthenticated())
      res.render("animepage",{animedataobject : jsonanimedata,refer : "anime",user : req.user,jsonchar : jsonchar});
    else
      res.render("animepage",{animedataobject : jsonanimedata,refer : "anime",user : {},jsonchar : jsonchar}); 
});
app.get("/otaku/manga/:mangaid",async (req,res)=>{
    const jsonmanga = await fetch("https://api.jikan.moe/v3/manga/"+req.params.mangaid);
    const jsonmangadata=await jsonmanga.json();
    let jsonm=await fetch("https://api.jikan.moe/v3/manga/"+req.params.mangaid+"/characters");
    let jsonmchar=await jsonm.json();
    if(req.isAuthenticated()) res.render("mangapage",{animedataobject : jsonmangadata,refer : "manga",user : req.user,jsonmchar : jsonmchar});
    else res.render("mangapage",{animedataobject : jsonmangadata,refer : "manga",user : {},jsonmchar : jsonmchar});
});
app.get("/binger",async (req,res)=>
{
  console.log(users);
  let topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  let jsontopmoviesww=await topmoviesww.json();
  let topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  let jsontopseriesww=await topseriesww.json();

  bingerarticle.find({},function(error,docs){
    if(error)
    {
      if(req.isAuthenticated()) res.render("moviehome",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),postdetails : [],user : req.user});
      else res.render("moviehome",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),postdetails : [],user : {}});
    }
    else{
      if(req.isAuthenticated())
      res.render("moviehome",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),postdetails : docs.slice(-10),user : req.user});
      else
      res.render("moviehome",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),postdetails : docs.slice(-10),user : {}});
    }
  });
});
app.get("/binger/news/:newsid",async (req,res)=>
{
  let topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  let jsontopmoviesww=await topmoviesww.json();
  let topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  let jsontopseriesww=await topseriesww.json();
  var articleitem=[];
  await bingerarticle.findOne({postid : req.params.newsid},function(error,docs){
    if(error)
    {
      res.status(404).send("Cannot GET /binger/news/"+req.params.newsid);
    }
    else{
      if(req.isAuthenticated())
      res.render("bingerarticle",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),postdetails : docs,user : req.user});
      else
      res.render("bingerarticle",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),postdetails : docs,user : {}});
    }
  });
});
app.post("/binger/news/:newsid",async (req,res)=>{
  console.log(req.body);
  
  if(typeof req.body.replybody=="undefined")
 {
   User.findOne({email : req.user.email},function(error,userr){
       if(error) console.log("comment posting err");
       else{
         bingerarticle.updateOne({postid : req.params.newsid},{$push : {comments : {commentid : req.body.commentid,date : (new Date()),profile_pic : userr.profile_image,username : req.user.username,commentbody : req.body.commentbody,reply : []}}},function(err,docs)
         {
             if(err)
                console.log("comment posting error");
         });
       }
   });
 }
 if(typeof req.body.commentbody=="undefined"){
   User.findOne({email : req.user.email},function(err,user){
     if(err) console.log("reply posting error");
     else{
       bingerarticle.updateOne({postid : req.params.newsid,"comments.commentid" : req.body.commentid},{$push : {"comments.$.reply" : {replyid : req.body.replyid,date : (new Date()),profile_pic : user.profile_image,username : user.username,replybody : req.body.replybody}}},function(err,docs)
       {
         if(err){
           console.log("comment posting error");
         }
       }); 
     }
   });
  }   
});
app.get("/binger/search",async (req,res)=>
{
  let myURL = new URL("https:/"+req.url);
  let movieresponse = await fetch("https://api.themoviedb.org/3/search/movie?api_key=6305d43a0ac191e9665db77ff87bbff1&"+myURL.search.slice(1)+"&page=1&include_adult=true");
  let jsonmovie=await movieresponse.json();
  let seriesresponse = await fetch("https://api.themoviedb.org/3/search/tv?api_key=6305d43a0ac191e9665db77ff87bbff1&page=1&"+myURL.search.slice(1)+"&include_adult=true");
  let jsonseries=await seriesresponse.json();
  const topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  const jsontopmoviesww=await topmoviesww.json();
  const topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  const jsontopseriesww=await topseriesww.json();
  let len=myURL.search.slice(7),i=0;
  while(len.length>3)
  {
      i++;
      if(jsonmovie.results.length!=0){
        i=0;
        len=myURL.search.slice(7);
        break;
      }
      else {
        movieresponse = await fetch("https://api.themoviedb.org/3/search/movie?api_key=6305d43a0ac191e9665db77ff87bbff1&"+myURL.search.slice(1,myURL.search.length-i)+"&page=1&include_adult=true");
        jsonmovie=await movieresponse.json();
        len=len.slice(0,len.length-1);
      }
  }
  while(len.length>3)
  {
      i++;
      if(jsonseries.results.length!=0){
        break;
      }
      else {
        seriesresponse = await fetch("https://api.themoviedb.org/3/search/tv?api_key=6305d43a0ac191e9665db77ff87bbff1&page=1&"+myURL.search.slice(1,myURL.search.length-i)+"&include_adult=true");
        jsonseries=await seriesresponse.json();
        len=len.slice(0,len.length-1);
      }
  }
  if(req.isAuthenticated()) res.render("msearchresult",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),movieobject : jsonmovie.results.slice(0,10),seriesobject : jsonseries.results.slice(0,10),user : req.user});
  else res.render("msearchresult",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),movieobject : jsonmovie.results.slice(0,10),seriesobject : jsonseries.results.slice(0,10),user : {}});
});
app.get("/binger/movie/:movieid",async (req,res)=>{
    let moviecredits = await fetch("https://api.themoviedb.org/3/movie/"+req.params.movieid+"/credits?api_key=6305d43a0ac191e9665db77ff87bbff1");
    let mcredits = await moviecredits.json();
    jsonmovie = await fetch(" https://api.themoviedb.org/3/movie/"+req.params.movieid+"?api_key=6305d43a0ac191e9665db77ff87bbff1");
    let jsonmoviedata=await jsonmovie.json();
    if(req.isAuthenticated())
    res.render("moviepage",{moviedataobject : jsonmoviedata,type : "movie",Language : ISO6391.getName(jsonmoviedata.original_language),mcredits : mcredits,user : req.user});
    else res.render("moviepage",{moviedataobject : jsonmoviedata,type : "movie",Language : ISO6391.getName(jsonmoviedata.original_language),mcredits : mcredits,user : {}});
});
app.get("/binger/series/:seriesid",async(req,res)=>
{
    let seriescredits=await fetch("https://api.themoviedb.org/3/tv/"+req.params.seriesid+"/credits?api_key=6305d43a0ac191e9665db77ff87bbff1");
    jsonseries = await fetch("https://api.themoviedb.org/3/tv/"+req.params.seriesid+"?api_key=6305d43a0ac191e9665db77ff87bbff1"); 
    let jsonseriesdata= await jsonseries.json();
    let scredits= await seriescredits.json();
    res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : req.user},async (err)=>{
    if(err)
      {
        console.log(err);
        res.redirect("/binger");
      }
        if(req.isAuthenticated())
          res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : req.user});
        else  res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : {}});
    });
});
app.listen(process.env.PORT||3000,function(req,res)
{
  console.log("Running server");
});


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
            successRedirect : "/myaccount",
            failureRedirect : "/login",
            failureFlash : true
          })(req,res,next);
        }
      //  console.log('Checking '+req.session.recaptcha+" is "+req.session.timesTried);
      }
      else{
        passport.authenticate("local",{
          successRedirect : "/myaccount",
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
app.get("/otaku/news/:newsid",async (req,res) => {
  let topanimeresponse = await fetch("https://api.jikan.moe/v3/top/anime/1/bypopularity");
  let jsontopanime=await topanimeresponse.json();
  let topairanime= await fetch("https://api.jikan.moe/v3/top/anime/1/airing");
  let jsonairanime=await topairanime.json();
  await otakuarticle.findOne({postid : req.params.newsid},function(err,docs){
    if(err)
    {
      res.status(404).send("Cannot GET /otaku/news/"+req.params.newsid);
    }
    else
    {
      if(req.isAuthenticated())
        res.render("otakuarticle",{topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),postdetails : docs,user : req.user});
      else
      res.render("otakuarticle",{topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),postdetails : docs,user : {}});       
    }
  });
});
app.post("/",async (req,res)=>{

});
app.get("/otaku/compose",async(req,res)=>{
  if(req.isAuthenticated()){
    if(req.user.email==process.env.MASTER)
      res.render("compose");
    else {
      res.send("Cannot GET /otaku/compose");
    }
  }
  else {
    res.send("Cannot GET /otaku/compose");
  }
});
app.get("/binger/compose",async(req,res)=>{
  if(req.isAuthenticated()){
    if(req.user.email==process.env.MASTER)
      res.render("composem");
    else {
      res.send("Cannot GET /binger/compose");
    }
  }
  else {
    res.send("Cannot GET /binger/compose");
  }
});
function dategen()
{
  let d = new Date();
  let month=["January","Febuary","March","April","June","July","August","September","October","Novmeber","December"];
  return d.getDate()+" "+month[d.getMonth()]+" "+d.getFullYear();
}
app.post("/otaku",async (req,res)=>{
  let post_data=req.body.post_data;
  let post_img=req.body.post_img;
  let post_title=req.body.post_title;
  let post_author=req.body.post_author;
  await otakuarticle.countDocuments({}, async(err, c) =>{
    if(err)
      console.log("error in adding the article");
    else
    {
      let newarticle=new otakuarticle({"postid" : c+1,"postauthor" : post_author, "posttitle" : post_title,"postdata" : post_data,"postimg" : post_img,"postdate" : (new Date()).toLocaleString('en-US', {timeZone: 'Asia/Kolkata'}),comments : []});
      await newarticle.save();
    }
  });
  res.redirect("/otaku");
});

app.post("/binger",async (req,res)=>{
  
  let post_data=req.body.post_data;
  let post_img=req.body.post_img;
  let post_title=req.body.post_title;
  let post_author=req.body.post_author;
  await bingerarticle.countDocuments({}, async(err, c) =>{
    if(err)
      console.log("error in adding the article");
    else
    {
      let newarticle=new bingerarticle({"postid" : c+1,"postauthor" : post_author, "posttitle" : post_title,"postdata" : post_data,"postimg" : post_img,"postdate" : (new Date()).toLocaleString('en-US', {timeZone: 'Asia/Kolkata'}),comments : []});
      await newarticle.save();
    }
  });
  res.redirect("/binger");
});
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
      {
        console.log("Error in find mongo method");
      }
      res.render("myaccount", { userinfo: req.user, ratingdata: doc }, function (err) {
        if (err) {
          console.log(err);
        }

        else {
          res.status(200).render("myaccount", { userinfo: req.user, ratingdata: doc });
        }
      });
    });
  }
  else
  {
     res.redirect("/");
  }

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

app.get("/test",async (req,res)=>{
  res.render("testing",{arr : arr});
});
app.post("/test",async (req,res)=>{
  arr.push({"fname" : req.body.fname,"lname" : req.body.lname});
  console.log(req.body);
});
console.log(arr);
app.post("/otaku/news/:newsid",async (req,res)=>{
   console.log(req.body);
   
   if(typeof req.body.replybody=="undefined")
  {
    User.findOne({email : req.user.email},function(error,userr){
        if(error) console.log("comment posting err");
        else{
          otakuarticle.updateOne({postid : req.params.newsid},{$push : {comments : {commentid : req.body.commentid,date : (new Date()),profile_pic : userr.profile_image,username : req.user.username,commentbody : req.body.commentbody,reply : []}}},function(err,docs)
          {
              if(err)
                 console.log("comment posting error");
          });
        }
    });
  }
  if(typeof req.body.commentbody=="undefined"){
    User.findOne({email : req.user.email},function(err,user){
      if(err) console.log("reply posting error");
      else{
        otakuarticle.updateOne({postid : req.params.newsid,"comments.commentid" : req.body.commentid},{$push : {"comments.$.reply" : {replyid : req.body.replyid,date : (new Date()),profile_pic : user.profile_image,username : user.username,replybody : req.body.replybody}}},function(err,docs)
        {
          if(err){
            console.log("comment posting error");
          }
        }); 
      }
    });
   }   
});
//  comments : [{commentid : Number ,date: String ,username : String,commentbody : String ,reply : [{replyid : Number,date : String, username : String,replybody : String}]}]
var today = new Date();
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
}

var dString = "10 April 2021";

var d1 = new Date(dString);
var d2 = new Date();
app.get("/mass",async (req,res)=>
{
  res.sendFile(__dirname+"/mass.html");
});

app.get("/otaku/top/anime/:num",async (req,res)=>{
  let topanimeresponse = await fetch("https://api.jikan.moe/v3/top/anime/1/bypopularity");
  let jsontopanime=await topanimeresponse.json();
  let topairanime= await fetch("https://api.jikan.moe/v3/top/anime/1/airing");
  let jsonairanime=await topairanime.json();
  const topanime=await fetch("https://api.jikan.moe/v3/top/anime/"+req.params.num);
  const topanimejson=await topanime.json();
  if(req.isAuthenticated())
  res.render("topanime",{topanime : topanimejson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : req.user,num : req.params.num});
  else res.render("topanime",{topanime : topanimejson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : {},num : req.params.num});
});
app.get("/otaku/top/manga/:num",async(req,res)=>{
  let topanimeresponse = await fetch("https://api.jikan.moe/v3/top/anime/1/bypopularity");
  let jsontopanime=await topanimeresponse.json();
  let topairanime= await fetch("https://api.jikan.moe/v3/top/anime/1/airing");
  let jsonairanime=await topairanime.json();
  const topmanga=await fetch("https://api.jikan.moe/v3/top/manga/"+req.params.num);
  const topmangajson=await topmanga.json();
  if(req.isAuthenticated())
    res.render("topmanga",{topanime : topmangajson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : req.user,num : req.params.num});
  else
  res.render("topmanga",{topanime : topmangajson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : {},num : req.params.num});
});
app.get("/binger/top/movie/:num",async(req,res)=>
{
  const topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  const jsontopmoviesww=await topmoviesww.json();
  const topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  const jsontopseriesww=await topseriesww.json();
  let topmovie=await fetch("https://api.themoviedb.org/3/movie/top_rated?api_key=6305d43a0ac191e9665db77ff87bbff1&page="+req.params.num);
  let tmovie = await topmovie.json();
  if(req.isAuthenticated())
     res.render("topmovie",{tmovie : tmovie,jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),user : req.user,num : req.params.num}); 
  else
  res.render("topmovie",{tmovie : tmovie,jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),user : {},num : req.params.num}); 
});
app.get("/binger/top/series/:num",async(req,res)=>
{
  const topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  const jsontopmoviesww=await topmoviesww.json();
  const topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  const jsontopseriesww=await topseriesww.json();
  let topmovie=await fetch("https://api.themoviedb.org/3/tv/top_rated?api_key=6305d43a0ac191e9665db77ff87bbff1&page="+req.params.num);
  let tmovie = await topmovie.json();
  if(req.isAuthenticated())
    res.render("topseries",{tmovie : tmovie,jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),user : req.user,num : req.params.num}); 
  else
    res.render("topseries",{tmovie : tmovie,jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),user : {},num : req.params.num}); 

});
app.get("/binger/mass/:num",async(req,res)=>
{
  const topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  const jsontopmoviesww=await topmoviesww.json();
  const topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  const jsontopseriesww=await topseriesww.json();
  let topmovie=await fetch("https://api.themoviedb.org/3/movie/top_rated?api_key=6305d43a0ac191e9665db77ff87bbff1&page="+req.params.num);
  let tmovie = await topmovie.json();
  if(req.isAuthenticated())
  res.render("randomdel",{tmovie : tmovie,jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),user : req.user,num : req.params.num}); 
  else res.render("randomdel",{tmovie : tmovie,jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),user : {},num : req.params.num}); 

});
app.get("/accprofilephoto",async (req,res)=>
{
  if(req.isAuthenticated())
    res.render("profile",{user : req.user,error:null});
  else res.redirect("/");
});
app.post("/otaku/anime/:animeid",async (req,res)=>{ 
  console.log(req.body);
  userrating.findOne({email : req.user.email},async (err,docs)=>{
    if(err)
    {
      console.log(error);
    }
    else
    {
        let temp=[]; 
          docs.animerating.forEach(async (item,i)=>{
            if(item.animeid==req.params.animeid)
            {
              temp.push(1);
            }
        });
        if(temp.length>=1)
        {
          temp.pop();
          userrating.updateOne({"email" : req.user[0].email,"animerating.animeid" : req.params.animeid},{$set : {"animerating.$.rating" : parseInt(req.body.rating)}},function(err){
            if(err) console.log("rating updation error");
          });
        }
        else{
          let ani=await fetch("https://api.jikan.moe/v3/anime/"+req.params.animeid);
          if(ani.ok){
            let anim=await ani.json();
            userrating.updateOne({"email" : req.user.email},{$push : {"animerating" : { $each : [{"animeid" : parseInt(req.params.animeid),"image" : anim.image_url,"name" : anim.title_english,"rating" : parseInt(req.body.rating),"release" : anim.aired.string}],$position : 0}}},function(err){
              if(err)
              console.log("rating updation error");
            }); 
          } 
          
        }
    }
  })
}); 
app.post("/otaku/manga/:mangaid",async (req,res)=>{ 
  console.log(req.body);
  userrating.findOne({email : req.user.email},async (err,docs)=>{
    if(err)
    {
      console.log(error);
    }
    else
    {
        let temp=[]; 
          docs.mangarating.forEach(async (item,i)=>{
            if(item.mangaid==req.params.mangaid)
            {
              temp.push(1);
            }
        });
        if(temp.length>=1)
        {
          temp.pop();
          userrating.updateOne({"email" : req.user.email,"mangarating.mangaid" : req.params.mangaid},{$set : {"mangarating.$.rating" : parseInt(req.body.rating)}},function(err){
            if(err) console.log("rating updation error");
          });
        }
        else{
          let man=await fetch("https://api.jikan.moe/v3/manga/"+req.params.mangaid);
          if(man.ok){
          let mang=await man.json(); 
          userrating.updateOne({"email" : req.user[0].email},{$push : {"mangarating" : { $each : [{"mangaid" : parseInt(req.params.mangaid),"image" : mang.image_url,"name" : mang.title_english,"rating" : parseInt(req.body.rating),"release" : mang.published.string}],$position : 0}}},function(err){
            if(err)
            console.log("rating updation error");
          });
        }
          
        }
    }
  })
});
app.post("/binger/movie/:movieid",async (req,res)=>{ 
  console.log(req.body);
  userrating.findOne({email : req.user.email},async (err,docs)=>{
    if(err)
    {
      console.log(error);
    }
    else
    {
        let temp=[]; 
        docs.movierating.forEach(async (item,i)=>{
            if(item.movieid==req.params.movieid)
            {
              temp.push(1);
            }
        });
        if(temp.length>=1)
        {
          temp.pop();
          userrating.updateOne({"email" : req.user.email,"movierating.movieid" : req.params.movieid},{$set : {"movierating.$.rating" : parseInt(req.body.rating)}},function(err){
            if(err) console.log("rating updation error");
          });
        }
        else{
          let m= await fetch("https://api.themoviedb.org/3/movie/"+req.params.movieid+"?api_key=6305d43a0ac191e9665db77ff87bbff1");
          if(m.ok) {
            let mov=await m.json();
            userrating.updateOne({"email" : req.user[0].email},{$push : {"movierating" : { $each : [{"movieid" : parseInt(req.params.movieid),"image" : mov.poster_path,"name" : mov.title,"rating" : parseInt(req.body.rating),"release" : mov.release_date}],$position : 0}}},function(err){
              if(err)
              console.log(err);
            });
          }
        }
    }
  })
});
app.post("/binger/series/:seriesid",async (req,res)=>{ 
  console.log(req.body);
  userrating.findOne({email : req.user.email},async (err,docs)=>{
    if(err)
    {
      console.log(error);
    }
    else
    {
        let temp=[]; 
          docs.seriesrating.forEach(async (item,i)=>{
            if(item.seriesid==req.params.seriesid)
            {
              temp.push(1);
            }
        });
        if(temp.length>=1)
        {
          temp.pop();
          userrating.updateOne({"email" : req.user.email,"seriesrating.seriesid" : req.params.seriesid},{$set : {"seriesrating.$.rating" : parseInt(req.body.rating)}},function(err){
            if(err) console.log("rating updation error");
          });
        }
        else{
          let seri=await fetch("https://api.themoviedb.org/3/tv/"+req.params.seriesid+"?api_key=6305d43a0ac191e9665db77ff87bbff1");
          if(seri.ok){
            let ser=await seri.json();
            userrating.updateOne({"email" : req.user.email},{$push : {"seriesrating" : { $each : [{"seriesid" : parseInt(req.params.seriesid),"image" : ser.poster_path,"name" : ser.name,"rating" : parseInt(req.body.rating),"release" : ser.first_air_date+" to "+ser.last_air_date}],$position : 0}}},function(err){
              if(err)
              console.log("rating updation error");
            });
          }
        }
    }
  })
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
app.get("/otaku/com/:postid",async (req,res)=>{
    otakuarticle.findOne({postid : req.params.postid},function(err,doc){
        if(err) res.status(404).send("Cannot connect");
        else{
          User.findOne({email : req.user.email},function(error,user){
            if(error) res.status(404).send("Cannot connect");
            else res.send({comlen : doc.comments.length,profile_pic : user.profile_image,username:user.username});
          });
        } 
    });
});
app.get("/otaku/com/:postid/:commid",async (req,res)=>{
  otakuarticle.findOne({postid : req.params.postid},function(err,docs){
    if(err) console.log("reply posting error");
    else
    {
      User.findOne({email : req.user.email},function(error,user){
        if(error) console.log("reply posting error");
        else{
          console.log(docs.comments[req.params.commid-1]);
          res.send({replen : docs.comments[req.params.commid-1].reply.length,profile_pic : user.profile_image,username:user.username});
        }
      })
    }
  })
});
app.get("/binger/com/:postid",async (req,res)=>{
  bingerarticle.findOne({postid : req.params.postid},function(err,doc){
      if(err) res.status(404).send("Cannot connect");
      else{
        User.findOne({email : req.user.email},function(error,user){
          if(error) res.status(404).send("Cannot connect");
          else res.send({comlen : doc.comments.length,profile_pic : user.profile_image,username:user.username});
        });
      } 
  });
});
app.get("/binger/com/:postid/:commid",async (req,res)=>{
bingerarticle.findOne({postid : req.params.postid},function(err,docs){
  if(err) console.log("reply posting error");
  else
  {
    User.findOne({email : req.user.email},function(error,user){
      if(error) console.log("reply posting error");
      else{
        console.log(docs.comments[req.params.commid-1]);
        res.send({replen : docs.comments[req.params.commid-1].reply.length,profile_pic : user.profile_image,username:user.username});
      }
    })
  }
})
});

