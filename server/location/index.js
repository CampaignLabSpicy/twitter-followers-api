const debug = require('debug')('kyf:location')

// const { constituencyFromPostcode, locationInfoFromPostcode } = require ('./externals');
const {
  isPc7, isPc8, isPostcodeDistrict, isFullPostcode, isPostcode, endsWithPostcode,
  pc7FromFullPostcode, pc8FromFullPostcode, districtFromFullPostcode, districtFromPostcodeDistrict, postcodeFromString,
  toStandardLatLong, toLatLong, isLeafletLatLng, latLongFromString, latLongFrom4dpLatLongString, roundToNearest, withAt
} = require('./helpers')
const { officialLabourHandlesFromConstituency } = require('./locationmatchers')
const {
  fromPostcodesIo, fromGoogle, fromTwitter,
  constituencyFromPostcode, locationInfoFromPostcode
} = require('./requests')

const LocationObject = () => ({
  specificity: 0,
  twitterString: '',
  defaultTwitterFollow: '@uklabour'
})
const noVerify = { verify: false }

const cache = {
  records: 0,

  canonicalise: location => {
    const latLong = toStandardLatLong(location)
    if (latLong) { return (`${latLong.lng},${latLong.lat}`) } // see note in helpers.js
    if (isPostcode(location)) { return pc8FromFullPostcode(location) || districtFromPostcodeDistrict(location) }
    if (endsWithPostcode(location)) { return postcodeFromString(location) }
    // and then the harder cases, eg London, Hackney, The World
    return location
  },

  compress: x => x,

  uncompress: x => x,

  put: (location, result, options = { verify: true }) => {
    if (options.verify) { location = cache.canonicalise(location) }
    if (!cache[location]) {
      cache[location] = cache.compress(result)
      cache.records++
    }
    // debug(cache);
  },

  get: (location, options = { verify: true }) => {
    if (options.verify) { location = cache.canonicalise(location) }
    return cache.uncompress(cache.location)
  }

}

// Mutates resultObject by concatenating handles from listOfCLPsandPPCs.json
const addOfficialLabourHandles = (resultObject, locationInfo) => {
  if (locationInfo && locationInfo.parliamentary_constituency) {
    if (!resultObject.twitterHandles) { resultObject.twitterHandles = [] }
    const handles = officialLabourHandlesFromConstituency(locationInfo.parliamentary_constituency) || []
    handles.forEach(handle =>
      resultObject.twitterHandles.push(withAt(handle))
    )
  }
}

// locations is one of:
// . query object, eg {pc='AB1 9XY', latlong=<leafletJS latlong>}
// . pcd, pc7, pc8, latLong, leafletJS latlong
// . a prioirty ordered array of the above
const populateLocationObject = async (locations, options = {}) => {
  const handles = []
  if (!Array.isArray(locations)) { locations = [locations] }

  const possibles = locations
    .map(async (location, idx) => {
      const result = LocationObject()
      if (!location) { return null }
      // NB currently does not cache failures well

      // debug('\ntrying to convert ',idx,location);
      if (typeof location !== 'object') {
        location = cache.canonicalise(location)

        if (!cache[location]) { // debug('Not cached:',location)
        } else
        // debug('found in cache:',cache.get(location, noVerify));

        if (cache[location]) { return cache.get(location, noVerify) }
      }
      // debug(`canonicalised ${''}(if string): ${location}`);

      // the only permissable objects are
      // . latLng (leaflet.js)
      // . or req.query object containing at least one of pc, pc7, pc8, pcd, latlong as properties
      const fullPc = location.pc7 || location.pc8 || location.pc || location
      if (isFullPostcode(fullPc)) {
        try {
          debug('got pc:', fullPc)
          let specificity
          const info = await locationInfoFromPostcode(fullPc)
          debug(Object.keys(info))
          if (info.region) { specificity = 1 }
          if (isPostcodeDistrict(info.pcd)) { specificity = 5 }
          if (info.parliamentary_constituency) { specificity = 6 }
          if (toLatLong(info.latLong) || isFullPostcode(info.pc || info.pc7 || info.pc8)) { specificity = 10 }
          // TODO: use GSS bits here from GSS converter

          Object.assign(result, info, { specificity })

          // job done, don't examine other cases
          cache.put(fullPc, result, noVerify)
          debug('Successful lookup, got: ', info)
          // don't retrieve handles from cache, we want fresh ones!
          addOfficialLabourHandles(result, info)
          return result
        } catch (err) {
          if (err.message.endsWith('404')) {
            if (typeof location === 'string') { location = districtFromFullPostcode(fullPc) } else { location.pcd = location.pcd || districtFromFullPostcode(fullPc) }
          }
          console.log(err)
        }
      }

      if (result.specificity < 5 && isPostcodeDistrict(location.pcd || location)) {
        // TODO: use cache, google, etc, to get some sense from partial postcode if it is real
        Object.assign(result, {
          pcd: location.pcd || location,
          specificity: 5
        })
        //  cache but don't return - we may get a better result
      }

      // TODO: other string types, or, eg, query.city

      // TODO: add processing for lowercase latlong, (latlong lowercase comes from querystring)
      location = (location.latLong || location.pcd || (typeof location === 'string')) ? location : null

      // WHAT IF THE INFO'S NOT FROM LATLNG!!?
      if (latLongFrom4dpLatLongString(location)) {
        const info = locationInfoFromLatLong(location)
        /// process info
        Object.assign(result, info, { specificity: 10 })
        cache.put(location, result, noVerify)
        // don't retrieve handles from cache, we want fresh ones!
        addOfficialLabourHandles(result, locationInfo)
        // always return result here, since 10 is the maximum specificity.
        return result
      }

      if (options.useGoogle) {
        // If useGoogle==true, use our API credits to try to get a more specific location from Google API
        // cache.put (location, result);
      }

      if (options.useTwitterContext) {
        // Use context from eg user's tweets to attempt to guess location
        // user data, eg screen name is received in options.useTwitterContext object
      }

      return (location && location.specificity && (location.specificity >= result.specificity))
        ? location
        : result
    })

  const bestLocation = (await Promise.all(possibles))
    .filter(Boolean)
    .sort((a, b) => (b.specificity || 0) - (a.specificity || 0)) // Specificity takes priority over input order

  // debug('results:',bestLocation );

  return bestLocation[0] || LocationObject()
}

module.exports = { LocationObject, populateLocationObject, constituencyFromPostcode }
