endsWithPostcodeRE = new RegExp('[a-z|A-Z]{1,2}\d{1,2}\s?\d[a-z|A-Z]{2}\s*$');
pc7RE = new RegExp('[a-z|A-Z]{1,2}\d{1,2}\d[a-z|A-Z]{2}');
pc8RE = new RegExp('[a-z|A-Z]{1,2}\d{1,2} \d[a-z|A-Z]{2}');

Add capturey regexps for canonicalise

const isPc7 = pc => {

}
const isPc8 = pc => {

}
const isPostcodeDistrict = {

}
const isFullPostcode = pc => isPc7(pc) || isPc8(pc) || isPostcodeDistrict(pc);
const isPostcode = pc => isFullPostcode(pc)
