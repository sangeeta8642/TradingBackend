const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
    Fname: String,
    Lname: String,
    email: String,
    password: String,
    WatchListCreate: [{
        name: String,
        items: []
    }]
  });

module.exports = mongoose.model("users", userSchema);
