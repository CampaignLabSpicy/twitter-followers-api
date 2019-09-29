const debug = require('debug')('kyf:matcher:redis')

const redis = require('redis')
const { promisify } = require('util')

const client = redis.createClient({ url: process.env.REDIS_URL })

// Promisify Redis functions so we don't need to use callbacks

// Get the items in a set
const smembers = promisify(client.smembers).bind(client)
// Add items to a set
const sadd = promisify(client.sadd).bind(client)
// Get the intersection between two sets
const sinter = promisify(client.sinter).bind(client)
// Delete a key (used for removing sets from the database)
const del = promisify(client.del).bind(client)

module.exports = async (ids) => {
  // Save the user's follower ids to Redis so we can do set intersections with them
  const tempKey = `${Date.now()}:followers`
  debug('Temporarily saving user follower ids')
  await sadd(tempKey, ids)

  // Load the accounts we have saved follower ids for
  const accounts = await smembers('accounts')

  // Build an object mapping follower id to number of times it is found in the follower lists
  const followerIdMatchCount = {}
  for (const account of accounts) {
    debug('Matching against', account)

    // Find all matches between the user's follower ids and the followers of a given account
    const matched = await sinter(tempKey, `${account}:followers`)
    for (const id of matched) {
      if (!followerIdMatchCount[id]) {
        followerIdMatchCount[id] = 0
      }
      followerIdMatchCount[id]++
    }
  }

  // Delete the user's follower ids from the database
  await del(tempKey)
  debug('Found ' + Object.keys(followerIdMatchCount).length + ' matches')

  // Return an array of matched follower ids
  return Object.keys(followerIdMatchCount)
}
