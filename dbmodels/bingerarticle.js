const mongoose = require('mongoose');

var Schema = mongoose.Schema;

const articleschema=new Schema({
    postid : Number,
    postauthor :  String,
    posttitle: String,
    postdata : String,
    postimg : String,
    postdate : String,
    comments : [{commentid : Number ,date: String ,profile_pic : String,username : String,commentbody : String ,reply : [{replyid : Number,date : String, profile_pic : String,username : String,replybody : String}]}]
});

const bingerarticle =mongoose.model("bingerarticle",articleschema);

module.exports = bingerarticle;