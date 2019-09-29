const getMatcher = () => {
  if (process.env.REDIS_SERVER_URL) {
    return require('./redis')
  }
  return require('./memory')
}

module.exports = getMatcher()
