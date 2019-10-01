### Server

1. Set up a Twitter account and app, or get access to an existing app.
2. `cp .env.example .env`, replacing `TWITTER_CONSUMER_KEY` and `TWITTER_CONSUMER_SECRET` with your Twitter app secrets.
3. `npm i`
4. `node bin/downloadData`
5. `npm run dev` or `npm start`
 
Browse to `http://localhost:8080/` and authorise the app.

`http://localhost:8080/api` should give you yor followers!

### Data

The server can work with data stored in memory, in Redis, or in MongoDB.
Refer to the *Redis* or *MongoDB* sections for further information.

### Redis (Optional)

Enable Redis for sessions by setting `SESSION_STORAGE=redis` and `REDIS_URL` in your environment.
Enable Redis for data storage by setting `DATA_STORAGE=redis`.

#### Remote Redis Server

Get the credentials from Heroku. Make sure to amend the remote `REDIS_URL` to use the development database, which
is number `0` &mdash; **i.e. DELETE the `/1` from the end of the url**.

#### Local Redis Server (Optional)

You will need the Redis server software installed on your machine.

You can run a Redis server manually, or you can use `node bin/startRedisServer` to manage Redis start-up and shut down.
You will need the `LOCAL_REDIS_BINARY` environment variable set to point to your
local `redis-server` executable file.

#### Load data into Redis

`node bin/loadDataIntoRedis.js`

### MongoDB (Optional)

Enable MongoDB for data storage by setting `DATA_STORAGE=mongodb` and `MONGODB_URL` in your environment.

#### Load data into MongoDB

`node bin/loadDataIntoMongodb.js`
