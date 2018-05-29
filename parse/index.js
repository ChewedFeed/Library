const bugfixes = require('bugfixes')
const request = require('request')
const blind = require('blindparser')

class Parse {
  set url (url) {
    this._url = url
  }
  get url () {
    return this._url
  }

  parse (callback) {
    let feedItems = null
    let meta = null

    blind.parseURL(this.url, (error, result) => {
      if (error) {
        return callback('Parser Error', error)
      }

      return callback(null, result)
    })
  }
}

module.exports = Parse
