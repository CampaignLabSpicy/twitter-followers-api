require('dotenv').config()

const debug = require('debug')('kyf:redis-server:load-data')

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const redis = require('redis')
const _ = require('lodash')

const client = redis.createClient({ url: process.env.REDIS_SERVER_URL })
const sadd = promisify(client.sadd).bind(client)
const quit = promisify(client.quit).bind(client)

const dataDir = path.join(__dirname, '..', 'data')
const files = fs.readdirSync(dataDir).filter(file => file.indexOf('.') > -1)

debug('Loading data into Redis')

const loadData = async () => {
  for (const file of files) {
    debug('Loading ' + file)
    const twitterName = file.split('_followers')[0]
    const fileContents = fs.readFileSync(path.join(dataDir, file), 'utf8')
    const ids = fileContents.split(/\r?\n/)
    const chunks = _.chunk(ids, 1000000)
    for (const chunk of chunks) {
      await sadd(`${twitterName}:followers`, chunk)
      debug('Loaded ' + chunk.length)
    }
    // save all accounts that have been loaded
    await sadd('accounts', twitterName)
    debug('Loaded ' + file)
  }

  await quit()
  debug('Done')
}

loadData()
