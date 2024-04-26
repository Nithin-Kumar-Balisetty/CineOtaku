const mongoose = require('mongoose');

var Schema = mongoose.Schema;

const watchlistschema=new Schema({
    email : String,
    animewatchlist : [{animeid : Number,image : String,name : String,release : String}],
    mangawatchlist : [{mangaid : Number,image : String,name : String,release : String}],
    moviewatchlist : [{movieid : Number,image : String,name : String,release : String,genres : [Number]}],
    serieswatchlist : [{seriesid  : Number,image : String,name : String,release : String}]
  });

const watchlist = mongoose.model("watchlist",watchlistschema);

module.exports = watchlist;