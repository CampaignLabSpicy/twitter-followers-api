const endsWithPostcodeRE = new RegExp(/([a-z|A-Z]{1,2}\d\w)\s?(\d[a-z|A-Z]{2})?\s*$/,'m');
const pc7Regexp = new RegExp(/([a-z|A-Z]{1,2}\d\w)(\d[a-z|A-Z]{2})/);
const pc8Regexp = new RegExp(/([a-z|A-Z]{1,2}\d\w) (\d[a-z|A-Z]{2})/);
const pcdRegexp = new RegExp(/([a-z|A-Z]{1,2}\d\w)\s*$/);

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
