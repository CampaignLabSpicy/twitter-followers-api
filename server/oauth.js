const debug = require('debug')('kyf:oauth')

const { OAuth } = require('oauth')

const consumer = new OAuth(
  'https://twitter.com/oauth/request_token',
  'https://twitter.com/oauth/access_token',
  process.env.TWITTER_CONSUMER_KEY,
  process.env.TWITTER_CONSUMER_SECRET,
  '1.0A',
  process.env.TWITTER_CALLBACK_URL,
  'HMAC-SHA1'
)

const oauth = {

  _handleError: (error, callback) => {
    const message = error.message || error.data
    debug('Error: ' + message)
    callback(new Error(message))
  },

  getRequestToken: () => new Promise((resolve, reject) => {
    consumer.getOAuthRequestToken((error, oauthRequestToken, oauthRequestTokenSecret) => {
      if (error) {
        return oauth._handleError(error, reject)
      }
      resolve({
        oauthRequestToken,
        oauthRequestTokenSecret,
        authorizeUrl: `https://twitter.com/oauth/authorize?oauth_token=${oauthRequestToken}`
      })
    })
  }),

  getAccessToken: (oauthRequestToken, oauthRequestTokenSecret, oauthVerifier) => new Promise((resolve, reject) => {
    consumer.getOAuthAccessToken(
      oauthRequestToken,
      oauthRequestTokenSecret,
      oauthVerifier,
      (error, oauthAccessToken, oauthAccessTokenSecret) => {
        if (error) {
          return oauth._handleError(error, reject)
        }
        resolve({ oauthAccessToken, oauthAccessTokenSecret })
      })
  }),

  verifyCredentials: (oauthAccessToken, oauthAccessTokenSecret) => new Promise((resolve, reject) => {
    consumer.get(
      'https://api.twitter.com/1.1/account/verify_credentials.json',
      oauthAccessToken,
      oauthAccessTokenSecret,
      (error, data) => {
        if (error) {
          return oauth._handleError(error, reject)
        }
        resolve(JSON.parse(data))
      })
  })

}

module.exports = oauth
