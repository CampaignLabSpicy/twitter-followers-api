const csvParse = require('csv-parser')
const fs = require('fs')

const redis = require('redis')
const client = redis.createClient()

const { newRedisServer, redisPort, waitingForRedisServer, shutdownRedis } = require('./newredisserver')
const redisServer = newRedisServer()

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

const inputCsvFiles = ['./PeoplesMomentum_followers.csv']

client.on('error', err => {
  console.log(`Error ${err}`)
})

const testConnectionSync = () => {
  client.set('string key', 'string val', redis.print)
  client.hset('hash key', 'hashtest 1', 'some value', redis.print)
  client.hset(['hash key', 'hashtest 2', 'some other value'], redis.print)
  client.hkeys('hash key', function (err, replies) {
    console.log(replies.length + ' replies:')
    replies.forEach(function (reply, i) {
      console.log('    ' + i + ': ' + reply)
    })
    client.quit()
  })
}

const loadStaticData = (inputCsvFiles) => {
  const comparatorSets = inputCsvFiles
    .map(file => {
      dataset = new Promise((res, rej) => {
        fs.createReadStream('data.csv')
          .pipe(csvParse())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            res(results)
            console.log(results)
          })
      })
    })
}
