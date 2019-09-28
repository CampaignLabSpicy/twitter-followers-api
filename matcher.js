const csvParse = require('csv-parser');
const fs = require('fs');

const redis = require('redis'),
  redisClient = redis.createClient();
// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

const { newRedisServer, redisPort, waitingForRedisServer, shutdownRedis } = require ('./newredisserver'),
  redisServer = newRedisServer();

const inputCsvFiles = ['data/PeoplesMomentum_followers.csv', 'data/johnmcdonnellMP_followers.csv'];
const csvOptions = { headers : ['follower'] };                   // impose this header on headerless data
const withHeaderOverride = set=> data=> set.push(data.follower);   // to parse data with header
const withHeaderOverrideRedis = key=> data=> redisClient.sadd(key, data.follower);   // to parse data with header

const knownIds = require('./knownIds');

redisClient.on("error", err=> {
    console.log(`Error ${err}`);
});

const testConnectionSync = ()=> {
  redisClient.set("string key", "string val", redis.print);
  redisClient.hset("hash key", "hashtest 1", "some value", redis.print);
  redisClient.hset(["hash key", "hashtest 2", "some other value"], redis.print);
  redisClient.hkeys("hash key", function (err, replies) {
      console.log(replies.length + " replies:");
      replies.forEach(function (reply, i) {
          console.log("    " + i + ": " + reply);
      });
      redisClient.quit();
  });
};

const loadStaticData = inputCsvFiles=> {
  const comparatorSets = inputCsvFiles.map (file =>
    new Promise ((resolve, reject)=> {
      let set=[];
      fs.createReadStream(file)
        .pipe(csvParse(csvOptions))
        // .on('data', csvParseOverride(set) || (data=> set.push(data)))
        .on('data', withHeaderOverrideRedis(file) || (data=> redisClient.sadd(file, data)))  // use filename as key
        .on('end', () => {
          resolve (set);
        });
    })
  );
  // console.log('>',comparatorSets);
  // console.log(`${comparatorSets.length} file(s) opened: ${comparatorSets.join(', ')}`);
  // return comparatorSets
  return inputCsvFiles.map (file => redisClient.smembers(file) );
}

Promise.all(loadStaticData(inputCsvFiles))
  .then (results=>
    results.forEach (result=> {
      console.log(result);
      console.log(`loaded ${result.length}`);
    }))
  // .then (()=> shutdownRedis());

const matcher = id => knownIds[id] ;

// const matcher = id => {
//   let result;
//   const file = inputCsvFiles[0];
//
//   redisClient.sadd("id", id);
//   await redisClient.sinter(file, "id")
//     .then (match => {
//       result = match;
//     })
//     .catch (err => {console.log(err);})
//   return result;
// }

module.exports = { matcher }
