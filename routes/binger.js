let express = require('express')
const app = express.Router()
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const ISO6391 = require('iso-639-1');


app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


const User= require("../dbmodels/User")
const bingerarticle =require('../dbmodels/bingerarticle');
const userrating = require('../dbmodels/userrating');
const watchlist = require('../dbmodels/watchlist')
const Feedback = require('../dbmodels/feedback');

app.get("/",async (req,res)=>{
  console.log(req.isAuthenticated());
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
    console.log(myURL.search);
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

      let movierating = null;

      if(req.isAuthenticated()){
        let temp = await userrating.aggregate([{ $match: { email : req.user.email } },
          // Unwind the movieratings array
          { $unwind: '$movierating' },
          // Match the specific movieId within the unwound movieratings array
          { $match: { 'movierating.movieid': parseInt(req.params.movieid) } },
          // Project to include only the matching movieratings list item
          { $project: { _id: 0, movierating: '$movierating' } }]);

        if(temp.length === 0) movierating = null;
        else movierating = temp[0].movierating; 
        console.log(movierating);
      }

      let watchlistratings = null;

      if(req.isAuthenticated()){
        let temp = await watchlist.aggregate([{ $match: { email : req.user.email } },
          // Unwind the movieratings array
          { $unwind: '$moviewatchlist' },
          // Match the specific movieId within the unwound movieratings array
          { $match: { 'moviewatchlist.movieid': parseInt(req.params.movieid) } },
          // Project to include only the matching movieratings list item
          { $project: { _id: 0, moviewatchlist: '$moviewatchlist' } }]);

        if(temp.length === 0) watchlistratings = null;
        else watchlistratings = temp[0].moviewatchlist; 
        console.log(watchlistratings);
      }
      
      if(req.isAuthenticated())
        res.render("moviepage",{moviedataobject : jsonmoviedata,type : "movie",Language : ISO6391.getName(jsonmoviedata.original_language),mcredits : mcredits,user : req.user,movierating : movierating,watchlistratings : watchlistratings});
      else res.render("moviepage",{moviedataobject : jsonmoviedata,type : "movie",Language : ISO6391.getName(jsonmoviedata.original_language),mcredits : mcredits,user : {},movierating : null, watchlistratings : null});
  });


app.get("/series/:seriesid",async(req,res)=>
  {
      let seriescredits=await fetch("https://api.themoviedb.org/3/tv/"+req.params.seriesid+"/credits?api_key=6305d43a0ac191e9665db77ff87bbff1");
      jsonseries = await fetch("https://api.themoviedb.org/3/tv/"+req.params.seriesid+"?api_key=6305d43a0ac191e9665db77ff87bbff1"); 
      let jsonseriesdata= await jsonseries.json();
      let scredits= await seriescredits.json();


      let movierating = null;

      if(req.isAuthenticated()){
        let temp = await userrating.aggregate([{ $match: { email : req.user.email } },
          // Unwind the movieratings array
          { $unwind: '$seriesrating' },
          // Match the specific movieId within the unwound movieratings array
          { $match: { 'seriesrating.seriesid': parseInt(req.params.seriesid) } },
          // Project to include only the matching movieratings list item
          { $project: { _id: 0, seriesrating: '$seriesrating' } }]);

        if(temp.length === 0) movierating = null;
        else movierating = temp[0].seriesrating; 
        console.log(movierating);
      }

      let watchlistratings = null;

      if(req.isAuthenticated()){
        let temp = await watchlist.aggregate([{ $match: { email : req.user.email } },
          // Unwind the movieratings array
          { $unwind: '$serieswatchlist' },
          // Match the specific movieId within the unwound movieratings array
          { $match: { 'serieswatchlist.seriesid': parseInt(req.params.seriesid) } },
          // Project to include only the matching movieratings list item
          { $project: { _id: 0, serieswatchlist: '$serieswatchlist' } }]);
        
        if(temp.length === 0) watchlistratings = null;
        else watchlistratings = temp[0].serieswatchlist; 
        console.log('#####');
        console.log(temp);
        console.log(watchlistratings);
        console.log('####');
      }

      if(req.isAuthenticated())
      res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : req.user,movierating : movierating,watchlistratings : watchlistratings});
      else
      res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : {},movierating : null,watchlistratings : null});
      /*res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : req.user},async (err)=>{
      if(err)
        {
          console.log(err);
          res.redirect("/binger");
        }
        else{
          if(req.isAuthenticated())
            res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : req.user});
          else  res.render("seriespage",{moviedataobject : jsonseriesdata,type : "series",Language : ISO6391.getName(jsonseriesdata.original_language),scredits : scredits,user : {}});
        }
      });*/
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

  
app.get("/top/series/:num",async(req,res)=>{
  const topmoviesww = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=6305d43a0ac191e9665db77ff87bbff1").catch(err=>console.log(err));
  const jsontopmoviesww=await topmoviesww.json();
  const topseriesww= await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=6305d43a0ac191e9665db77ff87bbff1");
  const jsontopseriesww=await topseriesww.json();
  let topmovie=await fetch("https://api.themoviedb.org/3/tv/top_rated?api_key=6305d43a0ac191e9665db77ff87bbff1&page="+req.params.num);
  let tmovie = await topmovie.json();
  console.log("request made");
  console.log(req.originalUrl);
  console.log(tmovie);
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
      if(err)  console.log(err);
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
              let genres = [];
              for(let i=0;i<mov.genres.length;i++)
                genres.push(mov.genres[i].id)
              userrating.updateOne({"email" : req.user.email},{$push : {"movierating" : { $each : [{"genres" : genres,"movieid" : parseInt(req.params.movieid),"image" : mov.poster_path,"name" : mov.title,"rating" : parseInt(req.body.rating),"release" : mov.release_date}],$position : 0}}},function(err){
                if(err)
                console.log(err);
              });
            }
          }
      }
    })
  });


