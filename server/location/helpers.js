const endsWithPostcodeRE = new RegExp(/([a-z|A-Z]{1,2}\d\w)\s?(\d[a-z|A-Z]{2})?\s*$/,'m');
const pc7Regexp = new RegExp(/([a-z|A-Z]{1,2}\d\w)(\d[a-z|A-Z]{2})/);
const pc8Regexp = new RegExp(/([a-z|A-Z]{1,2}\d\w) (\d[a-z|A-Z]{2})/);
const pcdRegexp = new RegExp(/([a-z|A-Z]{1,2}\d\w)\s*$/);
const latLongEastWestRegExp = new RegExp(/(.*)([NSns])(.*)([EWew])(.*)/);
const latLongDigitsRegExp = new RegExp(/^\s*\(?\s*(\d*.\d*)\s*,\s*(\d*.\d*)\s*\)?\s*$/);
const whitespaceRegExp = new RegExp(/(^\s+|\s+$)/g);

// match pc7, pc8, pcd
const isPc7 = pc => !!(pc.match(pc7Regexp))
const isPc8 = pc =>  !!(pc.match(pc8Regexp))
const isPostcodeDistrict = pc => !!(pc.match(pcdRegexp))

const isFullPostcode = pc => isPc7(pc) || isPc8(pc) || isPostcodeDistrict(pc);
const isPostcode = pc => isFullPostcode(pc)

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
  let [_, northing, easting] = latLong.match(latLongDigitsRegExp);
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
