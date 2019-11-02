require('dotenv').config()

const debug = require('debug')('kyf:server')

const path = require('path')
const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const session = require('express-session')
const cors = require('cors')

const oauth = require('./oauth')
const twitter = require('./twitter')
const matcher = require('./matcher')
const sessionStore = require('./sessionStore')
const { LocationObject, populateLocationObject, constituencyFromPostcode } = require('./location')
const { promiseyLog } = require ('./location/helpers');

const app = express()
app.use(logger('tiny', { stream: { write: msg => debug(msg.trim()) } }))

const ACCESS_CONTROL_ALLOW_ORIGINS = (process.env.ACCESS_CONTROL_ALLOW_ORIGINS || '').split(',')
app.use(cors({
  origin: ACCESS_CONTROL_ALLOW_ORIGINS,
  credentials: true
}))

const PORT = process.env.PORT || 8080

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}))

app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/login', async (req, res) => {
  try {
    const { oauthRequestToken, oauthRequestTokenSecret, authorizeUrl } = await oauth.getRequestToken()
    debug('OAuth ' + oauthRequestToken + ': Redirecting to Twitter')

    req.session.origin = req.headers.referer || req.headers.origin || '/'
    req.session.oauthRequestToken = oauthRequestToken
    req.session.oauthRequestTokenSecret = oauthRequestTokenSecret
    res.redirect(authorizeUrl)
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.get('/sessions/callback', async (req, res) => {
  try {
    const { oauthRequestToken, oauthRequestTokenSecret } = req.session
    const { oauth_verifier: oauthVerifier } = req.query
    const { oauthAccessToken, oauthAccessTokenSecret } = await oauth.getAccessToken(
      oauthRequestToken,
      oauthRequestTokenSecret,
      oauthVerifier
    )
    req.session.oauthAccessToken = oauthAccessToken
    req.session.oauthAccessTokenSecret = oauthAccessTokenSecret
    debug('OAuth ' + oauthRequestToken + ': Authorized, fetching user data')

    req.session.userData = await oauth.verifyCredentials(oauthAccessToken, oauthAccessTokenSecret)
    debug('OAuth ' + oauthRequestToken + ': Complete, redirecting to ' + req.session.origin)

    res.redirect(req.session.origin)
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.get('/', async (req, res) => {
  const { userData } = req.session
  if (!userData) {
    return res.redirect('/login')
  }
  res.send(userData)
})

app.get('/test', (req, res) => {
  res.redirect('/api')
})


// In frontend, location may be a string/ empty string, or a LocationObject containing fields including
// twitterString : a string/ empty string
// (test for location known with: if (location || location.twitterString) ... )
// Better is to test for location specificity
// location.specficity = 0 => no location
// location.specficity = 10 => full postcode or lat/long
// But test, eg: if (!location || location < x) ... since string.prop = undefined and (undefined < x) == false
app.get('/api', async (req, res) => {
  const { userData, oauthAccessToken, oauthAccessTokenSecret } = req.session
  if (!userData) {
    return res.status(403).send('You are not logged in with Twitter')
  }
  try {
    const followerIds = await twitter.getFollowerIds(userData.screen_name, oauthAccessToken, oauthAccessTokenSecret)
    const matchedIds = await matcher(followerIds)
    let location = [
      req.query,                         // query: We assume any query passed will include one+ of pc, p7, pc8, latlong
      req.session.location,              // session: NB Any location object from session may be partial
      userData.location,                 // userData: is the twitterString, ie location as it appears on user's Twitter profile
      LocationObject()
    ];
console.log(location);
    req.session.location = await populateLocationObject (location, { useGoogle : true} ) ;
    res.send({ total: followerIds.length, matched: matchedIds.length, location })
  } catch (e) {
    console.log(e);
    res.status(e.statusCode || 500).send(e.message)
  }
})

// /withlocation is for express routing (ie, not React):

// NB For future cleverness with userData.geo_enabled: geo_enabled is deprecated and will always be null. Still available via GET account/settings. This field must be true for the current user to attach geographic data when using POST statuses / update
app.get('/withlocation', async (req, res) => {
  const { userData, oauthAccessToken, oauthAccessTokenSecret } = req.session
  if (!userData) {
    return res.status(403).send('You are not logged in with Twitter')
  }
  try {
    // Using old functionality here - change it!
    let location =
      req.session.location ||
        (userData.location === '') ?
          LocationObject()
          : await populateLocationObject (userData.location, { useGoogle : true} );

    if (location.specificity < 2)
      res.redirect(200, '/your_location_helps');
    if (location.specificity < 5)
      res.redirect(200, '/location_map');


    const followerIds = await twitter.getFollowerIds(userData.screen_name, oauthAccessToken, oauthAccessTokenSecret)
    const matchedIds = await matcher(followerIds)
    res.send({ total: followerIds.length, matched: matchedIds.length })
  } catch (e) {
    res.status(e.statusCode || 500).send(e.message)
  }
})

app.get('/location_lookup', async (req, res) => {
  const data = constituencyFromPostcode(req.query.pc7)
    // .then(promiseyLog('before second process:'))
    .then (data => {
      if (data.error)
        return { error : data.error }
      return data
    })
    // .then(promiseyLog('response:'))
    .then (result => {
    res.status(200).send(result)
  });
})

app.get('/your_location_helps', async (req, res) => {
  res.status(500).send('Not implemented')
})

app.get('/location_map', async (req, res) => {
  res.status(500).send('Not implemented')
})

app.get('*', function (req, res) {
  res.redirect('/')
})

app.listen(PORT, function () {
  debug('App running on port ' + PORT + '!')
})
