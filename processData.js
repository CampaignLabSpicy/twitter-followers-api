const fs = require('fs')
const path = require('path')

const folders = fs.readdirSync(path.join(__dirname, 'data')).filter(file => file.indexOf('.') === -1)

for (const folder of folders) {
  console.log('Reading', folder)
  const folderPath = path.join(__dirname, 'data', folder)
  const files = fs.readdirSync(folderPath)
  const knownIds = []

  for (const file of files) {
    const fileContents = fs.readFileSync(path.join(__dirname, 'data', folder, file), 'utf8')
    const lines = fileContents.split(/\r?\n/)
    for (const line of lines) {
      const id = line.trim()
      if (id) {
        knownIds.push(id)
      }
    }
  }

  const csvPath = path.join(__dirname, 'data', folder + '_followers.csv')
  console.log('Writing', csvPath)
  fs.writeFileSync(csvPath, knownIds.join('\n'))
}
