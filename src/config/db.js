const {MIN_LENGTH_ONE} = require('../constants');
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(MIN_LENGTH_ONE); 
    }
   
};

module.exports = connectDB;
