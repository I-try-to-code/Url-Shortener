const express = require('express');
const connectDB = require('./config/db.js')
const app = express();

//connecting to db
connectDB();
app.use(express.json({ extented: false }));
const PORT = 5000;
app.listen(PORT, () => console.log("Running MATE"))


//defining routes
app.use(express.static('public'));
app.use('/', require('./routes/index.js'));
app.use('/api/url', require('./routes/url.js'));
