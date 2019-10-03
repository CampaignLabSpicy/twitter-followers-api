const debug = require('debug')('kyf:matcher')

/**
 * Choose Redis or Memory matcher depending on whether Redis is configured.
 */

const getMatcher = () => {
  const dataStorage = process.env.DATA_STORAGE || 'memory'

  debug('Data storage: ' + dataStorage)

  switch (dataStorage) {
    case ('redis'):
      return require('./redis')
    case ('mongodb'):
      return require('./mongodb')
    case ('memory'):
    default:
      return require('./memory')
  }
}

module.exports = getMatcher()
