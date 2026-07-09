const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const shortid = require('shortid');
const config = require('config');
const Url = require('../models/url')

//@route post /api/url/shorten
//@desc create short url
router.post('/shorten', (req, res) => {
    const { longUrl } = req.body;
    const baseUrl = config.get('baseUrl');

    if (!validUrl.usUri(baseUrl)) {
        return res.status(401).json('Invalid URL entered')
    }

    const urlCode = function () {

    }

    if
})


module.exports = router

