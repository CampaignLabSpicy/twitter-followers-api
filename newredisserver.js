const RedisServer = require('redis-server');
const fs = require('fs');
// home Ubuntu default apt install path
const redisBinaryPath = '/usr/local/bin/redis-server';
// more sensible install path
// const redisBinaryPath = '/opt/local/bin/redis-server';
let redisPort;
 
const server = new RedisServer({
  port: 6379,
  bin: redisBinaryPath
});
// console.log(server);

try {
  if (!fs.existsSync(redisBinaryPath)) {
    throw new Error (`Redis not found in ${redisBinaryPath}. You need the Redis binary installed, eg by running sudo apt-get install redis-server.`)
  }
} catch(err) {
  console.error(err)
}

server.open()
  .then(() => {
    // console.log(server);
    // console.log(`Ready for connection to the Redis server bound to ${server.config.port}.`);
    redisPort = server.config.port || 'unknown';
  })
  .catch((err) => {
    if (err.message === 'Invalid port number') {
      if (server.config.port>65535 || server.config.port<=0)
        console.log('Redis server should use a port between 1 & 65535. ')
      else
        console.log('Invalid port number error suggests that you have a redis server running already.\n Try stopping it with redis-cli shutdown\n\n');
    } else
    console.error(err)
  });

// NB For playing with - this will be rewritten
const newRedisServer = ()=> server ||  new RedisServer({ bin: redisBinaryPath });

const waitingForRedisServer = ()=> server.isOpening;

const shutdownRedis = ()=> server.close().then(() => {
  console.log('Redis server shut down in an orderly fashion');
});


module.exports = { newRedisServer, redisPort, waitingForRedisServer, shutdownRedis }
