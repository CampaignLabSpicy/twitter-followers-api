require('dotenv').config()

/**
 * Code to combine all the follower lists in the data directory into a single CSV for each account.
 */

const debug = require('debug')('kyf:data:process')

const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '..', 'data')
const folders = fs.readdirSync(dataPath).filter(file => file.indexOf('.') === -1)

for (const folder of folders) {
  debug('Reading', folder)
  const folderPath = path.join(dataPath, folder)
  const files = fs.readdirSync(folderPath)
  const knownIds = []

  for (const file of files) {
    const fileContents = fs.readFileSync(path.join(folderPath, file), 'utf8')
    const lines = fileContents.split(/\r?\n/)
    for (const line of lines) {
      const id = line.trim()
      if (id) {
        knownIds.push(id)
      }
    }
  }

  const csvPath = path.join(dataPath, folder + '_followers.csv')
  debug('Writing', csvPath)
  fs.writeFileSync(csvPath, knownIds.join('\n'))
}
