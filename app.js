//jshint esversion:6
//http://www.omdbapi.com/?i=tt3896198&apikey=f8d8a583
//main api key 6305d43a0ac191e9665db77ff87bbff1
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const url = require('url');
const mongo=require("mongoose");
const mongo1=require("mongoose");
const path=require("path");
const md5=require("md5");
require('dotenv').config()
const jsnop=require("parse-jsonp");
mongo.connect(process.env.MONGODB_URI||process.env.MONGOCLUSTER,{useNewUrlParser : true,useUnifiedTopology : true});
var Schema = mongo.Schema;
const userschema=new Schema({
  email : String,
  username: String,
  password : String,
  profile_image : String
});
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
const userratingschema=new Schema({
  email : String,
  animerating : [{animeid : Number,image : String,name : String,rating : Number,release : String}],
  mangarating : [{mangaid : Number,image : String,name : String,rating : Number,release : String}],
  movierating : [{movieid : Number,image : String,name : String,rating : Number,release : String}],
  seriesrating : [{seriesid  : Number,image : String,name : String,rating : Number,release : String}]
});
const ejsLint= require('ejs-lint');
const fs = require('fs');
let newuser=[];
var multer  = require('multer');
const user = mongo.model("user",userschema);
const otakuarticle=mongo.model("otakuarticle",articleschema);
const bingerarticle =mongo.model("bingerarticle",articleschema);
const userrating = mongo.model("userrating",userratingschema);
let signin=[];
var Buffer = require('buffer/').Buffer;
const { response } = require("express");
const parseJson = require('parse-json');
const app=express();
const fetch = require('node-fetch');
app.use(express.json());
const https=require("https");
const loadash=require("lodash");
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const ISO6391 = require('iso-639-1');

