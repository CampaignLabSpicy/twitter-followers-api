const debug = require('debug')('kyf:location.server.index.js');
const fetch = require('node-fetch');

// postcodesio-client is an alternative, simpler library.
// node-postcodes.io, remeber to pipe results through include nodePostcodesIoResultsShim

const PostcodesIO = require('postcodesio-client');
// const postcodesIo = new PostcodesIO('https://api.postcodes.io')
const postcodesIo = require('node-postcodes.io');

const { isPc7, isPc8, isPostcodeDistrict, isFullPostcode, isPostcode, endsWithPostcode,
pc7FromFullPostcode, pc8FromFullPostcode, districtFromFullPostcode, districtFromPostcodeDistrict, postcodeFromString,
toStandardLatLong, toLatLong, isLeafletLatLng, latLongFromString, latLongFrom4dpLatLongString, latLongDigitsCommaOptionalRegExp,
 roundToNearest, promiseyLog,
standardPcAndSpecificity } = require ('./helpers');

const constituencyInfo = require ('./testdata/listOfCLPsandPPCs.json');

// Use these two config consts to take the data out of the XHR's result object,
// in order to limit the info to be passed back to the cache.
// 'default fields' is an array whose members can be field names as found in the remote API's result
// object, of sub- (/sub- /sub-, etc) properties of that object.
// 'field processors' are for those fields which require modification before storage
// (eg pairing together into an array, or changing property name)
// NB the field processor functions do NOT return meaningful info, but receive a 'report' object and mutate it.

const postcodesIoDefaultFields = [ 'parliamentary_constituency', { codes : 'parliamentary_constituency' }, 'region']
const postcodesIoDefaultFieldProcessors = [
  (result, report) => { report.latLong = { lng : result.longitude, lat: result.latitude } },
  (result, report) => { report.parl_const_gss = result.codes.parliamentary_constituency },
  (result, report) => { report.parliamentary_constituency = result.parliamentary_constituency },
  (result, report) => { delete report.codes }
]

// Takes a Location Object
const addConstituencyInfoToLocation = location => {
  // TODO : Implement it ;)
}

// Takes a postcodes.io result record
// NB Mutates the object!
const addConstituencyInfoTo = result => {
  // TODO: Typecheck input (eg was it array? error?)
  const info = constituencyInfo[result.parliamentary_constituency];
  console.log('info',info);
  if (!info)
    return false;
  console.log(info);
}

// mutates the received object report
const recursiveProcessor = (fields, result, report) =>  {
  if (typeof fields === 'string')
    report[fields] = result[fields]
  else if (Array.isArray (fields)) {
    fields.forEach (field => recursiveProcessor(field, result, report) )
  }
  else if (typeof fields === 'object') {
    Object.keys(fields).forEach (key =>  {
      report[key] = {};
      recursiveProcessor(fields[key], result[key], report[key])
    })
  }
}

const handle404 = result => {
  if (result===null || result.status===404)
    console.log('should throw');
  if (result===null)
    throw new Error(`lookup request fail - 404`);
  if (result.status===404)
    throw new Error(`lookup request fail ${result.status}`);
  return result
};


// NB there is a choice of two wrapper modules for Postcodes.io.
// node-postcodes.io is more powerful, but requires this shim.
const nodePostcodesIoResultsShim = result => {
  if (result.status !== 200)
    throw new Error(`HTTP request fail ${result.status}`);
  if (Array.isArray (result.result))
    return result.result.map (result=> result.result)   // Sorry, couldn't resist it ;)
  return result.result
}


