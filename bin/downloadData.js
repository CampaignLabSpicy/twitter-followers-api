require('dotenv').config()

const debug = require('debug')('kyf:data:download')

const fs = require('fs')
const path = require('path')
const request = require('request')
const tar = require('tar')

const DATA_ARCHIVE_URL = 'https://drive.google.com/uc?export=download&id=1tG1GMWFmD3UUViMLuZO9gPemw2uWcjv5'

const downloadData = async () => {
  const dataDir = path.join(__dirname, '..', 'data')
  const destinationFile = path.join(dataDir, 'follower-ids.tar.gz')
  debug('Downloading follower-ids.tar.gz')
  await downloadFile(DATA_ARCHIVE_URL, destinationFile)
  debug('Extracting CSVs')
  await tar.x({
    file: destinationFile,
    C: dataDir
  })
  debug('Done')
}

const downloadFile = (url, file) => new Promise((resolve, reject) => {
  const writeStream = fs.createWriteStream(file)
  const req = request(url)
  req.on('end', () => resolve())
  req.on('error', (e) => reject(e))
  req.pipe(writeStream)
})

downloadData()
