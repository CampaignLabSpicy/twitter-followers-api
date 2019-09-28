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

var express = require('express');
var bodyParser = require('body-parser');
var logger = require('express-logger');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var inspect = require('util-inspect');
var oauth = require('oauth');
var cors = require('cors');
var Twitter = require('twitter');

var app = express();
// Check cors permissions before production
app.use(cors());

// Get your credentials here: https://dev.twitter.com/apps
var _twitterConsumerKey = "CNvpVoxhSW16Q9YQiYrq0vQmv";
var _twitterConsumerSecret = "LMuXdnUbcIG6hPd6OuDIL7xTfDyq7oGwTsPS2fKnPicVzyN9AR";

var consumer = new oauth.OAuth(
    "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token", 
    _twitterConsumerKey, _twitterConsumerSecret, "1.0A", "http://192.168.1.213:8080/sessions/callback", "HMAC-SHA1");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger({ path: "log/express.log"}));
app.use(cookieParser());
app.use(session({ secret: "very secret", resave: true, saveUninitialized: true}));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

app.get('/sessions/connect', function(req, res){
  consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.send("Error getting OAuth request token : " + inspect(error), 500);
    } else {  
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      req.session.client = req.query.client;

      console.log("Double check on 2nd step");
      console.log("------------------------");
      console.log("<<"+req.session.oauthRequestToken);
      console.log("<<"+req.session.oauthRequestTokenSecret);
      res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);      
    }
  });
});

app.get('/sessions/callback', function(req, res){
  console.log("------------------------");
  console.log(JSON.stringify(req.session, null, 4));
  console.log(">>"+req.session.oauthRequestToken);
  console.log(">>"+req.session.oauthRequestTokenSecret);
  console.log(">>"+req.query.oauth_verifier);
  consumer.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send("Error getting OAuth access token : " + inspect(error) + "[" + oauthAccessToken + "]" + "[" + oauthAccessTokenSecret + "]" + "[" + inspect(results) + "]", 500);
    } else {
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
      if (req.session.client === 'react') {
          console.log('React detected');
          return res.redirect('http://localhost:3000');
      }
      res.redirect('/home');
    }
  });
});

app.get('/home', function(req, res){
    consumer.get("https://api.twitter.com/1.1/account/verify_credentials.json", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
      if (error) {
        //console.log(error)
        res.redirect('/sessions/connect');
      } else {
        var parsedData = JSON.parse(data);
        console.log('---------------------------------');
        console.log(JSON.stringify(parsedData, null, 4));
        console.log('---------------------------------')
        req.session.screenName = parsedData.screen_name;
        res.send('You are signed in: ' + inspect(parsedData.screen_name));
      } 
    });
});

app.get('/test', (req, res) => {

    var twitterClient = new Twitter({
        consumer_key: _twitterConsumerKey,
        consumer_secret: _twitterConsumerSecret,
        access_token_key: req.session.oauthAccessToken,
        access_token_secret: req.session.oauthAccessTokenSecret
    });

    let ids = [];
    // 15 pages max
    let pageCount = 0;
    // let name = req.session.screenName;
    let name = 'node-js'
    let retrieveUsers = (parameters) => {
        twitterClient.get('followers/ids', parameters, function(error, data, response) {
            if (!error) {
                ids.push(data.ids);
                if (data['next_cursor'] != 0 && pageCount < 15) {
                    pageCount++;
                    retrieveUsers({
                        screen_name: name,
                        cursor: data['next_cursor']
                    });
                } else {
                    res.send(ids);
                }
            }
        });
    }
    retrieveUsers({screen_name: name});
    

    // consumer.get('https://api.twitter.com/1.1/followers/ids.json', req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, (error, data, response) => {
    //     if (error) {
    //         res.status(500);
    //         res.send(error);
    //     } else {
    //         var parsedData = JSON.parse(data);
    //         console.log('---------------------------------');
    //         console.log(JSON.stringify(parsedData, null, 4));
    //         console.log('---------------------------------')
    //         res.send('You are signed in: ' + inspect(parsedData.screen_name));
    //       } 
    // });
});

app.get('*', function(req, res){
    res.redirect('/home');
});

app.listen(8080, function() {
  console.log('App runining on port 8080!');
});