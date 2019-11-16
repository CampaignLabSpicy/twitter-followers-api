const debug = require('debug')('kyf:location.server.index.js');

// const { constituencyFromPostcode, locationInfoFromPostcode } = require ('./externals');
const { isPc7, isPc8, isPostcodeDistrict, isFullPostcode, isPostcode, endsWithPostcode,
pc7FromFullPostcode, pc8FromFullPostcode, districtFromFullPostcode, districtFromPostcodeDistrict, postcodeFromString,
toStandardLatLong, toLatLong, isLeafletLatLng, latLongFromString, latLongFrom4dpLatLongString, roundToNearest } = require ('./helpers');
const { fromPostcodesIo, fromGoogle, fromTwitter,
  constituencyFromPostcode, locationInfoFromPostcode  } = require ('./requests');

const LocationObject = ()=> ({
  specificity : 0,
  twitterString  : '',
  defaultTwitterFollow : '@uklabour'
});
const noVerify = { verify : false };

const cache = {
  records : 0,

  canonicalise : location => {
    const latLong = toStandardLatLong(location);
    if (latLong)
      return(`${latLong.lng},${latLong.lat}`);                // see note in helpers.js
    if (isPostcode(location))
      return pc8FromFullPostcode(location) || districtFromPostcodeDistrict(location)
    if (endsWithPostcode(location))
      return postcodeFromString(location)
    // and then the harder cases, eg London, Hackney, The World
    return location
  },

  compress : x=> x,

  uncompress : x=> x,

  put : (location, result, options={ verify:true } ) => {
    if (options.verify)
      location = cache.canonicalise(location);
    if (!cache[location]) {
      cache[location] = cache.compress(result);
      cache.records++;
    }
    // debug(cache);
  },

  get : (location, options={ verify:true } ) => {
    if (options.verify)
      location = cache.canonicalise(location);
    return cache.uncompress(cache.location);
  }

}


// locations is one of:
// . query object, eg {pc='AB1 9XY', latlong=<leafletJS latlong>}
// . pcd, pc7, pc8, latLong, leafletJS latlong
// . a prioirty ordered array of the above
const populateLocationObject = async (locations, options={} ) => {
  if (!Array.isArray(locations))
    locations = [locations];

  const possibles = locations
    .map (async (location, idx) => {
      const result = LocationObject();
      if (!location)
        return null
      // NB currently does not cache failures well

  // debug('\ntrying to convert ',idx,location);
      if (typeof location !=='object') {
        location = cache.canonicalise(location);

        if (!cache[location])
        { // debug('Not cached:',location)
        }
        else
          // debug('found in cache:',cache.get(location, noVerify));

          if (cache[location])
            return cache.get(location, noVerify)
      }
  // debug(`canonicalised ${''}(if string): ${location}`);

      // the only permissable objects are
      // . latLng (leaflet.js)
      // . or req.query object containing at least one of pc, pc7, pc8, pcd, latlong as properties
      const fullPc = location.pc7 || location.pc8 || location.pc || location;
      if (isFullPostcode(fullPc))
        try {
    debug('got pc:',fullPc);
          let specificity;
          const info = await locationInfoFromPostcode(fullPc)
    // debug(Object.keys(info));
          if (info.region)
            specificity = 1
          if (isPostcodeDistrict(info.pcd))
            specificity = 5
          if (info.parliamentary_constituency)
            specificity = 6
          if (toLatLong(info.latLong) || isFullPostcode(info.pc || info.pc7 || info.pc8))
            specificity = 10
          // TODO: use GSS bits here from GSS converter

          Object.assign (result, info, {specificity} );

          // job done, don't examine other cases
          cache.put(fullPc, result, noVerify);
          debug('Successful lookup, got: ', info);
          return result
        }
        catch (err) {
          if (err.message.endsWith('404')) {
            if (typeof location==='string')
              location = districtFromFullPostcode(fullPc)
            else
              location.pcd = location.pcd || districtFromFullPostcode(fullPc)
          }
          console.log(err);
        }

      if (result.specificity<5 && isPostcodeDistrict(location.pcd || location)) {
        // TODO: use cache, google, etc, to get some sense from partial postcode if it is real
        Object.assign (result, {
          pcd : location.pcd || location,
          specificity : 5
        });
        //  cache but don't return - we may get a better result
      }

      // TODO: other string types, or, eg, query.city

      // NB using lowercase latlong, as it's a querystring
      location = location.latlong || location.pcd || (typeof location === 'string') ? location : null

      if (latLongFrom4dpLatLongString(location)) {
        const info = locationInfoFromLatLong(location)
        /// process info
        Object.assign ( result, info, { specificity:10 } )
        cache.put( location, result, noVerify );
        return result
      }
      if (options.useGoogle) {
        // If useGoogle==true, use our API credits to try to get a more specific location from Google API
        cache.put (location, result);
      }

      if (options.useTwitterContext) {
        // Use context from eg user's tweets to attempt to guess location
        // user data, eg screen name is received in options.useTwitterContext object
      }
      return result
    }) ;

  let bestLocation = (await Promise.all(possibles))
    .filter (Boolean)
    .sort ((a,b) => (b.specificity||0) - (a.specificity||0) )      // Specificity takes priority over input order

// debug('results:',bestLocation );

  return bestLocation[0];
};

//
// const testThis = async ()=>  {
//   await Promise.all ([
//     populateLocationObject ('PO123AA'),
//     populateLocationObject ('PO12'),
//     populateLocationObject ('XX99 3AA')
//   ]);
//   console.log(cache);
// }
//
// testThis()

module.exports = { LocationObject, populateLocationObject, constituencyFromPostcode }