const { RSA_NO_PADDING } = require("constants");
app.get("/otaku",async (req,res) => {
    let topanimeresponse = await fetch("https://api.jikan.moe/v3/top/anime/1/bypopularity");
    let jsontopanime=await topanimeresponse.json();
    let topairanime= await fetch("https://api.jikan.moe/v3/top/anime/1/airing");
    let jsonairanime=await topairanime.json();
    otakuarticle.find({},function(error,docs){
      if(error)
      {
        res.render("animehome",{topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),postdetails : [],user : newuser});
      }
      else{
        res.render("animehome",{topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),postdetails : docs.slice(-10),user : newuser});
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
    res.render("searchresult",{animeobject :jsonanime.results.slice(0,10),mangaobject :jsonmanga.results.slice(0,10),topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : newuser});
});
app.get("/otaku/anime/:animeid",async (req,res)=>{
    const jsonanime = await fetch("https://api.jikan.moe/v3/anime/"+req.params.animeid);
    let jsonachar=await fetch("https://api.jikan.moe/v3/anime/"+req.params.animeid+"/characters_staff");
    let jsonchar = await jsonachar.json();
    const jsonanimedata=await jsonanime.json();
    res.render("animepage",{animedataobject : jsonanimedata,refer : "anime",user : newuser,jsonchar : jsonchar});
});
app.get("/otaku/manga/:mangaid",async (req,res)=>{
    const jsonmanga = await fetch("https://api.jikan.moe/v3/manga/"+req.params.mangaid);
    const jsonmangadata=await jsonmanga.json();
    let jsonm=await fetch("https://api.jikan.moe/v3/manga/"+req.params.mangaid+"/characters");
    let jsonmchar=await jsonm.json();
    res.render("mangapage",{animedataobject : jsonmangadata,refer : "manga",user : newuser,jsonmchar : jsonmchar});
});
app.get("/binger",async (req,res)=>
{
  let topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  let jsontopmoviesww=await topmoviesww.json();
  let topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  let jsontopseriesww=await topseriesww.json();

  bingerarticle.find({},function(error,docs){
    if(error)
    {
      res.render("moviehome",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),postdetails : [],user : newuser});
    }
    else{
      res.render("moviehome",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),postdetails : docs.slice(-10),user : newuser});
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
      res.render("bingerarticle",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),postdetails : docs,user : newuser});
    }
  });
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
res.render("msearchresult",{jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),movieobject : jsonmovie.results.slice(0,10),seriesobject : jsonseries.results.slice(0,10),user : newuser});
});
app.get("/binger/movie/:movieid",async (req,res)=>{
    let moviecredits = await fetch("https://api.themoviedb.org/3/movie/"+req.params.movieid+"/credits?api_key=6305d43a0ac191e9665db77ff87bbff1");
    let mcredits = await moviecredits.json();
    jsonmovie = await fetch(" https://api.themoviedb.org/3/movie/"+req.params.movieid+"?api_key=6305d43a0ac191e9665db77ff87bbff1");
    let jsonmoviedata=await jsonmovie.json();
    res.render("moviepage",{moviedataobject : jsonmoviedata,type : "movie",Language : ISO6391.getName(jsonmoviedata.original_language),mcredits : mcredits,user : newuser});
});
app.get("/binger/series/:seriesid",async(req,res)=>
{
    let seriescredits=await fetch("https://api.themoviedb.org/3/tv/"+req.params.seriesid+"/credits?api_key=6305d43a0ac191e9665db77ff87bbff1");
    jsonseries = await fetch("https://api.themoviedb.org/3/tv/"+req.params.seriesid+"?api_key=6305d43a0ac191e9665db77ff87bbff1"); 
    let jsonseriesdata= await jsonseries.json();
    let scredits= await seriescredits.json();
    res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : newuser},async (err)=>{
    if(err)
      {
        console.log(err);
        res.redirect("/binger");
      }
        res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : newuser});
    });
});
app.listen(process.env.PORT||2150,function(req,res)
{
  console.log("Running server on port 2150");
});
//at post place all the render templates and kepp the get route empty 
//so that it redirects to the homepage again like all the main websites do
app.get("/account",async (req,res)=>{
  if(newuser.length>=1)
   return res.status(200).redirect("/");
  else
  {
    if(signin.length==1)
    {
      signin.pop();
      res.status(200).render("login",{alreadyaccount : false ,Credentialwrong : false , alreadyaccountusername : false ,signin : true});
    }
    else
    {
      res.status(200).render("login",{alreadyaccount : false ,Credentialwrong : false , alreadyaccountusername : false ,signin : false});
    }
  }
  
});
app.post("/account",async(req,res)=>{
  if(req.body.email==null){
    let login=[];
    let lemail=req.body.lemail;
    let lpass=req.body.lpass;
    await user.findOne({email : lemail},function(err,item){
      if(err) console.log("An error");
      else{
      if(item){
        if(item.password==md5(lpass)){
            login.push("1");
            if(newuser.length==1)
              newuser.pop();
            newuser.push({email : item.email,profile_image : item.profile_image,username : item.username});
        }
      }
      }
    });
    if(login[0]=="1"){
        login.pop();
        res.redirect("/myaccount");
    }
    else
    {
      return res.status(200).render("login",{alreadyaccount : false,Credentialwrong : true,alreadyaccountusername : false,signin : false});
    }
  }
  else{
    let email=req.body.email;
    let un=req.body.username;
    let alreadyaccout=[];
    let alreadyaccout1=[];
    await user.findOne({email : email},async (err,item)=>
    {
          if(item && item.email==email){
            alreadyaccout.push("1");
          }
    });
    await user.findOne({username : un},async (err,item)=>
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
      res.render("login",{alreadyaccount : boo,Credentialwrong : false,alreadyaccountusername : boo1,signin : true});
    }
    else
    {
      let username=req.body.username;
      let pass=req.body.pass;
      let cpass=req.body.confirmpass;
      let nuser=new user({email : email,username: username,password : md5(pass),profile_image : "/uploads/deafult.webp"});
      nuser.save();
      let nuserrate=new userrating({email : email,animerating : [],mangarating : [],movierating : [],seriesrating : []});
      nuserrate.save();
      res.redirect("/account");
    }
  }
});
app.get("/accounts",async(req,res)=>{
  signin.push("1");
  res.redirect("/account");
});
app.get("/signout",async (req,res)=>{
  newuser.pop();
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
      res.render("otakuarticle",{topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),postdetails : docs,user : newuser});
    }
  });
});
app.post("/",async (req,res)=>{

});
app.get("/otaku/compose",async(req,res)=>{
  if(newuser.length==1){
    if(newuser[0].email==process.env.MASTER)
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
  if(newuser.length==1){
    if(newuser[0].email==process.env.MASTER)
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
  let temp=newuser[0].email;
  return cb(null, temp+path.extname(file.originalname))
};
const upload = multer({
    storage: storage,
    fileFilter : async (req,file,cb)=>
    {
      if([".jpeg",".jpg",".png",".webp"].includes(path.extname(file.originalname).toLowerCase()))
      {
        await user.updateOne({"email" : newuser[0].email}, 
        {"profile_image":"/uploads/"+newuser[0].email+path.extname(file.originalname).toLowerCase()}, function (er) {
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
              if(file.includes(newuser[0].email))
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
        newuser[0].profile_image="/uploads/"+newuser[0].email+path.extname(file.originalname).toLowerCase();
        return cb(null,true);
      }
      else
        return cb("File is not in .jpeg or .webp or .jpg or .png format");
    }
}).single("profile_img");
app.get("/myaccount",async (req,res)=>{
  if(newuser.length>=1)
  {
    userrating.findOne({email : newuser[0].email},async (err,doc)=>
    {
      if(err)
      {
        console.log("Error in find mongo method");
      }
      res.render("myaccount", { userinfo: newuser, ratingdata: doc }, function (err) {
        if (err) {
          console.log(err);
          res.redirect("/");
        }

        else {
          res.status(200).render("myaccount", { userinfo: newuser, ratingdata: doc });
        }
      });
    });
  }
  else
  {
    res.status(404).send("Cannot GET /myaccount");
  }
});
app.post("/myaccountpi",async(req,res)=>{
  upload(req,res,async (err)=>{    
    if(err){
      console.log("testing..");
      res.render("profile",{user : newuser,error :err});
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
   console.log(req.body.commentbody);
   if(typeof req.body.replybody=="undefined")
  {
    otakuarticle.updateOne({postid : req.params.newsid},{$push : {comments : {commentid : req.body.commentid,date : (new Date()),profile_pic : req.body.profile_pic,username : req.body.username,commentbody : req.body.commentbody,reply : []}}},function(err,docs)
    {
        if(err)
           console.log("comment posting error");
    });
  }
  if(typeof req.body.commentbody=="undefined"){
    let l=[];
    otakuarticle.findOne({postid : req.params.newsid},function(err,docs){
          if(err)
            console.log("reply posting");
          else
          {
            if(docs)
                l.push(docs.comments[req.body.commentid-1].reply.length);
          }
    });
    var len=l[0]+1;
    l.pop();
    console.log(len);
    otakuarticle.updateOne({postid : req.params.newsid,"comments.commentid" : req.body.commentid},{$push : {"comments.$.reply" : {replyid : len,date : (new Date()),profile_pic : req.body.profile_pic,username : req.body.username,replybody : req.body.replybody}}},function(err,docs)
    {
        if(err){
          console.log("comment posting error");
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
//console.log(DateDiff.inDays(d1, d2));
//console.log(DateDiff.inWeeks(d1, d2));
//console.log(DateDiff.inMonths(d1, d2));
//console.log(DateDiff.inYears(d1, d2));
//console.log((new Date()));
app.get("/otaku/top/anime/:num",async (req,res)=>{
  let topanimeresponse = await fetch("https://api.jikan.moe/v3/top/anime/1/bypopularity");
  let jsontopanime=await topanimeresponse.json();
  let topairanime= await fetch("https://api.jikan.moe/v3/top/anime/1/airing");
  let jsonairanime=await topairanime.json();
  const topanime=await fetch("https://api.jikan.moe/v3/top/anime/"+req.params.num);
  const topanimejson=await topanime.json();
  res.render("topanime",{topanime : topanimejson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : newuser,num : req.params.num});
});
app.get("/otaku/top/manga/:num",async(req,res)=>{
  let topanimeresponse = await fetch("https://api.jikan.moe/v3/top/anime/1/bypopularity");
  let jsontopanime=await topanimeresponse.json();
  let topairanime= await fetch("https://api.jikan.moe/v3/top/anime/1/airing");
  let jsonairanime=await topairanime.json();
  const topmanga=await fetch("https://api.jikan.moe/v3/top/manga/"+req.params.num);
  const topmangajson=await topmanga.json();
  res.render("topmanga",{topanime : topmangajson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : newuser,num : req.params.num});
});
app.get("/binger/top/movie/:num",async(req,res)=>
{
  const topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  const jsontopmoviesww=await topmoviesww.json();
  const topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  const jsontopseriesww=await topseriesww.json();
  let topmovie=await fetch("https://api.themoviedb.org/3/movie/top_rated?api_key=6305d43a0ac191e9665db77ff87bbff1&page="+req.params.num);
  let tmovie = await topmovie.json();
  res.render("topmovie",{tmovie : tmovie,jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),user : newuser,num : req.params.num}); 
});
app.get("/binger/top/series/:num",async(req,res)=>
{
  const topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  const jsontopmoviesww=await topmoviesww.json();
  const topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  const jsontopseriesww=await topseriesww.json();
  let topmovie=await fetch("https://api.themoviedb.org/3/tv/top_rated?api_key=6305d43a0ac191e9665db77ff87bbff1&page="+req.params.num);
  let tmovie = await topmovie.json();
  res.render("topseries",{tmovie : tmovie,jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),user : newuser,num : req.params.num}); 
});
app.get("/binger/mass/:num",async(req,res)=>
{
  const topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  const jsontopmoviesww=await topmoviesww.json();
  const topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  const jsontopseriesww=await topseriesww.json();
  let topmovie=await fetch("https://api.themoviedb.org/3/movie/top_rated?api_key=6305d43a0ac191e9665db77ff87bbff1&page="+req.params.num);
  let tmovie = await topmovie.json();
  res.render("randomdel",{tmovie : tmovie,jsontopmoviesw:jsontopmoviesww.results.slice(0,5),jsontopseriesw:jsontopseriesww.results.slice(0,5),user : newuser,num : req.params.num}); 
});
app.get("/accprofilephoto",async (req,res)=>
{
  if(newuser.length>=1)
   res.render("profile",{user : newuser,error:null});
  res.redirect("/");
});
app.post("/otaku/anime/:animeid",async (req,res)=>{ 
  console.log(req.body);
  userrating.findOne({email : newuser[0].email},async (err,docs)=>{
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
          userrating.updateOne({"email" : newuser[0].email,"animerating.animeid" : req.params.animeid},{$set : {"animerating.$.rating" : parseInt(req.body.rating)}},function(err){
            if(err) console.log("rating updation error");
          });
        }
        else{
          let ani=await fetch("https://api.jikan.moe/v3/anime/"+req.params.animeid);
          if(ani.ok){
            let anim=await ani.json();
            userrating.updateOne({"email" : newuser[0].email},{$push : {"animerating" : { $each : [{"animeid" : parseInt(req.params.animeid),"image" : anim.image_url,"name" : anim.title_english,"rating" : parseInt(req.body.rating),"release" : anim.aired.string}],$position : 0}}},function(err){
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
  userrating.findOne({email : newuser[0].email},async (err,docs)=>{
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
          userrating.updateOne({"email" : newuser[0].email,"mangarating.mangaid" : req.params.mangaid},{$set : {"mangarating.$.rating" : parseInt(req.body.rating)}},function(err){
            if(err) console.log("rating updation error");
          });
        }
        else{
          let man=await fetch("https://api.jikan.moe/v3/manga/"+req.params.mangaid);
          if(man.ok){
          let mang=await man.json(); 
          userrating.updateOne({"email" : newuser[0].email},{$push : {"mangarating" : { $each : [{"mangaid" : parseInt(req.params.mangaid),"image" : mang.image_url,"name" : mang.title_english,"rating" : parseInt(req.body.rating),"release" : mang.published.string}],$position : 0}}},function(err){
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
  userrating.findOne({email : newuser[0].email},async (err,docs)=>{
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
          userrating.updateOne({"email" : newuser[0].email,"movierating.movieid" : req.params.movieid},{$set : {"movierating.$.rating" : parseInt(req.body.rating)}},function(err){
            if(err) console.log("rating updation error");
          });
        }
        else{
          let m= await fetch("https://api.themoviedb.org/3/movie/"+req.params.movieid+"?api_key=6305d43a0ac191e9665db77ff87bbff1");
          if(m.ok) {
            let mov=await m.json();
            userrating.updateOne({"email" : newuser[0].email},{$push : {"movierating" : { $each : [{"movieid" : parseInt(req.params.movieid),"image" : mov.poster_path,"name" : mov.title,"rating" : parseInt(req.body.rating),"release" : mov.release_date}],$position : 0}}},function(err){
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
  userrating.findOne({email : newuser[0].email},async (err,docs)=>{
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
          userrating.updateOne({"email" : newuser[0].email,"seriesrating.seriesid" : req.params.seriesid},{$set : {"seriesrating.$.rating" : parseInt(req.body.rating)}},function(err){
            if(err) console.log("rating updation error");
          });
        }
        else{
          let seri=await fetch("https://api.themoviedb.org/3/tv/"+req.params.seriesid+"?api_key=6305d43a0ac191e9665db77ff87bbff1");
          if(seri.ok){
            let ser=await seri.json();
            userrating.updateOne({"email" : newuser[0].email},{$push : {"seriesrating" : { $each : [{"seriesid" : parseInt(req.params.seriesid),"image" : ser.poster_path,"name" : ser.name,"rating" : parseInt(req.body.rating),"release" : ser.first_air_date+" to "+ser.last_air_date}],$position : 0}}},function(err){
              if(err)
              console.log("rating updation error");
            });
          }
        }
    }
  })
});
app.get("/accpasschange",async (req,res)=>{
  if(newuser.lenght==0)
    res.status(404).send("Cannot GET /accpasschange");
  else
    res.render("password");
});
app.post("/accpasschange", function(req,res){
  user.updateOne({"email" : newuser[0].email},{$set : {"password" : md5(req.body.pass)}},function(err){
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
