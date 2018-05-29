const Details = require('./details')
const Parser = require('./parse')
const Queue = require('./queue')

module.exports = {
  details: new Details(),
  parser: new Parser(),
  queue: new Queue()
}