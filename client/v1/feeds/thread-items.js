const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');


function ThreadItemsFeed(session, threadId, limit) {
  this.threadId = threadId;
  this.limit = parseInt(limit) || null;
  FeedBase.apply(this, arguments);
}
util.inherits(ThreadItemsFeed, FeedBase);

module.exports = ThreadItemsFeed;
const ThreadItem = require('../thread-item');
const Request = require('../request');


ThreadItemsFeed.prototype.get = function () {
  const that = this;
  return new Request(this.session)
    .setMethod('GET')
    .setResource('threadsShow', {
      cursor: this.getCursor(),
      threadId: this.threadId,
    })
    .send()
    .then((json) => {
      const items = _.map(json.thread.items, item => new ThreadItem(that.session, item));
      that.moreAvailable = json.thread.has_older;
      if (that.isMoreAvailable()) that.setCursor(json.thread.oldest_cursor);
      return items;
    });
};
