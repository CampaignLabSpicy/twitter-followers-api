const debug = require('debug')('kyf:matcher');

// const { constituencyFromPostcode, locationInfoFromPostcode } = require ('./externals');
const { isPc7, isPc8, isPostcodeDistrict, isFullPostcode, isPostcode, endsWithPostcode,
pc7FromFullPostcode, pc8FromFullPostcode, districtFromFullPostcode, districtFromPostcodeDistrict,
postcodeFromString, latLongFromString, latLongFrom4dpLatLongString, roundToNearest } = require ('./helpers');
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
    const latLong = latLongFromString(location);
    if (latLong)
      return( latLong
          .map( roundToNearest(0.001) )    // 110 metre precision
          .join(',')
      );
    if (isPostcode(location))
      return pc8FromFullPostcode(location) || districtFromPostcodeDistrict(location)
    if (endsWithPostcode(location))
      return postcodeFromString(location)
    // and then the harder cases, eg London, Hackney, The World

  },

  compress : x=> x,

  uncompress : x=> x,

  put : (location, result, options={ verify:true } ) => {
    if (options.verify)
      location = cache.canonicalise(location);
    cache[location] = cache.compress(result);
    cache.records++;
  },

  get : (location, options={ verify:true } ) => {
    if (options.verify)
      location = cache.canonicalise(location);
    return cache.uncompress(cache.location);
  }

}

const populateLocationObject = async (location, options={} ) => {
  const result = new LocationObject();
  location = cache.canonicalise(location);

  if (cache[location])
    return cache.get(location, noVerify)

  if (isFullPostcode(location))
    try {
      const info = await locationInfoFromPostcode(location)

      /// process info
      Object.assign (result, info);

      cache.put(location, result, noVerify);
      return result
    }
    catch (err) {
      if (err.message.endsWith('404')) {
        return new LocationObject()
      }
      console.log(err);
    }

  if (latLongFrom4dpLatLongString(location)) {
    const info = locationInfoFromLatLong(location)
    /// process info
    cache.put(location, result, noVerify);
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

  return result;
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
