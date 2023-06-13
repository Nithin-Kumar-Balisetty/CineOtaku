let express = require('express')
const app = express.Router()
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const ISO6391 = require('iso-639-1');


app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


const User= require("../dbmodels/User")
const otakuarticle =require('../dbmodels/otakuarticle');
const userrating = require('../dbmodels/userrating');

app.get("/",async (req,res) => {
    console.log(req.isAuthenticated());
    let topanimeresponse = await fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity");
    let jsontopanime=await topanimeresponse.json();
    let topairanime= await fetch("https://api.jikan.moe/v4/top/anime?filter=airing");
    let jsonairanime=await topairanime.json();
    otakuarticle.find({},function(error,docs){
      if(error)
      {
        if(req.isAuthenticated())
          res.render("animehome",{topanimeobject :jsontopanime.data.slice(0,5),airanimeobject : jsonairanime.data.slice(0,5),postdetails : [],user : req.user});
        else
          res.render("animehome",{topanimeobject :jsontopanime.data.slice(0,5),airanimeobject : jsonairanime.data.slice(0,5),postdetails : [],user : {}});
      }
      else{
        if(req.isAuthenticated())
          res.render("animehome",{topanimeobject :jsontopanime.data.slice(0,5),airanimeobject : jsonairanime.data.slice(0,5),postdetails : docs.slice(-10),user : req.user});
        else
          res.render("animehome",{topanimeobject :jsontopanime.data.slice(0,5),airanimeobject : jsonairanime.data.slice(0,5),postdetails : docs.slice(-10),user : {}});     
      }
    });
});

app.post("/",async (req,res)=>{
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

app.get("/search",async (req,res) =>
{
    const myURL = new URL("https:/"+req.url);
    const animeresponse = await fetch("https://api.jikan.moe/v4/anime?q="+myURL.search.slice(3));
    const jsonanime=await animeresponse.json();
    //console.log(myURL.search.slice(3))
    const mangaresponse = await fetch("https://api.jikan.moe/v4/manga?q="+myURL.search.slice(3));
    const jsonmanga=await mangaresponse.json();
    let topanimeresponse = await fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity");
    let jsontopanime=await topanimeresponse.json();
    let topairanime= await fetch("https://api.jikan.moe/v4/top/anime?filter=airing");
    let jsonairanime=await topairanime.json();
    if(req.isAuthenticated())
      res.render("searchresult",{animeobject :jsonanime.data.slice(0,10),mangaobject :jsonmanga.data.slice(0,10),topanimeobject :jsontopanime.data.slice(0,5),airanimeobject : jsonairanime.data.slice(0,5),user : req.user});
    else 
     res.render("searchresult",{animeobject :jsonanime.data.slice(0,10),mangaobject :jsonmanga.data.slice(0,10),topanimeobject :jsontopanime.data.slice(0,5),airanimeobject : jsonairanime.data.slice(0,5),user : {}});   
});
app.get("/anime/:animeid",async (req,res)=>{
    const jsonanime = await fetch("https://api.jikan.moe/v4/anime/"+req.params.animeid+'/full');
    let jsonachar=await fetch("https://api.jikan.moe/v4/anime/"+req.params.animeid+"/staff");
    
    let jsonchar = await jsonachar.json();
    const jsonanimedata=await jsonanime.json();
    console.log(jsonchar);
    if('status' in jsonanimedata || 'status' in jsonchar) res.send("Error in loading page");
    else{
    if(req.isAuthenticated())
      res.render("animepage",{animedataobject : jsonanimedata.data,refer : "anime",user : req.user,jsonchar : jsonchar.data});
    else
      res.render("animepage",{animedataobject : jsonanimedata.data,refer : "anime",user : {},jsonchar : jsonchar.data}); 
    }
});
app.get("/manga/:mangaid",async (req,res)=>{
    const jsonmanga = await fetch("https://api.jikan.moe/v4/manga/"+req.params.mangaid);
    const jsonmangadata=await jsonmanga.json();
    let jsonm=await fetch("https://api.jikan.moe/v4/manga/"+req.params.mangaid+"/characters");
    let jsonmchar=await jsonm.json();
    if(req.isAuthenticated()) res.render("mangapage",{animedataobject : jsonmangadata,refer : "manga",user : req.user,jsonmchar : jsonmchar});
    else res.render("mangapage",{animedataobject : jsonmangadata,refer : "manga",user : {},jsonmchar : jsonmchar});
});

app.get("/news/:newsid",async (req,res) => {
    let topanimeresponse = await fetch("https://api.jikan.moe/v4/top/anime/1/bypopularity");
    let jsontopanime=await topanimeresponse.json();
    let topairanime= await fetch("https://api.jikan.moe/v4/top/anime/1/airing");
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
  
app.get("/compose",async(req,res)=>{
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

app.post("/news/:newsid",async (req,res)=>{
    console.log(req.body);
    
    if(typeof req.body.replybody=="undefined"){
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

app.get("/top/anime/:num",async (req,res)=>{
    let topanimeresponse = await fetch("https://api.jikan.moe/v4/top/anime/1/bypopularity");
    let jsontopanime=await topanimeresponse.json();
    let topairanime= await fetch("https://api.jikan.moe/v4/top/anime/1/airing");
    let jsonairanime=await topairanime.json();
    const topanime=await fetch("https://api.jikan.moe/v4/top/anime/"+req.params.num);
    const topanimejson=await topanime.json();
    if(req.isAuthenticated())
    res.render("topanime",{topanime : topanimejson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : req.user,num : req.params.num});
    else res.render("topanime",{topanime : topanimejson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : {},num : req.params.num});
  });

app.get("/top/manga/:num",async(req,res)=>{
    let topanimeresponse = await fetch("https://api.jikan.moe/v4/top/anime/1/bypopularity");
    let jsontopanime=await topanimeresponse.json();
    let topairanime= await fetch("https://api.jikan.moe/v4/top/anime/1/airing");
    let jsonairanime=await topairanime.json();
    const topmanga=await fetch("https://api.jikan.moe/v4/top/manga/"+req.params.num);
    const topmangajson=await topmanga.json();
    if(req.isAuthenticated())
      res.render("topmanga",{topanime : topmangajson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : req.user,num : req.params.num});
    else
    res.render("topmanga",{topanime : topmangajson,topanimeobject :jsontopanime.top.slice(0,5),airanimeobject : jsonairanime.top.slice(0,5),user : {},num : req.params.num});
});

app.post("/anime/:animeid",async (req,res)=>{ 
    console.log(req.body);
    userrating.findOne({email : req.user.email},async (err,docs)=>{
      if(err)
        console.log(err);
      else
      {
          let temp=[]; 
            docs.animerating.forEach(async (item,i)=>{
              if(item.animeid==req.params.animeid)
                temp.push(1);
          });
          if(temp.length>=1)
          {
            temp.pop();
            userrating.updateOne({"email" : req.user[0].email,"animerating.animeid" : req.params.animeid},{$set : {"animerating.$.rating" : parseInt(req.body.rating)}},function(err){
              if(err) console.log("rating updation error");
            });
          }
          else{
            let ani=await fetch("https://api.jikan.moe/v4/anime/"+req.params.animeid);
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

app.post("/manga/:mangaid",async (req,res)=>{ 
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
            let man=await fetch("https://api.jikan.moe/v4/manga/"+req.params.mangaid);
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

app.get("/com/:postid",async (req,res)=>{
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

app.get("/com/:postid/:commid",async (req,res)=>{
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


module.exports = app;

