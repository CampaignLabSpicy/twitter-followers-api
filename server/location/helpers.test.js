const {
  isPc7, isPc8, isPostcodeDistrict, isFullPostcode, isPostcode, endsWithPostcode,
  pc7FromFullPostcode, pc8FromFullPostcode, districtFromFullPostcode, districtFromPostcodeDistrict,
  postcodeFromString,
  toStandardLatLong, toLatLong, isLeafletLatLng, latLongFromString, latLongFrom4dpLatLongString,
  roundToNearest, latLongIsInBritishIsles, promiseyLog
} = require('./helpers')

const test = (fn, input, expected, message, logLevel = 1) => {
  const actual = fn(input)
  // const result = (Boolean(actual) == expected);
  const result = actual == expected
  let output = ''
  const formattedInput = (typeof input === 'object')
    ? input
    : input.toString()
  if (logLevel || !result) { output += `${fn.name}(${formattedInput})` }
  if (logLevel > 1) { output += `: ${actual}` }
  if (result) {
    if (logLevel) { output += ' OK' }
  } else {
    output += `${message || ''} - expected ${expected} but actual ${actual}`
  }
  if (logLevel) { console.log(output) }
  return result
}

test(isPc7, 'SW1A 0AA', false)
test(isPc7, 'SW1A0AA', true)
test(isPc8, 'SW1A 0AA', true)
test(isPc8, 'SW1A0AA', false)
test(isPc7, 'E2 0AA', false)
test(isPc7, 'E20AA', true)
test(isPc8, 'E2 0AA', true)
test(isPc8, 'E20AA', false)
test(isPc7, 'E201AA', true)
test(isPc8, 'E201AA', false)
test(isPostcodeDistrict, 'SW1A 0AA', false)
test(isPostcodeDistrict, 'SW1A0AA', false)
test(isPostcodeDistrict, 'E2 0AA', false)
test(isPostcodeDistrict, 'E20AA', false)
test(isPostcodeDistrict, 'E201AA', false)
test(isPostcodeDistrict, 'SW1A', true)
test(isPostcodeDistrict, 'E2', true)
test(isPostcodeDistrict, 'E20', true)

test(endsWithPostcode, 'Stuff.. SW1A 0AA', true)
test(endsWithPostcode, 'Stuff.. SW1A0AA', true)
test(endsWithPostcode, 'Stuff.. E2 0AA', true)
test(endsWithPostcode, 'Stuff.. E20AA', true)
test(endsWithPostcode, 'Stuff.. E201AA', true)
test(endsWithPostcode, 'Stuff.. SW1A', true)
test(endsWithPostcode, 'Stuff.. E2', true)
test(endsWithPostcode, 'Stuff.. E20', true)
//
// test (isPc7, 'E2 0AA', true);
// test (isPc7, 'SW1A 0AA', true);
// test (isPc7, 'SW1A 0AA', true);
// test (isPc7, 'SW1A 0AA', true);
// test (isPc7, 'SW1A 0AA', true);
// test (isPc7, 'SW1A 0AA', true);
// test (isPc7, 'SW1A 0AA', true);
// test (isPc7, 'SW1A 0AA', true);
