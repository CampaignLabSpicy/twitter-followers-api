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
const { promiseyLog } = require('./location/helpers')

const app = express()
app.use(logger('tiny', { stream: { write: msg => debug(msg.trim()) } }))

const ACCESS_CONTROL_ALLOW_ORIGINS = (process.env.ACCESS_CONTROL_ALLOW_ORIGINS || '').split(',')
app.use(cors({
  origin: ACCESS_CONTROL_ALLOW_ORIGINS,
  credentials: true
}))

const PORT = process.env.PORT || 8080
const usingReact = true

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
    console.log(e)
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
    console.log(e)
    res.status(500).send(e.message)
  }
})

app.get('/', async (req, res) => {
  debug('Request was to /')
  debug('req.session:', req.session)
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
  debug('req.session:', req.session)
  if (!userData) {
    debug('No userData in session - sending 403')
    return res.status(403).send('You are not logged in with Twitter')
  }
  try {
    const followerIds = await twitter.getFollowerIds(userData.screen_name, oauthAccessToken, oauthAccessTokenSecret)
    const matchedIds = await matcher(followerIds)
    debug('query:', req.query)
    const location = [
      req.query, // query: We assume any query passed will include one+ of pc, p7, pc8, latlong
      req.session.location, // session: NB Any location object from session may be partial
      userData.location, // userData: is the twitterString, ie location as it appears on user's Twitter profile
      LocationObject()
    ]
    // debug(location);
    req.session.location = await populateLocationObject(location, locationOptions = { useGoogle: true })
    res.send({ total: followerIds.length, matched: matchedIds.length, location: req.session.location })
  } catch (e) {
    console.log(e)
    res.status(e.statusCode || 500).send(e.message)
  }
})

// NB For future cleverness with userData.geo_enabled: geo_enabled is deprecated and will always be null. Still available via GET account/settings. This field must be true for the current user to attach geographic data when using POST statuses / update
app.get('/locationtest', async (req, res) => {
  const { userData, oauthAccessToken, oauthAccessTokenSecret } = req.session
  let followerIds = []; let matchedIds = []
  debug('Got route /locationtest')
  debug(req.query)
  const location = [
    req.query, // query: We assume any query passed will include one+ of pc, p7, pc8, latlong
    req.session.location
  ]
  if (userData) {
    followerIds = await twitter.getFollowerIds(userData.screen_name, oauthAccessToken, oauthAccessTokenSecret)
    matchedIds = await matcher(followerIds)
    location.push(userData.location)
  }
  location.push(LocationObject())

  try {
    req.session.location = await populateLocationObject(location, { useGoogle: true })
  } catch (e) {
    console.log(e)
    res.status(e.statusCode || 500).send(e.message)
  }

  // set usingReact to false for express routing (ie, not React):
  if (usingReact) {
    // normal usage - pass
    res.send({ total: followerIds.length, matched: matchedIds.length, location: req.session.location })
  } else {
    if (req.session.location.specificity < 2) { res.redirect(200, '/your_location_helps') }
    if (req.session.location.specificity < 5) { res.redirect(200, '/location_map') }
  }
})

app.get('/location_lookup', async (req, res) => {
  const data = constituencyFromPostcode(req.query.pc7)
    // .then(promiseyLog('before second process:'))
    .then(data => {
      if (data.error) { return { error: data.error } }
      return data
    })
    // .then(promiseyLog('response:'))
    .then(result => {
      res.status(200).send(result)
    })
})

app.get('/your_location_helps', async (req, res) => {
  res.status(500).send('Not implemented')
})

app.get('/location_map', async (req, res) => {
  res.status(500).send('Not implemented')
})

app.get('*', function (req, res) {
  debug(`${req.url} redirecting to /`)
  res.redirect('/')
})

app.listen(PORT, function () {
  debug('API server listening on port ' + PORT + '!')
})