app.put('/movie/:movieid',async (req,res)=>{
  if(req.isAuthenticated()){
    let temp = await watchlist.aggregate([{ $match: { email : req.user.email } },
      // Unwind the movieratings array
      { $unwind: '$moviewatchlist' },
      // Match the specific movieId within the unwound movieratings array
      { $match: { 'moviewatchlist.movieid': parseInt(req.params.movieid) } },
      // Project to include only the matching movieratings list item
      { $project: { _id: 0, moviewatchlist: '$moviewatchlist' } }]);

    if(temp.length === 0){
      let m= await fetch("https://api.themoviedb.org/3/movie/"+req.params.movieid+"?api_key=6305d43a0ac191e9665db77ff87bbff1");
      let mov=await m.json();
      watchlist.updateOne({"email" : req.user.email},{$push : {"moviewatchlist" : { $each : [{"movieid" : parseInt(req.params.movieid),"image" : mov.poster_path,"name" : mov.title,"release" : mov.release_date}],$position : 0}}},function(err){
        if(err)
        console.log(err);
      });
    }
    else{
      const filter = { email: req.user.email, 'moviewatchlist.movieid': req.params.movieid };

      // Specify the update operation to remove the specific moviewatchlist item
      const update = { $pull: { moviewatchlist: { movieid: req.params.movieid } } };

      // Set the option to return the modified document after update
      const options = { new: true };

      // Perform the update operation
      const updatedDocument = await watchlist.findOneAndUpdate(filter, update, options);
    }
    
    res.send('Success');
}
else{
  res.send('Failure');
}
});



