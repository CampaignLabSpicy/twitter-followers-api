const csvParse = require('csv-parser');
const fs = require('fs');

const redis = require('redis'),
  client = redis.createClient();
// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

const { newRedisServer, redisPort, waitingForRedisServer, shutdownRedis } = require ('./newredisserver'),
  redisServer = newRedisServer();

const inputCsvFiles = ['data/PeoplesMomentum_followers.csv'];


client.on("error", err=> {
    console.log(`Error ${err}`);
});

const testConnectionSync = ()=> {
  client.set("string key", "string val", redis.print);
  client.hset("hash key", "hashtest 1", "some value", redis.print);
  client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
  client.hkeys("hash key", function (err, replies) {
      console.log(replies.length + " replies:");
      replies.forEach(function (reply, i) {
          console.log("    " + i + ": " + reply);
      });
      client.quit();
  });
};

const loadStaticData = inputCsvFiles=> {
  const comparatorSets = inputCsvFiles
    .map (file =>
      new Promise ((resolve, reject)=> {
        fs.createReadStream(file)
          .pipe(csvParse())
          .on('data', (data) => comparatorSets.push(data))
          .on('end', () => {
            console.log(comparatorSets);
            resolve (comparatorSets);
          });
      })
    );
  console.log(comparatorSets);
  console.log(`${comparatorSets.length} file(s) opened: ${comparatorSets.join(', ')}`);
  return comparatorSets
}

loadStaticData(inputCsvFiles)[0]
  .then (results=> {console.log(results);})
