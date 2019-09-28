const fs = require('fs')
const path = require('path')

const folders = fs.readdirSync(path.join(__dirname, 'data'))

const knownIds = {}

for (const folder of folders) {
  const files = fs.readdirSync(path.join(__dirname, 'data', folder))
  for (const file of files) {
    const fileContents = fs.readFileSync(path.join(__dirname, 'data', folder, file), 'utf8')
    const lines = fileContents.split(/\r?\n/)
    for (const line of lines) {
      const id = line.trim()
      knownIds[id] = true
    }
  }
}

module.exports = knownIds
