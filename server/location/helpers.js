const endsWithPostcodeRE = new RegExp(/([a-z|A-Z]{1,2}\d\w)\s?(\d[a-z|A-Z]{2})?\s*$/,'m');
const pc7Regexp = new RegExp(/([a-z|A-Z]{1,2}\d\w)(\d[a-z|A-Z]{2})/);
const pc8Regexp = new RegExp(/([a-z|A-Z]{1,2}\d\w) (\d[a-z|A-Z]{2})/);
const pcdRegexp = new RegExp(/([a-z|A-Z]{1,2}\d\w)\s*$/);
const latLongEastWestRegExp = new RegExp(/(.*)([NSns])(.*)([EWew])(.*)/);
const latLongDigitsRegExp = new RegExp(/^\s*\(?\s*(-?\d*.\d*)\s*,\s*(-?\d*.\d*)\s*\)?\s*$/);
const is4dplatLongRegExp = new RegExp(/^(-?\d*(.\d{0,4})?),(-?\d*(.\d{0,4})?)$/);
const whitespaceRegExp = new RegExp(/(^\s+|\s+$)/g);

// match pc7, pc8, pcd
const isPc7 = pc => !!(pc.match(pc7Regexp))
const isPc8 = pc =>  !!(pc.match(pc8Regexp))
const isPostcodeDistrict = pc => !!(pc.match(pcdRegexp))

const isFullPostcode = pc => isPc7(pc) || isPc8(pc);
const isPostcode = pc => isFullPostcode(pc) || isPostcodeDistrict(pc);

const endsWithPostcode = pc => (pc.match(endsWithPostcodeRE))

// retrieve pc7, pc8, pcd

const partsFromPostcode = pc => {
  const match7 = pc.match(pc7Regexp);
  const match8 = pc.match(pc8Regexp);
  if (match7)
    return [match7[1], match7[2]]
  if (match8)
    return [match8[1], match8[2]]
  if (isPostcodeDistrict(pc))
    return [pc.match(pcdRegexp)[1], null]
}

const pc7FromFullPostcode = pc => {
  const [pcd, inwardCode] = partsFromPostcode(pc);
  return `${pcd}${inwardCode}`.toUpperCase();
}
const pc8FromFullPostcode = pc => {
  const [pcd, inwardCode] = partsFromPostcode(pc);
  return `${pcd} ${inwardCode}`.toUpperCase();
}
const districtFromFullPostcode = pc => {
  const [pcd, inwardCode] = partsFromPostcode(pc);
  return `${pcd}`.toUpperCase();
}
const districtFromPostcodeDistrict = pc => {
  const [pcd] = partsFromPostcode(pc);
  return `${pcd}`.toUpperCase();
}
const postcodeFromString = pc => {
  const [_, pcd, inwardCode] = pc.match(endsWithPostcodeRE);
  return (`${ pcd }${ inwardCode? ' '+inwardCode : '' }`).toUpperCase();
}

const latLongFromString = latLong => {
  latLong = latLong.replace(whitespaceRegExp, '')
  const eastWest = latLong.match(latLongEastWestRegExp);
  if (eastWest)
    latLong = `${eastWest[1]}${eastWest[3]}${eastWest[5]}`;
  console.log('>',latLong);
  const matchDigits = latLong.match(latLongDigitsRegExp);
  if (!matchDigits)
    return null;
  let [_, northing, easting] = matchDigits
  northing = 1*northing;
  easting = 1*easting;
  if (eastWest) {
    if (eastWest[2]==="S" || eastWest[2]==="s")
      northing= -northing;
    if (eastWest[4]==="W" || eastWest[4]==="w")
      easting= -easting;
  }
  return [northing, easting]
}

const latLongFrom4dpLatLongString = latLong => {
  const groups = latLong.match(is4dplatLongRegExp);
  if (!groups)
    return null;
  const [, northing, , easting] = groups;
  return [northing, easting]
}

const latLongIsInBritishIsles = ([lat, long]) => (
  lat < 2.28
  && 0.75*lat - 0.25*long> 37.9
  && 7.25*lat - 2.25*long > 366.6
  && 14.25*lat + 6.25*long > 659.5
  && -22.75*lat + 8.25*long > 1395.3
  && lat>-8.9   // Northern Ireland
  // && lat>-10.4  // Ireland
)


const roundToNearest = unit => num =>
  Math.floor (0.5+ (num*unit)) / unit


const promiseyLog = message => result =>  {
  if (message)
    console.log(message);
  console.log(result);
  return result
}


module.exports = { isPc7, isPc8, isPostcodeDistrict, isFullPostcode, isPostcode, endsWithPostcode,
  pc7FromFullPostcode, pc8FromFullPostcode, districtFromFullPostcode, districtFromPostcodeDistrict,
  postcodeFromString, postcodeFromString, latLongFromString, latLongFrom4dpLatLongString,
  roundToNearest, latLongIsInBritishIsles
}
