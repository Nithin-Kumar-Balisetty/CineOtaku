const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  email : String ,
  username : String,
  personal_email : String,
  feedback : String
});

const Feedback = mongoose.model("feedback",FeedbackSchema);

module.exports = Feedback;