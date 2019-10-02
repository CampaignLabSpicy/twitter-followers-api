require('dotenv').config()

const debug = require('debug')('kyf:redis-server:load-data:mongodb')

const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const mongodb = require('../server/services/mongodb')

const dataDir = path.join(__dirname, '..', 'data')
const files = fs.readdirSync(dataDir).filter(file => file.indexOf('.csv') > -1)

debug('Loading data into MongoDB')

/**
 * Load data into MongoDB. Builds a collection 'followers':
 *
 *   {
 *     _id: String,            // Twitter user id. Overwrite default MongoDB _id to save space
 *     TODO: Reinstate the friends array when we have space
 *     friends: Array<String>  // The key accounts followed by this user.
 *   }
 *
 * We can find the crossover between the logged-in user's followers and our
 * saved followers using:
 *
 *   const matchedFollowers = await db.followers.find({ _id: { $in: userFollowerIds } }).toArray()
 *
 * See server/matcher/mongodb.js for concrete use.
 */

const loadData = async () => {
  const db = await mongodb.getDb()
  const accountsCollection = db.collection('accounts')

  // Reset collections
  try {
    await accountsCollection.drop()
  } catch (e) {
    debug('Warning: ' + e.message)
  }

  // Iterate over the CSV files in the data directory
  for (const file of files) {
    debug('Loading ' + file)
    // Get the Twitter name from the filename
    // TODO: Save the keyAccountName against the follower when we have space
    const twitterName = file.split('_followers')[0]
    // Get the follower ids from the CSV
    const fileContents = fs.readFileSync(path.join(dataDir, file), 'utf8')
    const ids = fileContents.split(/\r?\n/)
    // Process the IDs in chunks to avoid sending too much data at once
    const chunks = _.chunk(ids, 100000)
    let processed = 0
    for (const chunk of chunks) {
      await accountsCollection.insertOne({
        name: twitterName,
        followers: chunk
      })
      processed = processed + chunk.length
      debug('Loaded ' + Math.round(processed * 100 / ids.length) + '% (' + processed + '/' + ids.length + ')')
    }
    debug('Loaded ' + file)
  }

  await mongodb._client.close()
  debug('Done')
}

loadData()
