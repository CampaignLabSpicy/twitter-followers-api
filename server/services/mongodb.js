const debug = require('debug')('kyf:mongodb-client')

const MongoClient = require('mongodb').MongoClient

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const mongodb = {
  _client: client,
  getDb: async () => {
    try {
      if (!client.isConnected()) {
        await client.connect()
      }
      return client.db()
    } catch (e) {
      console.log('Mongo error', e)
      debug('Error: ' + e.message)
    }
  }
}

module.exports = mongodb
