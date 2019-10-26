### location modules

# This is not the latest version!
## Due to merge weirdness (never let a randomer set up the repo!)
## until remerge, current version is in /twitter-followers-from-26.10-bkp or equivalent repo

 The plan is to compare a users's location, as entered via Location API, on a form, or from Twitter location, with a list of marginals they can help with outreach in, to point them towards the most useful nearby sessions.

 Currently, each postcode is done via a postcodes.io lookup.
 Which data are retrieved and stored from postcodes.io can be changed in `requests.js`.
 Either of `postcodesio-client` or `node-postcodes.io` wrapper libraries can be used but `node-postcodes.io` and fucntionality will styart diverging soon. Currently the difference between libraries is transparent to `location/index.js` from `requests.js`.

 Next I will build in pluggability mto actually compare the locations we have to a list of target seats.

 The intention is next to build in a static postcode file as in the GSS-code converter.
 Then To use Google's API to match input better than just requiring lat/long or full postcode.
 Then to nudge users to provide a location if they didn't.
 Then to ask users to click a map for a more detailed location if the location we have is not specific.
 Eventually the plan is to match multiple results, such as partial or fuzzy locations, against multiple locations (ie reachable canvassing sessions) within constituencies.
