const postcodes = require('node-postcodes.io');

const nodePostcodesIoShim = response => response.result;

const lookupPc = async (pc, options = {}) => {
  const result = await postcodes.lookup(pc, options)

  return result
}

const constituencyFromPcioLookup = result => {
  if (result === null || !result.codes || !result.codes.parliamentary_constituency)
    throw new Error ('some kinda error');

  const pcObj = {}
  pcObj [result.codes.parliamentary_constituency] = result.parliamentary_constituency ;
  return pcObj
}

const testPcs = [
  'N4 3DL'
]
//
// testPcs.forEach (pc => {
//   console.log( lookupPc());
// });

let timer = Date.now()
lookupPc ('N4 3DL')
  .then (nodePostcodesIoShim)
  .then (constituencyFromPcioLookup)
  .then (result=> {
    console.log(`${Date.now()-timer}ms:`);
    console.log(result);
  });
