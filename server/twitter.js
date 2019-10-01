const debug = require('debug')('kyf:twitter')

const Twit = require('twit')

module.exports = {

  getFollowerIds: async (screenName, accessToken, accessTokenSecret) => {
    debug('Fetching followers for ' + screenName)

    const twitterClient = new Twit({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token: accessToken,
      access_token_secret: accessTokenSecret
    })

    let ids = []
    // 15 pages max
    let pageCount = 0
    const parameters = { screen_name: screenName, stringify_ids: true }
    while (pageCount < 14) {
      const { data } = await twitterClient.get('followers/ids', parameters)
      ids = ids.concat(data.ids)
      if (!data.next_cursor) {
        break
      }
      parameters.cursor = data.next_cursor
      pageCount++
    }
    return ids
  }

}
