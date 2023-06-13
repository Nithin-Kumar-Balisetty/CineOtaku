const mongoose = require('mongoose');

var Schema = mongoose.Schema;


const userratingschema=new Schema({
    email : String,
    animerating : [{animeid : Number,image : String,name : String,rating : Number,release : String}],
    mangarating : [{mangaid : Number,image : String,name : String,rating : Number,release : String}],
    movierating : [{movieid : Number,image : String,name : String,rating : Number,release : String,genres : [Number]}],
    seriesrating : [{seriesid  : Number,image : String,name : String,rating : Number,release : String}]
  });

const userrating = mongoose.model("userrating",userratingschema);

module.exports = userrating;