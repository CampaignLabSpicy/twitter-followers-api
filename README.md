### Server

1. Set up a Twitter account and app, or get access to an existing app.
2. `cp .env.example .env`, replacing `TWITTER_CONSUMER_KEY` and `TWITTER_CONSUMER_SECRET` with your Twitter app secrets.
3. `npm i`
4. `node bin/downloadData`
5. `npm run dev` or `npm start`
 
Browse to `http://localhost:8080/` and authorise the app.
You may need to browse to this port, even if you are accessing in development on a proxied port, eg if `localhost:3000/login` doesn't do the job.

`http://localhost:8080/api` should give you yor followers!

### `server/location/`

`/api` now responds with a location object as part of its JSON reponse, which minimally includes at least one form of location (likely, twitter location (`twitterString` or postcode (`pc`/ `pc7`/ `pc8`/ `pcd`) & `latLong`), and a specificity of that location, which will only be reported if meaningful (ie blank/ incomprehensible locations are not counted in specificity)

##### location.specificity
* 0 - no location
* 1 - region / country
* 3 - Local Authority
* 5 - pcd (postcode district, eg `WC2A` or `NN6`)
* 6 - parliamentary_constituency
* 10 - pc7/ pc8 (eg `WC2A1AA` / `WC2A 1AA`) or latLong

##### passing location data
Calls to the `/api` route establish a `location` object as a property of express-session's `session` passed back and forth on request/ response on the domain.
The primary means of passing a detailed location to the server is via query params `pc` (postcode) or `latlong`. Acceptance is liberal, but 7-digit, no-space postcodes and leaflet.js latLng (`{lat,lng}`) are standard. Where lat, lng are not explicit, order is lng, lat.

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

Enable MongoDB for data storage by setting `DATA_STORAGE=mongodb` and `MONGODB_URI` in your environment.

#### Load data into MongoDB

`node bin/loadDataIntoMongodb.js`

#### Heroku login details:
The website is hosted on Heroku
The Heroku account is: 
info.campaignlab@gmail.com
The password is in a private message on a Slack:
If required ask: Hannah, Tom, Jude or Joaquim
The website is connected to the github repositories listed above - any changes pushed to the master branch will change the website immediately.

#### Godaddy
The domain name server is Godaddy
The email is info.campaignlab@gmail.com
The password is the same as the heroku login

#### Cloudflare - SSL
The SSL is managed by cloudflare but currently the account used is is Joaquim’s personal account. 

#### Notes from Joaquim on the SSL setup:
SSL is provided using CloudFlare, as it is free, and there is a cost to use SSL directly on Heroku
Client ---> https ---> CloudFlare ---> http ---> Heroku
here are the settings on my CloudFlare account. you would need to create a CloudFlare account and duplicate these:
KnowYourFollowers CloudFlare DNS
CNAME api intense-mockingbird-13qu8x7n5dwfkh68wa5bqga7.herokudns.com
CNAME knowyourfollowers.org crystalline-fig-n8qc2mdzs7xrfgh36i2at1pp.herokudns.com
CNAME www cardiovascular-galangal-kuexahovvmch7dod8liw2c5u.herokudns.com

You will also need these Page Rules:

To switch the domain to your CloudFlare, you'll need to update the nameservers in GoDaddy. These are currently:
KAMI.NS.CLOUDFLARE.COM
MILES.NS.CLOUDFLARE.COM
they will need to be updated to match the ones provided by your CloudFlare account
 
when you're about to create your CloudFlare account, I'll need to delete the site from mine, so let me know when to do that

