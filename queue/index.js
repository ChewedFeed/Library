const bugfixes = require('bugfixes')
const AWS = require('aws-sdk')

class Queue {
  set feedId (feedId) {
    this._feedId = feedId
  }
  get feedId () {
    return this._feedId
  }

  set itemUrl (url) {
    this._itemUrl = url
  }
  get itemUrl () {
    return this._itemUrl
  }

  set queueString (obj) {
    this._queueString = JSON.stringify(obj)
  }
  get queueString () {
    return this._queueString
  }

  set queueTopic (topic) {
    this._queueTopic = topic
  }
  get queueTopic () {
    return this._queueTopic
  }

  addFeedId (callback) {
    this.queueString = {
      feedId: this.feedId
    }
    this.queueTopic = process.env.AWS_SNS_TOPIC_FEEDS

    return this.addToQueue(callback)
  }

  addItem (callback) {
    this.queueString = {
      feedId: this.feedId,
      itemUrl: this.itemUrl,
    }
    this.queueTopic = process.env.AWS_SNS_TOPIC_ITEMS

    return this.addToQueue(callback)
  }

  addToQueue (callback) {
    let self = this

    let sns = new AWS.SNS({
      apiVersion: process.env.AWS_SNS_VERSION
    })

    let obj = {
      feedId: this.feedId,
      itemUrl: this.itemUrl,
    }
    let objString = JSON.stringify(obj)

    sns.publish({
      Message: objString,
      TopicArn: process.env.AWS_SNS_TOPIC_ITEMS
    }, (error, result) => {
      if (error) {
        bugfixes.error('SQS Error', error)

        return callback(error)
      }

      return callback(null, {
        success: true
      })
    })
  }
}

module.exports = Queue
