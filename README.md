### frontend

Set up a Twiiter account and login. You may need to verify by SMS later, but you can remove the phone number from the account later.
Make sure `TWITTER_CONSUMER_KEY` and `TWITTER_CONSUMER_SECRET` are set.
They'll show up when the server runs.

make sure the IP in `const consumer = new oauth.OAuth( ... ` in `server.js` points to your IP (eg localhost)

`cd twitter-followers`
`npm i`
`npm run start`
 
Browse to `http://localhost:8080/home` and authorise the app.
`http://localhost:8080/test` should give you yor followers!

### matching server

`sudo apt install git-lfs`
`git lfs install`
`git clone ... `
