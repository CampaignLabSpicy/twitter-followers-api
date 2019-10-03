require('dotenv').config()

const debug = require('debug')('kyf:redis-server:load-data:redis')

const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const redisClient = require('../server/services/redisClient')

const dataDir = path.join(__dirname, '..', 'data')
const files = fs.readdirSync(dataDir).filter(file => file.indexOf('.csv') > -1)

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
      await redisClient.sadd(`${twitterName}:followers`, chunk)
      debug('Loaded ' + chunk.length)
    }
    // save the processed account to the 'accounts' set
    await redisClient.sadd('accounts', twitterName)
    debug('Loaded ' + file)
  }

  await redisClient.quit()
  debug('Done')
}

loadData()
