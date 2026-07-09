const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURL');

const connectDB = async () => {
    try {
        await mongoose.connect(db);

        console.log("Mongoose DB successfully connected");
    } catch (err) {
        console.log("ERROR: " + err.message);
        process.exit(1);
    }
}
module.exports = connectDB