const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const shortid = require('shortid');
const config = require('config');
const crypto = require('crypto');
const Url = require('../models/url');
const base62 = require('base62')

//@route post /api/url/shorten
//@desc create short url
router.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;
    const baseURL = config.get('baseURL');

    if (!validUrl.isUri(baseURL)) {
        return res.status(401).json('Invalid URL entered')
    }

    //GENERATing CUSTOM UR....I WILL CREATE A HASH USING MD5 AND THEN USE BASE62 TO GET THE SHORT ID (62 CHARACTERS)
    const generateUrlCode = (longUrl) => {
        const buffer = crypto.createHash('md5').update(longUrl).digest();

        return buffer.subarray(0, 4).toString('base64url');
    };

    if (validUrl.isUri(longUrl)) {
        try {
            let url = await Url.findOne({ longUrl });
            if (url) {
                res.json(url);
            }
            else {
                let urlCode = generateUrlCode(longUrl);
                let urlExists = await Url.findOne({ urlCode });

                // If collision occurs, appending a random number as suffix to ensure uniquenss
                while (urlExists) {
                    const randomSuffix = Math.floor(Math.random() * 1000000).toString();
                    urlCode = generateUrlCode(longUrl + randomSuffix);
                    urlExists = await Url.findOne({ urlCode });
                }

                const shortUrl = baseURL + '/' + urlCode;
                url = new Url({
                    longUrl,
                    shortUrl,
                    urlCode,
                    date: new Date()
                });

                await url.save();
                res.json(url);
            }


        }
        catch (err) {
            console.error(err);
            res.status(500).json('Server Error');
        }
    }
    else {
        res.status(401).json('INVALID URL ENTERED');
    }
})

module.exports = router;

