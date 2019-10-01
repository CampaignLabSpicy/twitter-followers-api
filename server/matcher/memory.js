const debug = require('debug')('kyf:matcher:memory')
const fs = require('fs')
const path = require('path')

debug('Loading data')

const dataDir = path.join(__dirname, '..', '..', 'data')
const files = fs.readdirSync(dataDir).filter(file => file.indexOf('.csv') > -1)
const allIds = {}

for (const file of files) {
  const fileContents = fs.readFileSync(path.join(dataDir, file), 'utf8')
  const ids = fileContents.split(/\r?\n/)
  for (const id of ids) {
    if (!allIds[id]) {
      allIds[id] = 0
    }
    allIds[id]++
  }
}
debug('Loaded data')

module.exports = (ids) => ids.filter(id => allIds[id])
