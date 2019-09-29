require('dotenv').config()

const debug = require('debug')('kyf:redis-server')

const RedisServer = require('redis-server')
const fs = require('fs')
const redisBinaryPath = process.env.LOCAL_REDIS_BINARY

const server = new RedisServer({
  port: 6379,
  bin: redisBinaryPath
})

if (!fs.existsSync(redisBinaryPath)) {
  debug(`Redis not found in ${redisBinaryPath}. You need the Redis binary installed, eg by running sudo apt-get install redis-server.`)
  process.exit(1)
}

let isRunning = false
const start = async () => {
  try {
    await server.open()
    isRunning = true
    debug(`Ready for connection to the Redis server bound to ${server.config.port}.`)
  } catch (e) {
    debug('Error: ' + e.message)
    process.exit(1)
  }
}

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM'].forEach((eventType) => {
  process.on(eventType, async () => {
    if (isRunning) {
      isRunning = false
      debug('Shutting down')
      await server.close()
    }
  })
})

start()
