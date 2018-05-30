const bugfixes = require('bugfixes')
const AWS = require('aws-sdk')

class Queue {
  set feedId (feedId) {
    this._feedId = feedId
  }
  get feedId () {
    return this._feedId
  }

  set itemDetails (details) {
    this._itemDetails = details
  }
  get itemDetails () {
    return this._itemDetails
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
    this.itemDetails.feedId = this.feedId

    this.queueString = this.itemDetails
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
