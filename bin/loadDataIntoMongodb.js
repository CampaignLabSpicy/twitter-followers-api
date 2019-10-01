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
 *     id: String,      // Twitter user id
 *     friends: Array   // The key accounts followed by this user
 *   }
 *
 * E.G.:
 *
 *   {
 *     id: '45349857',
 *     friends: ['jeremycorbyn', 'UKLabour']
 *   }
 *
 * We can then find the crossover between the logged-in user's followers and our
 * saved followers using:
 *
 *   db.followers.find({ id: { $in: userFollowerIds } }
 *
 * See server/matcher/mongodb.js for concrete use.
 */

const loadData = async () => {
  const db = await mongodb.getDb()
  const followers = db.collection('followers')
  // Reset collection
  await followers.drop()
  // Index is *essential*, otherwise operations take far too long
  await followers.createIndex({ id: 1 }, { unique: true })
  // Iterate over the CSV files in the data directory
  for (const file of files) {
    debug('Loading ' + file)
    // Get the Twitter name from the filename
    const twitterName = file.split('_followers')[0]
    // Get the follower ids from the CSV
    const fileContents = fs.readFileSync(path.join(dataDir, file), 'utf8')
    const ids = fileContents.split(/\r?\n/)
    // Process the IDs in chunks to avoid sending too much data at once
    const chunks = _.chunk(ids, 10000)
    let processed = 0
    for (const chunk of chunks) {
      // Create a bulk operation to load the data more efficiently
      const bulk = followers.initializeUnorderedBulkOp()
      for (const id of chunk) {
        /**
         * Create an 'upsert' operation for a document with the given id.
         *
         * If a matching document is found in the database, it is updated by adding the
         * current twitterName to its friends array. If the document is not found,
         * it is inserted with the friends array containing just the current twitterName.
         *
         */
        bulk
          .find({ id })
          .upsert()
          .updateOne(
            { $push: { friends: twitterName } }
          )
      }
      await bulk.execute()
      processed = processed + chunk.length
      debug('Loaded ' + Math.round(processed * 100 / ids.length) + '% (' + processed + '/' + ids.length + ')')
    }
    debug('Loaded ' + file)
  }

  await mongodb._client.close()
  debug('Done')
}

loadData()
