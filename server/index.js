require('dotenv').config()

const debug = require('debug')('kyf:server')

const path = require('path')
const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const cors = require('cors')

const oauth = require('./oauth')
const twitter = require('./twitter')
const matcher = require('./matcher')
const sessionStore = require('./sessionStore')
const { emptyLocationObject, populateLocationObject } = require('./location')

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
app.use(cookieParser())
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

app.get('/api', async (req, res) => {
  const { userData, oauthAccessToken, oauthAccessTokenSecret } = req.session
  if (!userData) {
    return res.status(403).send('You are not logged in with Twitter')
  }
  try {
    console.log(userData);
    const followerIds = await twitter.getFollowerIds(userData.screen_name, oauthAccessToken, oauthAccessTokenSecret)
    const matchedIds = await matcher(followerIds)
    res.send({ total: followerIds.length, matched: matchedIds.length })
  } catch (e) {
    res.status(e.statusCode || 500).send(e.message)
  }
})

app.get('/withlocation', async (req, res) => {
  const { userData, oauthAccessToken, oauthAccessTokenSecret } = req.session
  if (!userData) {
    return res.status(403).send('You are not logged in with Twitter')
  }
  try {
    let location =
      (userData.location === '') ?
        emptyLocationObject
        : await populateLocationObject (userData.location, { useGoogle : true} )

    if (location.specificity < 2)
      res.redirect(200, '/your_location_helps')
    if (location.specificity < 5)
      res.redirect(200, '/location_map')


    const followerIds = await twitter.getFollowerIds(userData.screen_name, oauthAccessToken, oauthAccessTokenSecret)
    const matchedIds = await matcher(followerIds)
    res.send({ total: followerIds.length, matched: matchedIds.length })
  } catch (e) {
    res.status(e.statusCode || 500).send(e.message)
  }
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
