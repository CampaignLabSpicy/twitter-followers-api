require('dotenv').config()

const debug = require('debug')('kyf:redis-server:load-data')

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const redis = require('redis')
const _ = require('lodash')

const client = redis.createClient({ url: process.env.REDIS_URL })
// sadd: add items to a set
const sadd = promisify(client.sadd).bind(client)
const quit = promisify(client.quit).bind(client)

const dataDir = path.join(__dirname, '..', 'data')
const files = fs.readdirSync(dataDir).filter(file => file.indexOf('.') > 0) // Use > 0 to ignore hidden files (start with .)

debug('Loading data into Redis')

const loadData = async () => {
  // Iterate over the CSV files in the data directory
  for (const file of files) {
    debug('Loading ' + file)
    // Get the Twitter name from the filename
    const twitterName = file.split('_followers')[0]
    // Get the follower ids from the CSV
    const fileContents = fs.readFileSync(path.join(dataDir, file), 'utf8')
    const ids = fileContents.split(/\r?\n/)
    // Process the IDs in chunks to avoid sending too much data at once
    const chunks = _.chunk(ids, 1000000)
    for (const chunk of chunks) {
      // Add follower ids to a set e.g. 'jeremycorbyn:followers'
      await sadd(`${twitterName}:followers`, chunk)
      debug('Loaded ' + chunk.length)
    }
    // save the processed account to the 'accounts' set
    await sadd('accounts', twitterName)
    debug('Loaded ' + file)
  }

  await quit()
  debug('Done')
}

loadData()
