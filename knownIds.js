const fs = require('fs')
const path = require('path')

const files = fs.readdirSync(path.join(__dirname, 'data')).filter(file => file.indexOf('.') > -1)
const allIds = {}

for (const file of files) {
  const fileContents = fs.readFileSync(path.join(__dirname, 'data', file), 'utf8')
  const ids = fileContents.split(/\r?\n/)
  for (const id of ids) {
    if (!allIds[id]) {
      allIds[id] = 0
    }
    allIds[id]++
  }
}

module.exports = allIds