app.post("/series/:seriesid",async (req,res)=>{ 
    console.log(req.body);
    userrating.findOne({email : req.user.email},async (err,docs)=>{
      if(err)
      {
        console.log(err);
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

app.put("/series/:seriesid",async (req,res)=>{
  if(req.isAuthenticated()){
    let temp = await watchlist.aggregate([{ $match: { email : req.user.email } },
      // Unwind the movieratings array
      { $unwind: '$serieswatchlist' },
      // Match the specific movieId within the unwound movieratings array
      { $match: { 'serieswatchlist.seriesid': parseInt(req.params.seriesid) } },
      // Project to include only the matching movieratings list item
      { $project: { _id: 0, serieswatchlist: '$serieswatchlist' } }]);

    if(temp.length === 0){
      let m= await fetch("https://api.themoviedb.org/3/tv/"+req.params.seriesid+"?api_key=6305d43a0ac191e9665db77ff87bbff1");
      let mov=await m.json();
      watchlist.updateOne({"email" : req.user.email},{$push : {"serieswatchlist" : { $each : [{"seriesid" : parseInt(req.params.seriesid),"image" : mov.poster_path,"name" : mov.name,"release" : mov.first_air_date+" to "+mov.last_air_date}],$position : 0}}},function(err){
        if(err)
        console.log(err);
      });
    }
    else{
      const filter = { email: req.user.email, 'serieswatchlist.seriesid': req.params.seriesid };

      // Specify the update operation to remove the specific moviewatchlist item
      const update = { $pull: { serieswatchlist: { seriesid: req.params.seriesid } } };

      // Set the option to return the modified document after update
      const options = { new: true };

      // Perform the update operation
      const updatedDocument = await watchlist.findOneAndUpdate(filter, update, options);
    }
    
    res.send('Success');
}
else{
  res.send('Failure');
}
})



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

async function suggestion_helper(req,num){
  return new Promise(async (res,rej)=>{
    try{
      console.log('Entering')
      if(req.isAuthenticated()){
        let final_db = [],movies_genre = {},movie_ids = [];
        let suggestions = [];
        userrating.findOne({'email' : req.user.email},async (err,docs)=>{  
          //console.log(docs);
          docs.movierating.forEach((item)=>{
            for(let counter=0;counter<item.genres.length;counter++){
              //console.log(item.genres)
              if(item.genres[counter] in movies_genre)
                movies_genre[item.genres[counter]]+=1;
              else
                movies_genre[item.genres[counter]]=1;
              //console.log(docs.movierating);
              if(typeof docs.movierating[counter] != 'undefined')
                movie_ids.push(docs.movierating[counter].movieid);
              
            }       
          })
          for(let counter=0;counter<docs.movierating.length;counter++){
            let topmoviesww = await fetch("https://api.themoviedb.org/3/movie/"+docs.movierating[counter].movieid+"/recommendations?api_key=6305d43a0ac191e9665db77ff87bbff1&language=en-US&page=1").catch(err=>console.log(err));
            let jsontopseriesww=await topmoviesww.json();
            final_db.push(...jsontopseriesww.results);
          }
          final_db.sort((a,b) => b.vote_count - a.vote_count);
          var sort_item = Object.keys(movies_genre).map(function(key) {
            return [key, movies_genre[key]];
          });    
          sort_item.sort((first, second) => (second[1] - first[1]));
          filtered_genre_top5 = []

          // Inside slice menth
          sort_item.slice(0,3).forEach((item)=>{
            filtered_genre_top5.push(item[0]);
          })
          let unique_set = new Set()
          //console.log(filtered_genre_top5);
          final_db.forEach((item_tmp)=>{
            for(let j=0;j<item_tmp.genre_ids.length;j++){
              if (filtered_genre_top5.includes(item_tmp.genre_ids[j].toString())){
                if(!unique_set.has(item_tmp.id)){
                  suggestions.push(item_tmp); 
                  unique_set.add(item_tmp.id);
                } 
                break;
              }
            }
          })
          //res.send(suggestions.slice(0,20));
          //console.log('set')
          //console.log(unique_set);
          console.log(suggestions);
          res(suggestions.slice(0,num));
        })
      }
      else 
        res(undefined);
    }
    catch(err){
        res(undefined);
    }
  })
}


app.get('/suggestions',async (req,res)=>{
  if(req.isAuthenticated()){
    let suggestions_res = await suggestion_helper(req,20);
    //console.log(suggestions_res.length);
    if(typeof suggestions_res == 'undefined')
      res.render('suggestions',{jsondata : [],user : req.user})
    else
      res.render('suggestions',{jsondata : suggestions_res, user : req.user});
  }
  else{
    res.redirect('/login');
  }
})


app.get('/feedback',(req,res)=>{
  if(req.isAuthenticated()){
    if(req.user.email === process.env.MASTER){
      Feedback.find({}, (err, items) => {
        if (err) {
          console.error(err);
          res.redirect('/binger');
        } else {
          console.log(items);
          res.render('admin_feedback',{feedback : items});
        }
      });
    }
    else res.render('feedback',{});
  }
  else
    res.redirect('/login');
})

app.post('/feedback',async (req,res)=>{
  console.log('POsted');

  if(req.user.email === process.env.MASTER){
    console.log('POsted');
    const result = await Feedback.deleteMany({email : req.body.email , username : req.body.username, personal_email : req.body.personal_email, feedback : req.body.feedback});
    res.redirect('/binger/feedback');
  }
  else{
    (new Feedback({email : req.user.email, username : req.user.username, personal_email : req.body.email, feedback : req.body.feedback})).save();
    res.redirect('/binger/feedback');
  }
})

module.exports = app