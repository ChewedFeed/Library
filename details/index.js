const bugfixes = require('bugfixes')
const AWS = require('aws-sdk')
const uuid = require('uuid/v5')
const moment = require('moment')

const Queue = require('../queue')

const bugfunctions = bugfixes.functions

class Details {
  set url (url) {
    this._url = url
  }
  get url () {
    return this._url
  }

  set id (id) {
    this._id = id
  }
  get id () {
    return this._id
  }

  set title (title) {
    this._title = title
  }
  get title () {
    return this._title
  }

  set lastUpdated (lastUpdated) {
    this._lastUpdated = lastUpdated
  }
  get lastUpdated () {
    return this._lastUpdated
  }

  checkInCache (callback) {
    let self = this

    AWS.config.update({
      region: process.env.AWS_DYNAMO_REGION
    })
    const dynamo = new AWS.DynamoDB.DocumentClient({
      apiVersion: process.env.AWS_DYNAMO_VERSION,
      endpoint: process.env.AWS_DYNAMO_ENDPOINT
    })

    let scan = {
      TableName: process.env.AWS_DYNAMO_TABLE_FEEDS,
      ExpressionAttributeNames: {
        '#url': 'url',
        '#id': 'feedId'
      },
      ExpressionAttributeValues: {
        ':url': self.url
      },
      FilterExpression: '#url = :url',
      ProjectionExpression: '#id'
    }

    dynamo.scan(scan, (error, result) => {
      if (error) {
        bugfixes.info('Details Cache Check', error, scan)

        return callback(error)
      }

      if (result.Items[0]) {
        if (result.Items[0].feedId) {
          return callback(null, {
            inCache: true
          })
        }
      }

      return callback(null, {
        inCache: false
      })
    })
  }

  add (callback) {
    let self = this
    let feedId = uuid(self.url, uuid.DNS)

    AWS.config.update({
      region: process.env.AWS_DYNAMO_REGION
    })
    const dynamo = new AWS.DynamoDB.DocumentClient({
      apiVersion: process.env.AWS_DYNAMO_VERSION,
      endpoint: process.env.AWS_DYNAMO_ENDPOINT
    })

    let put = {
      TableName: process.env.AWS_DYNAMO_TABLE_FEEDS,
      Item: {
        url: self.url,
        title: self.title,
        feedId: feedId
      }
    }

    dynamo.put(put, (error, result) => {
      if (error) {
        bugfixes.error('Details Add', error, put)

        return callback(error)
      }

      const queue = new Queue()
      queue.feedId = feedId
      queue.addFeedId((error, result) => {
        if (error) {
          return callback(null, bugfunctions.lambdaError(101, {
            success: false,
            error: error
          }))
        }

        return callback(null, bugfunctions.lambdaResult(102, {
          success: true
        }))
      })
    })
  }

  getFeed (callback) {
    let self = this

    AWS.config.update({
      region: process.env.AWS_DYNAMO_REGION
    })
    const dynamo = new AWS.DynamoDB.DocumentClient({
      apiVersion: process.env.AWS_DYNAMO_VERSION,
      endpoint: process.env.AWS_DYNAMO_ENDPOINT
    })

    let get = {
      TableName: process.env.AWS_DYNAMO_TABLE_FEEDS,
      Key: {
        feedId: self.feedId
      }
    }

    dynamo.get(get, (error, result) => {
      if (error) {
        bugfixes.error('Get Feed', error, get)

        return callback(error)
      }

      let resultSet = {
        url: result.Item.url,
        format: result.Item.format,
        skip: false,
        success: true
      }

      let timecheck = 3600
      if (bugfunctions.checkIfDefined(process.env.TIME_CHECK)) {
        timecheck = process.env.TIME_CHECK
      }

      if (result.Item.lastUpdated) {
        if (result.Item.lastUpdated < (moment().unix() - timecheck)) {
          resultSet.skip = true
        }
      }

      return callback(null, resultSet)
    })
  }

  update (callback) {
    let self = this

    AWS.config.update({
      region: process.env.AWS_DYNAMO_REGION
    })
    const dynamo = new AWS.DynamoDB.DocumentClient({
      apiVersion: process.env.AWS_DYNAMO_VERSION,
      endpoint: process.env.AWS_DYNAMO_ENDPOINT
    })

    let update = {
      TableName: process.env.AWS_DYNAMO_TABLE_FEEDS,
      Key: {
        feedId: self.feedId
      },
      ConditionExpression: '#feedId = :feedId',
      UpdateExpression: 'SET #lastUpdated = :lastUpdated',
      ExpressionAttributeNames: {
        '#lastUpdated': 'lastUpdated',
        '#feedId': 'feedId'
      },
      ExpressionAttributeValues: {
        ':lastUpdated': moment().unix(),
        ':feedId': self.feedId
      }
    }

    dynamo.update(update, (error, result) => {
      if (error) {
        bugfixes.error('Details Update', error, update)

        return callback(error)
      }

      return callback(null, {
        success: true
      })
    })
  }
}

module.exports = Details
