const debug = require('debug')('kyf:mongodb-client')

const MongoClient = require('mongodb').MongoClient

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

module.exports = {
  _client: client,
  getDb: async () => {
    try {
      await client.connect()
      return client.db()
    } catch (e) {
      debug('Error: ' + e.message)
    }
  }
}
