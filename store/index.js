const bugfixes = require('bugfixes')
const uuid = require('uuid/v5')
const AWS = require('aws-sdk')
const moment = require('moment')

class Store {
  set url (url) {
    this._url = url
    this._itemId = uuid(url, uuid.DNS)
  }
  get url () {
    return this._url
  }

  set feedId (feedId) {
    this._feedId = feedId
  }
  get feedId () {
    return this._feedId
  }

  get itemId () {
    return this._itemId
  }

  set title (title) {
    this._title = title
  }
  get title () {
    return this._title
  }

  set imageDetails (details) {
    this._imageDetails = details
  }
  get imageDetails () {
    return this._imageDetails
  }

  cacheCheck (callback) {
    let self = this

    AWS.config.update({
      region: process.env.AWS_DYNAMO_REGION
    })
    const dynamo = new AWS.DynamoDB.DocumentClient({
      apiVersion: process.env.AWS_DYNAMO_VERSION,
      endpoint: process.env.AWS_DYNAMO_ENDPOINT
    })

    let get = {
      TableName: process.env.AWS_DYNAMO_TABLE_FEED_ITEMS,
      Key: {
        itemId: self.itemId
      }
    }
    dynamo.get(get, (error, result) => {
      if (error) {
        bugfixes.error('Store Cache Check', error, get)

        return callback(error)
      }

      if (result.Item) {
        return callback(null, {
          skip: true
        })
      }

      return callback(null, {
        skip: false
      })
    })
  }

  insert (callback) {
    let self = this

    AWS.config.update({
      region: process.env.AWS_DYNAMO_REGION
    })
    const dynamo = new AWS.DynamoDB.DocumentClient({
      apiVersion: process.env.AWS_DYNAMO_VERSION,
      endpoint: process.env.AWS_DYNAMO_ENDPOINT
    })

    let put = {
      TableName: process.env.AWS_DYNAMO_TABLE_FEED_ITEMS,
      Item: {
        title: self.title,
        feedId: self.feedId,
        url: self.url,
        itemId: self.itemId,
        imageDetails: self.imageDetails
      }
    }
    dynamo.put(put, (error, result) => {
      if (error) {
        bugfixes.error('Store Insert', error, put)

        return callback(error)
      }

      return callback(null, {
        success: true
      })
    })
  }

  getFeeds (callback) {
    let self = this

    AWS.config.update({
      region: process.env.AWS_DYNAMO_REGION
    })
    const dynamo = new AWS.DynamoDB.DocumentClient({
      apiVersion: process.env.AWS_DYNAMO_VERSION,
      endpoint: process.env.AWS_DYNAMO_ENDPOINT
    })

    let list = {
      TableName: process.env.AWS_DYNAMO_TABLE_FEEDS
    }
    dynamo.scan(list, (error, result) => {
      if (error) {
        bugfixes.error('Get Feeds', error, list)
      }

      return callback(null, result.Items)
    })
  }
}

module.exports = Store