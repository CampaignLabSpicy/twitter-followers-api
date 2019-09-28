const csvParse = require('csv-parser');
const fs = require('fs');

const redis = require('redis'),
  client = redis.createClient();
// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

const { newRedisServer, redisPort, waitingForRedisServer, shutdownRedis } = require ('./newredisserver'),
  redisServer = newRedisServer();

const inputCsvFiles = ['data/PeoplesMomentum_followers.csv'];
const csvOptions = { headers : ['follower'] };                   // impose this header on headerless data
const csvParseOverride = set=> data=> set.push(data.follower);   // to parse data with header


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
  let count=0;
  const comparatorSets = inputCsvFiles
    .map (file =>
      new Promise ((resolve, reject)=> {
        let set=[];
        fs.createReadStream(file)
          .pipe(csvParse(csvOptions))
          .on('data', csvParseOverride(set) || (data=> set.push(data)))
          .on('end', () => {
            resolve (set);
          });
      })
    );
  console.log('>',comparatorSets);
  console.log(`${comparatorSets.length} file(s) opened: ${comparatorSets.join(', ')}`);
  return comparatorSets
}

loadStaticData(inputCsvFiles)[0]
  .then (results=> {})
