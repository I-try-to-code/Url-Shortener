const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const shortid = require('shortid');
const config = require('config');
const crypto = require('crypto');
const Url = require('../models/url');
const base62 = require('base62');

// Basic Auth Middleware
const basicAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Robovitics Admin"');
        return res.status(401).json({ error: 'Authentication required' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'basic') {
        res.setHeader('WWW-Authenticate', 'Basic realm="Robovitics Admin"');
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = parts[1];
    try {
        const credentials = Buffer.from(token, 'base64').toString('ascii').split(':');
        const username = credentials[0];
        const password = credentials[1];

        const expectedUsername = config.get('adminUsername') || 'admin';
        const expectedPassword = config.get('adminPassword') || 'roboviticsadmin';

        if (username === expectedUsername && password === expectedPassword) {
            return next();
        }
    } catch (err) {
        // Fall through
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Robovitics Admin"');
    return res.status(401).json({ error: 'Invalid credentials' });
};

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
