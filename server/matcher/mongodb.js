const _ = require('lodash')

const mongodb = require('../services/mongodb')

module.exports = async (ids) => {
  const db = await mongodb.getDb()
  const accountsCollection = db.collection('accounts')
  // TODO: fix if ids.length is large (> 10,000)
  const matchedAccounts = await accountsCollection
    .aggregate([
      { $match: { followers: { $in: ids } } },
      {
        $project: {
          name: '$name',
          followers: {
            $filter: {
              input: '$followers',
              as: 'follower',
              cond: {
                $in: ['$$follower', ids]
              }
            }
          }
        }
      }
    ])
    .toArray()
  const matchedFollowers = {}
  for (const account of matchedAccounts) {
    for (const follower of account.followers) {
      if (!matchedFollowers[follower]) {
        matchedFollowers[follower] = 0
      }
      matchedFollowers[follower]++
    }
  }
  return Object.keys(matchedFollowers)
}
