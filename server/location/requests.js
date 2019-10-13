
const PostcodesIO = require('postcodesio-client');
// const postcodesIo = new PostcodesIO('https://api.postcodes.io')
const postcodesIo = require('node-postcodes.io')

// Use these two config consts to take the data out of the XHR's result object,
// in order to limit the info to be passed back to the cache.
// 'default fields' is an array whose members can be field names as found in the remote API's result
// object, of sub- (/sub- /sub-, etc) properties of that object.
// 'field processors' are for those fields which require modification before storage
// (eg pairing together into an array, or changing property name)
// NB the field processor functions do NOT return meaningful info, but receive a 'report' object and mutate it.

const postcodesIoDefaultFields = [ {codes : 'parliamentary_constituency' }, 'region']
const postcodesIoDefaultFieldProcessors = [
  (result, report) => { report.latLong = [result.longitude, result.latitude] }
]

// mutates the received object report
const recursiveProcessor = (fields, result, report) =>  {
  if (typeof fields === 'string')
    report[fields] = result[fields]
  else if (Array.isArray (fields)) {
    fields.forEach (field => recursiveProcessor(field, result, report) )
  }
  else if (typeof fields === 'object') {
    Object.keys(fields).forEach (key =>  {
const postcodesIo = new PostcodesIO('https://api.postcodes.io')
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
    .then (info=> {
      recursiveProcessor (desiredFields, info, report);
      fieldProcessors.forEach (processor=> {processor(info, report)} );
  	})
    // TODO: distinguish errors
    .catch (err=> {
      if (err.message.endsWith('404'))
        throw err;
      console.log(err);
    })

  return report
}

const fromGoogle = async (location)=> {
  const result = {};

  return result
}

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


module.exports = { fromPostcodesIo, fromGoogle, fromTwitter }
