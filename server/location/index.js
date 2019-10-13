const debug = require('debug')('kyf:matcher');
const { isPc7, isPc8, isPostcodeDistrict, isFullPostcode, isPostcode, endsWithPostcode,
pc7FromFullPostcode, pc8FromFullPostcode, districtFromFullPostcode, districtFromPostcodeDistrict,
postcodeFromString, latLongFromString, latLongFrom4dpLatLongString, roundToNearest } = require ('./helpers');
const { fromPostcodesIo, fromGoogle, fromTwitter } = require ('./requests');

const emptyLocationObject = {
  specificity : 0,
  twitterString  :''
};
const noVerify = { verify : false };

const locationInfoFromPostcode = async location=> {

  // TODO: check postcodes via local .csv files first

  return await fromPostcodesIo(location)
}


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

  put : (location, result, options={ verify:true } ) => {
    if (options.verify)
      location = cache.canonicalise(location);
    cache[location] = result;
    cache.records++;
  },

  get : (location, options={ verify:true } ) => {
    if (options.verify)
      location = cache.canonicalise(location);
    return cache[location];
  }
}

const populateLocationObject = async (location, options={} ) => {
  const result = {
    specificity : 0,
    twitterString  : location
  };
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
        return emptyLocationObject
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


const testThis = async ()=>  {
  await Promise.all ([
    populateLocationObject ('PO123AA'),
    populateLocationObject ('PO12'),
    populateLocationObject ('XX99 3AA')
  ]);
  console.log(cache);
}

testThis()

module.exports = { emptyLocationObject, populateLocationObject }
