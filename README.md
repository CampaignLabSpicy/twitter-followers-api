### Server

1. Set up a Twitter account and app, or get access to an existing app.
2. `cp .env.example .env`, replacing `TWITTER_CONSUMER_KEY` and `TWITTER_CONSUMER_SECRET` with your Twitter app secrets.
3. `npm i`
4. `npm run dev`
 
Browse to `http://localhost:8080/` and authorise the app.

`http://localhost:8080/api` should give you yor followers!

### Redis (Optional)

Enable Redis by setting the `REDIS_SERVER_URL` environment variable, typically in `.env`.

#### Remote Server

Get the credentials from Heroku. Make sure to amend the remote `REDIS_SERVER_URL` to use the development database, which
is number `0` &mdash; **i.e. DELETE the `/1` from the end of the url**.

#### Local Server (Optional)

You will need the Redis server software installed on your machine.

You can run a Redis server manually, or you can use `node bin/startRedisServer` to manage Redis start-up and shut down.
You will need the `LOCAL_REDIS_BINARY` environment variable set to point to your
local `redis-server` executable file.

#### Loading Data into Redis

Run `node bin/loadDataIntoRedis.js`.
