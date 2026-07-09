const express = require('express');
const connectDB = require('./config/db.js')
const path = require('path');
const app = express();

//connecting to db
connectDB();
app.use(express.json({ extented: false }));
const PORT = 5000;
app.listen(PORT, () => console.log("Running MATE"))


//defining routes
app.use(express.static('public'));

const urlRouter = require('./routes/url.js');

// Protect admin HTML page with basic auth
app.get('/admin', urlRouter.basicAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.use('/', require('./routes/index.js'));
app.use('/api/url', urlRouter);
