// TODO: move this file into ../matcher and integrate matchers
const debug = require('debug')('kyf:location.matchers')

const constituencyInfo = require('./testdata/listOfCLPsandPPCs.json')

const officialLabourHandlesFromConstituency = location => {
  if (!location) { return [] }

  const constData = constituencyInfo[location]
  if (!constData) { return [] }

  const handles = []
  let ppc = constData.ppc || []
  let clp = constData.clp || []
  if (!Array.isArray(ppc)) { ppc = [ppc] }
  if (!Array.isArray(clp)) { clp = [clp] }

  handles.push(...ppc)
  handles.push(...clp)
  debug('handles', handles)

  return handles
}

module.exports = { officialLabourHandlesFromConstituency }
