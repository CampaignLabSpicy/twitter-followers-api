const endsWithPostcodeRE = new RegExp(/([a-z|A-Z]{1,2}\d(\d|\w)?)\s?(\d[a-z|A-Z]{2})?\s*$/,'m');
const pc7Regexp = new RegExp(/([a-z|A-Z]{1,2}\d(\d|\w)?)(\d[a-z|A-Z]{2})/);
const pc8Regexp = new RegExp(/([a-z|A-Z]{1,2}\d(\d|\w)?) (\d[a-z|A-Z]{2})/);
const pcdRegexp = new RegExp(/([a-z|A-Z]{1,2}\d(\d|\w)?)\s*$/);
const latLongEastWestRegExp = new RegExp(/(.*)([NSns])(.*)([EWew])(.*)/);
const latLongDigitsRegExp = new RegExp(/^\s*\(?\s*(-?\d*.\d*)\s*,\s*(-?\d*.\d*)\s*\)?\s*$/);
const is4dplatLongRegExp = new RegExp(/^(-?\d*(.\d{0,4})?),(-?\d*(.\d{0,4})?)$/);
const whitespaceRegExp = new RegExp(/(^\s+|\s+$)/g);

// match pc7, pc8, pcd
const isPc7 = pc => pc && !!(pc.match(pc7Regexp))
const isPc8 = pc => pc && !!(pc.match(pc8Regexp))
const isPostcodeDistrict = pc => (typeof pc === 'string') && !!(pc.match(pcdRegexp))

const isFullPostcode = pc => (typeof pc === 'string') && (isPc7(pc) || isPc8(pc));
const isPostcode = pc => isFullPostcode(pc) || isPostcodeDistrict(pc);

const endsWithPostcode = pc => (pc && pc.match(endsWithPostcodeRE))

// retrieve pc7, pc8, pcd

const partsFromPostcode = pc => {
  pc = pc.toUpperCase();
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
  if (!pc)
    return null;
  const [_, pcd, inwardCode] = pc.match(endsWithPostcodeRE);
  return (`${ pcd }${ inwardCode? ' '+inwardCode : '' }`).toUpperCase();
}

const standardPcAndSpecificity = pc => {
  const fields = {}
  fields.specificity =
    isFullPostcode(pc) ? 10
      : isPostcodeDistrict(pc.slice(0, -2)) ? 6
        : isPostcodeDistrict(pc) ? 5
          : 0 ;

  switch (fields.specificity) {
     case 10:
      fields.pc7 = pc7FromFullPostcode(pc);
      fields.pc = fields.pc7;
     break;
     case 6:
      fields.pcd = districtFromPostcodeDistrict(pc.slice(0, -2));
      fields.pc = fields.pcd;
      fields.pcs = pc.toUpperCase();
     break;
     case 5:
      fields.pc = districtFromPostcodeDistrict(pc);
      fields.pcs = fields.pc;
     break;
     default:
      return null;
  }
  return fields ;
}

const latLngFromPostcodeDistrict = pcd => {

}

const latLngFromPostcodeSector = pc => {

}

const isLeafletLatLng = latLng =>
  (typeof latLng === 'object') && (typeof latLng.lat === 'number') && (typeof latLng.lng === 'number')

const toLatLong = latLong => {
  if (!latLong)
    return null
  if (Array.isArray(latLong) && latLong.length===2 && typeof (latLong[0])==='number' && typeof (latLong[1])==='number')
    return ({ lat : latLong[0],  lng : latLong[0] })
  if (typeof latLong==='object')
    return (latLong.lat===undefined || latLong.lng===undefined) ?
      null
      : latLong
  if (typeof latLong==='string')
    return latLongFromString(latLong)
  return null
}

const toStandardLatLong = latLong => {
  const result = toLatLong(latLong);
  if (!result || result.lat===undefined || result.lng===undefined)
    return null
  console.log(result,{lat : roundToNearest(0.001)(result.lat),lng : roundToNearest(0.001)(result.lng)});
  return {
      lat : roundToNearest(0.001)(result.lat),       // 110 metre precision
      lng : roundToNearest(0.001)(result.lng)
    }
}


//NB lat,long in strings and arrays is ordered as lng, lat- ie W/E, N/S or X,Y - this is what Google maps uses.
const latLongFromString = latLong => {
  latLong = latLong.replace(whitespaceRegExp, '')
  if (!latLong)
    return null;
  const eastWest = latLong.match(latLongEastWestRegExp);
  if (eastWest)
    latLong = `${eastWest[1]}${eastWest[3]}${eastWest[5]}`;
  const matchDigits = latLong.match(latLongDigitsRegExp);
  if (!matchDigits)
    return null;
  let [_, lng, lat] = matchDigits;
console.log('Found something:',lat,lng);
  lat = 1*lat;
  lng = 1*lng;
  if (eastWest) {
    if (eastWest[2]==="S" || eastWest[2]==="s")
      lat= -lat;
    if (eastWest[4]==="W" || eastWest[4]==="w")
      lng= -lng;
  }
  return { lat, lng }
}

const latLongFrom4dpLatLongString = latLong => {
  if (!latLong || typeof latLong !== 'string')
    return null;
  const groups = latLong.match(is4dplatLongRegExp);
  if (!groups)
    return null;
  const [, lng, , lat] = groups;
  return { lng, lat }
}

const latLongIsInBritishIsles = ({lat, lng}) => (
  lat < 2.28
  && 0.75*lat - 0.25*lng> 37.9
  && 7.25*lat - 2.25*lng > 366.6
  && 14.25*lat + 6.25*lng > 659.5
  && -22.75*lat + 8.25*lng > 1395.3
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


module.exports = { isPc7, isPc8, isPostcodeDistrict, isFullPostcode, isPostcode, endsWithPostcode, partsFromPostcode,
  pc7FromFullPostcode, pc8FromFullPostcode, districtFromFullPostcode, districtFromPostcodeDistrict,
  postcodeFromString, standardPcAndSpecificity,
  toStandardLatLong, toLatLong, isLeafletLatLng, latLongFromString, latLongFrom4dpLatLongString,
  roundToNearest, latLongIsInBritishIsles, promiseyLog
}
