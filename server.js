/*
    Node.js, express, oauth example using Twitters API

    Install Dependencies:
        npm install express
        npm install oauth

    Create App File:
        Save this file to app.js

    Start Server:
        node app.js

    Navigate to the page:
        Local host: http://127.0.0.1:8080
        Remote host: http://yourserver.com:8080

*/

const express = require('express')
const bodyParser = require('body-parser')
const logger = require('express-logger')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const inspect = require('util-inspect')
const oauth = require('oauth')
const cors = require('cors')
const Twitter = require('twitter')
require('dotenv').config()

const app = express()
// Check cors permissions before production


// Get your credentials here: https://dev.twitter.com/apps
const _twitterConsumerKey = process.env.TWITTER_CONSUMER_KEY
const _twitterConsumerSecret = process.env.TWITTER_CONSUMER_SECRET
const _twitterCallbackUrl = process.env.TWITTER_CALLBACK_URL
const _origins = (process.env.ACCESS_CONTROL_ALLOW_ORIGINS || '').split(',')

app.use(cors({
  origin: _origins,
  credentials: true
}))

console.log('Loading data')
const knownIds = require('./knownIds')
console.log('Loaded data')

const PORT = process.env.PORT || 8080

const consumer = new oauth.OAuth(
  'https://twitter.com/oauth/request_token', 'https://twitter.com/oauth/access_token',
  _twitterConsumerKey, _twitterConsumerSecret, '1.0A', _twitterCallbackUrl, 'HMAC-SHA1')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(logger({ path: 'log/express.log' }))
app.use(cookieParser())
app.use(session({ secret: 'very secret', resave: true, saveUninitialized: true }))

app.use(function (req, res, next) {
  res.locals.session = req.session
  next()
})

app.get('/sessions/connect', function (req, res) {
  consumer.getOAuthRequestToken(function (error, oauthToken, oauthTokenSecret, results) {
    if (error) {
      res.send('Error getting OAuth request token : ' + inspect(error), 500)
    } else {
      req.session.origin = req.headers.referer || req.headers.origin
      req.session.oauthRequestToken = oauthToken
      req.session.oauthRequestTokenSecret = oauthTokenSecret
      req.session.client = req.query.client
      res.redirect('https://twitter.com/oauth/authorize?oauth_token=' + req.session.oauthRequestToken)
    }
  })
})

app.get('/sessions/callback', function (req, res) {
   consumer.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function (error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send('Error getting OAuth access token : ' + inspect(error) + '[' + oauthAccessToken + ']' + '[' + oauthAccessTokenSecret + ']' + '[' + inspect(results) + ']', 500)
    } else {
      req.session.oauthAccessToken = oauthAccessToken
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret
      if (req.session.client === 'react') {
        console.log('React detected', req.session.origin)
        return res.redirect(req.session.origin)
      }
      res.redirect('/home')
    }
  })
})

app.get('/home', function (req, res) {
  consumer.get('https://api.twitter.com/1.1/account/verify_credentials.json', req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
    if (error) {
      res.redirect('/sessions/connect')
    } else {
      const parsedData = JSON.parse(data)
      req.session.screenName = parsedData.screen_name
      res.send('You are signed in: ' + inspect(parsedData.screen_name))
    }
  })
})

app.get('/test', (req, res) => {
  const twitterClient = new Twitter({
    consumer_key: _twitterConsumerKey,
    consumer_secret: _twitterConsumerSecret,
    access_token_key: req.session.oauthAccessToken,
    access_token_secret: req.session.oauthAccessTokenSecret
  })

  let ids = []
  // 15 pages max
  let pageCount = 0
  const name = req.session.screenName
  const retrieveUsers = (parameters) => {
    twitterClient.get('followers/ids', parameters, function (error, data, response) {
      if (!error) {
        ids = ids.concat(data.ids)
        if (data.next_cursor !== 0 && pageCount < 15) {
          pageCount++
          retrieveUsers({
            screen_name: name,
            cursor: data.next_cursor
          })
        } else {
          const matchedIds = ids.filter(id => knownIds[id])
          res.send({ total: ids.length, matched: matchedIds.length })
        }
      } else {
        res.status(response.statusCode).send(error.message)
      }
    })
  }
  retrieveUsers({ screen_name: name })

  // consumer.get('https://api.twitter.com/1.1/followers/ids.json', req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, (error, data, response) => {
  //     if (error) {
  //         res.status(500);
  //         res.send(error);
  //     } else {
  //         const parsedData = JSON.parse(data);
  //         console.log('---------------------------------');
  //         console.log(JSON.stringify(parsedData, null, 4));
  //         console.log('---------------------------------')
  //         res.send('You are signed in: ' + inspect(parsedData.screen_name));
  //       }
  // });
})

app.get('*', function (req, res) {
  res.redirect('/home')
})

app.listen(PORT, function () {
  console.log('App running on port ' + PORT + '!')
})
