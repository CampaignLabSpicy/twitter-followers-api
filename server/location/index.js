const debug = require('debug')('kyf:matcher');

const { constituencyFromPostcode } = require ('./externals');

const emptyLocationObject = {
  specificity : 0,
  twitterString  : '',
  defaultTwitterFollow : '@uklabour'
};

const cache = {
  canonicalise : location => {
    return location
  },

  compress : x=> x,

  uncompress : x=> x,

  put : (location, result) => {
    location = cache.canonicalise(location);
    this.location = compress(result);
  },

  get : location => {
    location = cache.canonicalise(location);
    return uncompress(cache.location);
  }

}

const populateLocationObject = async (location, options) => {
  const result = {
    specificity : 0,
    twitterString  : location
  };

  if (options.useGoogle) {
    // If useGoogle==true, use our API credits to try to get a more specific location from Google API
    cache.put (location, result);
  }

  if (options.useTwitterContext) {
    // Use context from eg user's tweets to attempt to guess location
  }

  return result;
};

module.exports = { emptyLocationObject, populateLocationObject, constituencyFromPostcode }
