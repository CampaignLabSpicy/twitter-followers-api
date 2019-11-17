const debug = require('debug')('kyf:location.server.index.js');

// const { constituencyFromPostcode, locationInfoFromPostcode } = require ('./externals');
const { isPc7, isPc8, isPostcodeDistrict, isFullPostcode, isPostcode, endsWithPostcode, partsFromPostcode,
pc7FromFullPostcode, pc8FromFullPostcode, districtFromFullPostcode, districtFromPostcodeDistrict, postcodeFromString,
toStandardLatLong, toLatLong, isLeafletLatLng, latLongFromString, latLongFrom4dpLatLongString, roundToNearest } = require ('./helpers');
const { officialLabourHandlesFromConstituency } = require ('./locationmatchers');
const { fromPostcodesIo, fromDoogal, fromGoogle, fromTwitter,
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

// Mutates resultObject by concatenating handles from listOfCLPsandPPCs.json
const addOfficialLabourHandles = (resultObject, locationInfo) => {
  if (locationInfo && locationInfo.parliamentary_constituency) {
    if (!resultObject.twitterHandles)
      resultObject.twitterHandles = [];
    let handles = officialLabourHandlesFromConstituency(locationInfo.parliamentary_constituency) || []
    handles.forEach ( handle =>
        resultObject.twitterHandles.push(handle)
    )
  }
}

// can consume only full pc string as location
// Starts from an empty LocationObject, therefore relies on being the first lookup function called.
const tryFullPcLookup = async (fullPc, options={} ) => {
  debug('got pc:',fullPc);
  const result = LocationObject();
  let specificity;
  const info = await locationInfoFromPostcode(fullPc);
  debug('fullPC lookup found keys:',Object.keys(info));
  if (info.region)
    specificity = 1
  if (isPostcodeDistrict(info.pcd))
    specificity = 5
  if (info.parliamentary_constituency)        // valid postcode sector, eg XX12 3 is also specificity 6.
    specificity = 6
  if (toLatLong(info.latLong) || isFullPostcode(info.pc || info.pc7 || info.pc8))
    specificity = 10
  // TODO: use GSS bits here from GSS converter

  // TODO : check if it is possible for info to be other than useful here (locationInfoFromPostcode should have thrown if not)
  Object.assign (result, info, { specificity:10 } );

  // job done, don't examine other cases
  cache.put(fullPc, result, noVerify);
  debug('Successful lookup, got: ', info);
  // don't retrieve handles from cache, we want fresh ones!
  addOfficialLabourHandles (result, info);
  return result
}

// Try postcode sector with Doogal
const tryPcSectorLookup = async possiblePcSector => {
  if (possiblePcSector
    && (typeof possiblePcSector === 'string')
    && isFullPostcode(possiblePcSector+'XX')) {
      // debug ('Trying PCS from Doogal as',possiblePcSector)
      const info = await fromDoogal(possiblePcSector);
      // debug ('Got the result from Doogal:',info)
      return info
    } else
    return null
};

const tryPcDistrictLookup = async location => {
  // Try postcode district with Doogal
  if (isPostcodeDistrict(location.pcd || location)) {
    debug ('Trying PCD from Doogal as', location.pcd || location.pc || location)
    const info = await fromDoogal(location.pcd || location);
    return info
    } else
    return null
};


// locations is one of:
// . query object, eg {pc='AB1 9XY', latlong=<leafletJS latlong>}
// . pcd, pc7, pc8, latLong, leafletJS latlong
// . a priority ordered array of the above
const populateLocationObject = async (locations, options={} ) => {
  let handles = [];
  if (!Array.isArray(locations))
    locations = [locations];



  debug (locations.map (l => [typeof l, Boolean(l), l? l.specificity : l ]));
  const possibles = locations
    .map (async (location, idx) => {
      const result = (location && location.specificity) ?
        LocationObject()
        : location;
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
      if (isFullPostcode(fullPc)) {
        try {
          const info = await tryFullPcLookup (fullPc, options);
          if (info)
            Object.assign (result, info );
        }
        catch (err) {
          debug (`Error received: '${err.message}'`)
          if (err.message.endsWith('404')) {
            if (typeof location==='string')
              location = districtFromFullPostcode(fullPc)
            else {
              let parts = partsFromPostcode(fullPc);
              location.pcd = location.pcd || districtFromFullPostcode(fullPc)
              location.pcs = location.pcs || (parts[1] && `${parts[0]}${parts[1].slice(0,1)}`)
              delete location.pc7;
              delete location.pc8;
              if (location.pc)
                location.pc=location.pcd;
            }
          } else
          debug (`Uncaught Error type - expected success or 404, got:'${err.message}'`);
        }
      }

      try {
        // postcode sector
        if (result.specificity<6) {
          const possiblePcSector = location.pcs || location.pc || location;
          const info = await tryPcSectorLookup (possiblePcSector);
          if (info)
            Object.assign (result, info );
          debug(`after checking for possible pcs ${possiblePcSector.toString()}, result is `,result);
        }

        debug (`specificity:${result.specificity} - If <5 and any of (${location.pcd } ${ location.pc } ${isPostcodeDistrict(location.pcd || location.pc || location)}) are truthy, check pcd`)

        // postcode district
        if (result.specificity<5) {
          const info = await tryPcDistrictLookup (location);
          if (info)
            Object.assign (result, info )
        }

      } catch (err) {
        throw err
      }

      // TODO: reverse lookup constituency, eg from Doogal, or Doogal CSVs


      // TODO: other string types, or, eg, query.city

      // NB using lowercase latlong, as it's a querystring
      location = location.latlong || location.pcd || (typeof location === 'string') ? location : null

      // set location here - should latlong take priority over pc7/pc8?
      // .. and should latLng take priority over pc7/pc8?
      debug (`By now, location should be cacheable, ie a string or null. location is: ${location}`)

// WHAT IF THE INFO'S NOT FROM LATLNG!!?
      if (latLongFrom4dpLatLongString(location)) {
        const info = locationInfoFromLatLong(location)
        /// process info
        Object.assign ( result, info, { specificity:10 } )
        cache.put( location, result, noVerify );
        // don't retrieve handles from cache, we want fresh ones!
        addOfficialLabourHandles (result, locationInfo);
        return result
      }

      if (options.useGoogle) {
        // If useGoogle==true, use our API credits to try to get a more specific location from Google API
        cache.put (location, result);  // NB will throw error since location may still be object when we reach here
      }

      if (options.useTwitterContext) {
        // Use context from eg user's tweets to attempt to guess location
        // user data, eg screen name is received in options.useTwitterContext object
      }
      return result
    }) ;

  let bestLocation = (await Promise.all(possibles));
  // debug (bestLocation.map (l => [typeof l, Boolean(l), l? l.specificity : l ]));
  bestLocation = bestLocation
    .filter (Boolean)                                              // belt and braces - should at least be an empty LocationObject
    .sort ((a,b) => (b.specificity||0) - (a.specificity||0) )      // Specificity takes priority over input order
  return bestLocation[0];
};

module.exports = { LocationObject, populateLocationObject, constituencyFromPostcode }
