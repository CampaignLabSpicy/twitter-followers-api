const postcodes = require('node-postcodes.io');


const lookupPc = (pc, options = {}) => {
  const result = await postcodes.lookup(pc, options)
}

const testPcs = [
  'N4 3DL'
]

testPcs.forEach (pc => {
  console.log( lookupPc());
});
