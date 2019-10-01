const debug = require('debug')('kyf:session')

/**
 * Choose RedisStore or MemoryStore depending on whether Redis is configured.
 */

const session = require('express-session')
const connectRedis = require('connect-redis')

const getSessionStore = () => {
  const sessionStorage = process.env.SESSION_STORAGE || 'memory'

  debug('Session storage: ' + sessionStorage)

  switch (sessionStorage) {
    case 'redis':
      debug('Using RedisStore')
      return getRedisStore()
    case 'memory':
    default:
      debug('Using MemoryStore')
      return new session.MemoryStore()
  }
}

const getRedisStore = () => {
  const RedisStore = connectRedis(session)
  const client = require('./services/redisClient')._client
  return new RedisStore({ client })
}

module.exports = getSessionStore()
