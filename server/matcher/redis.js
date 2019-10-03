const debug = require('debug')('kyf:matcher:redis')

const redisClient = require('../services/redisClient')

module.exports = async (ids) => {
  // Save the user's follower ids to Redis so we can do set intersections with them
  const tempKey = `${Date.now()}:followers`
  debug('Temporarily saving user follower ids')
  await redisClient.sadd(tempKey, ids)

  // Load the accounts we have saved follower ids for
  const accounts = await redisClient.smembers('accounts')

  // Build an object mapping follower id to number of times it is found in the follower lists
  const followerIdMatchCount = {}
  for (const account of accounts) {
    debug('Matching against', account)

    // Find all matches between the user's follower ids and the followers of a given account
    const matched = await redisClient.sinter(tempKey, `${account}:followers`)
    for (const id of matched) {
      if (!followerIdMatchCount[id]) {
        followerIdMatchCount[id] = 0
      }
      followerIdMatchCount[id]++
    }
  }

  // Delete the user's follower ids from the database
  await redisClient.del(tempKey)
  debug('Found ' + Object.keys(followerIdMatchCount).length + ' matches')

  // Return an array of matched follower ids
  return Object.keys(followerIdMatchCount)
}
