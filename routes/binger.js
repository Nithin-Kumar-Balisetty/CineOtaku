
let express = require('express')
const app = express.Router()
const mongo=require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const url = require('url');
const fetch = require('node-fetch');
const ISO6391 = require('iso-639-1');


app.use(express.json());
//app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongo.connect(process.env.MONGODB_URI||process.env.MONGOCLUSTER,{useNewUrlParser : true,useUnifiedTopology : true});
var Schema = mongo.Schema;

const articleschema=new Schema({
    postid : Number,
    postauthor :  String,
    posttitle: String,
    postdata : String,
    postimg : String,
    postdate : String,
    comments : [{commentid : Number ,date: String ,profile_pic : String,username : String,commentbody : String ,reply : [{replyid : Number,date : String, profile_pic : String,username : String,replybody : String}]}]
});

const userratingschema=new Schema({
    email : String,
    animerating : [{animeid : Number,image : String,name : String,rating : Number,release : String}],
    mangarating : [{mangaid : Number,image : String,name : String,rating : Number,release : String}],
    movierating : [{movieid : Number,image : String,name : String,rating : Number,release : String}],
    seriesrating : [{seriesid  : Number,image : String,name : String,rating : Number,release : String}]
});

const ejsLint= require('ejs-lint');
const fs = require('fs');
var multer  = require('multer');

const User= require("../dbmodels/User")
const bingerarticle =mongo.model("bingerarticle",articleschema);
//const userrating = mongo.model("userrating",userratingschema);


app.get("/",async (req,res)=>{
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


app.get("/news/:newsid",async (req,res)=>{
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



app.post("/news/:newsid",async (req,res)=>{
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

app.get("/search",async (req,res)=>{
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

app.get("/movie/:movieid",async (req,res)=>{
      let moviecredits = await fetch("https://api.themoviedb.org/3/movie/"+req.params.movieid+"/credits?api_key=6305d43a0ac191e9665db77ff87bbff1");
      let mcredits = await moviecredits.json();
      jsonmovie = await fetch(" https://api.themoviedb.org/3/movie/"+req.params.movieid+"?api_key=6305d43a0ac191e9665db77ff87bbff1");
      let jsonmoviedata=await jsonmovie.json();
      if(req.isAuthenticated())
      res.render("moviepage",{moviedataobject : jsonmoviedata,type : "movie",Language : ISO6391.getName(jsonmoviedata.original_language),mcredits : mcredits,user : req.user});
      else res.render("moviepage",{moviedataobject : jsonmoviedata,type : "movie",Language : ISO6391.getName(jsonmoviedata.original_language),mcredits : mcredits,user : {}});
  });


app.get("/series/:seriesid",async(req,res)=>
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

app.get("/compose",async(req,res)=>{
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


app.post("/",async (req,res)=>{
  
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


app.get("/top/series/:num",async(req,res)=>{
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

app.get("/mass/:num",async(req,res)=>{
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


app.post("/movie/:movieid",async (req,res)=>{ 
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

app.post("/series/:seriesid",async (req,res)=>{ 
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


app.get("/com/:postid",async (req,res)=>{
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

app.get("/com/:postid/:commid",async (req,res)=>{
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



app.get("/top/movie/:num",async(req,res)=>{
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

module.exports = app