// fromPostcodesIo is currently:
//  . set up for node-postcodes.io module (comment out ".then (nodePostcodesIoResultsShim)" to use postcodesio-client )
//  . using postcodesIoDefaultFields & postcodesIoDefaultFieldProcessors, ie set up for API to respond
//    with a single gss code and constituency name
// TODO: make it general for batch lookup. Make constituencyFromPcioLookup a specific instance of it for single lookup.
const fromPostcodesIo = async (location,
  desiredFields = postcodesIoDefaultFields,
  fieldProcessors = postcodesIoDefaultFieldProcessors
)=> {
  const report = {};
  await postcodesIo
  	.lookup(location)
    .then (nodePostcodesIoResultsShim)
    .then (handle404)
    .then (result => result[0]!==undefined ? result[0] : result)    // Discard all results except the first - you don't want this!
    .then (handle404) // repeated for the unpacked array result
    .then (promiseyLog('before processing'))
    .then (info=> {
      recursiveProcessor (desiredFields, info, report);
      fieldProcessors.forEach (processor=> {processor(info, report)} );
      return report
  	})
    .then(promiseyLog('after processing'))
    // TODO: distinguish errors
    .catch (err=> {
      if (err.message.endsWith('404'))
        throw err;
      console.log(err);
    })

  return report
}

const constituencyFromPcioLookup = async pc => {
  const result = await fromPostcodesIo (pc) ;
  return result
}

const constituencyFromPostcode = async pc => {
  // TODO: check it's a good postcode
  const result = await constituencyFromPcioLookup (pc)
  return result
}

const locationInfoFromPostcode = async pc=> {
  // TODO: check postcodes via local .csv files first
  const result = await fromPostcodesIo(pc)
    .catch (err=> {
      if (err.message.endsWith('404')) {
        // TODO: catch bad 404s resulting from bad postcodes
        console.log(`Bad postcode - ${pc}. Will rethrow.`);
      }
      throw err;
    }) ;
  addConstituencyInfoTo (result);
  return result
}

// NB, Doogal can take a full pc7 or pc8 (not used, since we use postcodes.io), or a pcd, or
// a postcode sector SO LONG AS it contains a space - eg 'SW1A 0'

// TODO: integrate this into constituencyFromPostcode & locationInfoFromPostcode
const fromDoogal = async pc =>  {
  const doogalPostcodeUrl = 'https://www.doogal.co.uk/GetPostcode.ashx?postcode='
  const result = standardPcAndSpecificity (pc);
  if (!result.specificity)
    return null

  try {
    let latlng;
    const response = await fetch (doogalPostcodeUrl+pc);
    let body = await response.text()
    body = body.split('\n')[0];
    debug(`Doogal result from ${pc}: '${body}'`);
    // TODO: race timeout and throw appropriate error- Doogal makes no guarantees of reliability
    console.log(response.status);
    if (response.status !== 200)
      return null
    // Try again once only with pcd if pc was bad postcode sector
    if (!body.length && pc.indexOf(' ') === pc.length-2)
      return fromDoogal(pc.slice(0, -2))
    if (body.length > 27)
      debug (`interesting Doogal result from ${pc} : '${body}'`)

    latLng=body.split('\x09')
    if (!latLng)
      return null
    latLng = `${latLng[1]},${latLng[2]}`
    debug(`Doogal result from ${pc}: latLng may be '${latLng}'`);
    latLng=toStandardLatLong(latLng);
    if (!latLng)
      return null
    result.latLng = latLng;
    debug('will return result:',result)

    // TODO: Add town name from Doogal CSV
    return result;
  }
  catch (e) {
    // TODO: handle errors - Doogal makes no guarantees of reliability!
    throw e;
  }
}

/// GOOGLE: - - - - - - - - - - - - - - -

const fromGoogle = async (location)=> {
  const result = {};

  return result
}


/// TWITTER: - - - - - - - - - - - - - - -

// Infer a location from Twitter context, eg tweets
const fromTwitter = async (location, twitterData )=> {
  const result = { specificity : 4 };
  const { screen_name, id } = twitterData;

  // do magic

  return result
}

// If uncommented, these will be run when index.js imports the file.
// They won;t output anything but will cause 404 errors, which won;t be caught, since
// the try/ catch is in index.js

// fromPostcodesIo ('PO123AA')
// fromPostcodesIo ('PO12')
// fromPostcodesIo ('XX99 3AA')
// fromPostcodesIo (['XX99 3AA', 'PO12 3AB'])


module.exports = { fromPostcodesIo, fromDoogal, fromGoogle, fromTwitter, constituencyFromPostcode, locationInfoFromPostcode }
