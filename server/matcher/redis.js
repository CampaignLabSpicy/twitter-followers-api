const debug = require('debug')('kyf:matcher:redis')

const redis = require('redis')
const { promisify } = require('util')

const client = redis.createClient({ url: process.env.REDIS_SERVER_URL })
const smembers = promisify(client.smembers).bind(client)
const sadd = promisify(client.sadd).bind(client)
const sinter = promisify(client.sinter).bind(client)
const del = promisify(client.del).bind(client)

module.exports = async (ids) => {
  const tempKey = `${Date.now()}:followers`
  debug('Temporarily saving user follower ids')
  await sadd(tempKey, ids)
  const accounts = await smembers('accounts')
  let allMatchingIds = {}
  for (const account of accounts) {
    debug('Matching against', account)
    const matched = await sinter(tempKey, `${account}:followers`)
    for (const id of matched) {
      if (!allMatchingIds[id]) {
        allMatchingIds[id] = 0
      }
      allMatchingIds[id]++
    }
  }
  await del(tempKey)
  debug('Found ' + Object.keys(allMatchingIds).length + ' matches')
  return Object.keys(allMatchingIds)
}
