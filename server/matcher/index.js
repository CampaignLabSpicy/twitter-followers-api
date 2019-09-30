/**
 * Choose Redis or Memory matcher depending on whether Redis is configured.
 */

const getMatcher = () => {
  if (process.env.REDIS_URL) {
    return require('./redis')
  }
  return require('./memory')
}

module.exports = getMatcher()
