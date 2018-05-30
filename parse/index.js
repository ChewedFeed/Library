const bugfixes = require('bugfixes')
const blind = require('blindparser')
const moment = require('moment')

const Store = require('../store')
const Details = require('../details')
const Queue = require('../queue')

class Parse {
  set url (url) {
    this._url = url
  }
  get url () {
    return this._url
  }

  set format (format) {
    this._format = format
  }
  get format () {
    return this._format
  }

  set feedId (feedId) {
    this._feedId = feedId
  }
  get feedId () {
    return this._feedId
  }

  parse (callback) {
    let feedItems = null
    let meta = null
    let self = this

    blind.parseURL(this.url, (error, result) => {
      if (error) {
        bugfixes.error('Parser Error', error, self)
        return callback(error)
      }

      meta = result.metadata
      let preDate = meta.lastBuildDate
      if (preDate) {
        let date = moment(preDate).unix()
        result.metadata.lastUpdated = date
      }

      return callback(null, result)
    })
  }

  item (item, callback) {
    let store = new Store()

    let Formatter = null
    switch (this.format) {
      case 'bbc': {
        Formatter = require('./bbc')
        break
      }
      case 'guardian': {
        Formatter = require('./guardian')
        break
      }

      default: {
        Formatter = require('./generic')
        break
      }
    }

    let format = new Formatter()
    format.format(item)

    let queue = new Queue()
    queue.feedId = this.feedId
    queue.itemDetails = {
      url: format.url,
      title: format.title,
      imageDetails: {
        url: format.image,
        width: format.imageWidth,
        height: format.imageHeight
      }
    }
    queue.addItem((error, result) => {
      if (error) {
        bugfixes.error('Queue Item', error)

        return callback(error)
      }

      return callback(null, {
        success: true
      })
    })
  }

  items (items, callback) {
    for (let i = 0; i < items.length; i++) {
      this.item(items[i], (error, result) => {
        if (error) {
          return callback(error)
        }
      })
    }

    let details = new Details()
    details.feedId = this.feedId
    details.update((error, result) => {
      if (error) {
        return callback(error)
      }

      return callback(null, {
        success: true
      })
    })
  }
}

module.exports = Parse
