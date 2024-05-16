const mongoose = require("mongoose");

// Define the metadata schema
const metaDataSchema = new mongoose.Schema({
    CompanyName:String,
    Information: String,
    Symbol: String,
    LastRefreshed: String,
    OutputSize: String,
    TimeZone: String
});

// Create a Mongoose model
module.exports =  mongoose.model('CardData', metaDataSchema);