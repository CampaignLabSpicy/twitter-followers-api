const debug = require('debug')('kyf:session')

/**
 * Choose RedisStore or MemoryStore depending on whether Redis is configured.
 */

const session = require('express-session')
const redis = require('redis')
const connectRedis = require('connect-redis')

const getSessionStore = () => {
  if (!process.env.REDIS_SERVER_URL) {
    debug('Using MemoryStore')
    return new session.MemoryStore()
  }

  debug('Using RedisStore')
  const RedisStore = connectRedis(session)
  const client = redis.createClient()
  return new RedisStore({ client })
}

module.exports = getSessionStore()
