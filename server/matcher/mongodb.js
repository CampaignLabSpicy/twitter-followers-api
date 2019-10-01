const mongodb = require('../services/mongodb')

module.exports = async (ids) => {
  const db = await mongodb.getDb()
  const followers = db.collection('followers')
  // TODO: fix if ids.length is large (> 10,000)
  return followers.find({ id: { $in: ids } }, { id: 1 }).toArray()
}
