
// const PostcodesIO = require('postcodesio-client');
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
      report[key] = {};
      recursiveProcessor(fields[key], result[key], report[key])
    })
  }

}

// NB there is a choice of two wrapper modules for Postcodes.io.
// node-postcodes.io is more powerful, but requires this shim.
const nodePostcodesIoResultsShim = result => {
  if (result.status !== 200)
    throw new Error(`HTTP request fail ${result.status}`);
  if (Array.isArray (result.result))
    return result.result.map (result=> result.result)   // Sorry, couldn't resist it ;)
  return result.result
}

const fromPostcodesIo = (location,
  desiredFields = postcodesIoDefaultFields,
  fieldProcessors = postcodesIoDefaultFieldProcessors
)=> {
  const report = {};
  
  postcodesIo
  	.lookup(location)
    .then (nodePostcodesIoResultsShim)
    .then (result => result[0] || result)
  	.then (info=> {
  		console.log(info);
      recursiveProcessor (desiredFields, info, report);
      console.log(report);
      fieldProcessors.forEach (processor=> {processor(info, report)} );
      console.log(report);
  	})
    // TODO:
    .catch (err=> { console.log(err);})

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


// fromPostcodesIo ('PO123AA')
fromPostcodesIo (['PO123AA', 'PO123AB'])


module.exports = { fromPostcodesIo, fromGoogle, fromTwitter }
