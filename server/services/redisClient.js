const debug = require('debug')('kyf:redis-client')

const redis = require('redis')
const { promisify } = require('util')

/**
 * Keep Redis client configuration in one place: this file.
 *
 * Promisify all the Redis commands so that we can write async/await code and avoid callbacks.
 */

const client = redis.createClient({ url: process.env.REDIS_URL })
client.on('error', e => {
  debug('Error: ' + e.message)
})

/**
 * Add to this list if you need a new Redis command, then use it asynchronously
 *
 * async () => {
 *     const keys = await redisClient.keys('*')
 * }
 */
const commands = [
  'del',
  'sadd',
  'sinter',
  'smembers',
  'quit'
]

// Promisify each command and add to module.exports
for (const command of commands) {
  module.exports[command] = promisify(client[command]).bind(client)
}

// Export client in case it is required (but use should be avoided)
module.exports._client = client
