const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');

function SelfLikedFeed(session, limit) {
  this.session = session;
  this.limit = parseInt(limit) || null;
  FeedBase.apply(this, arguments);
}
util.inherits(SelfLikedFeed, FeedBase);

module.exports = SelfLikedFeed;
const Media = require('../media');
const Request = require('../request');


SelfLikedFeed.prototype.get = function () {
  const that = this;
  return new Request(that.session)
    .setMethod('GET')
    .setResource('selfLikedFeed', {
      maxId: that.getCursor(),
    })
    .send()
    .then((data) => {
      const nextMaxId = data.next_max_id ? data.next_max_id.toString() : data.next_max_id;
      that.moreAvailable = data.more_available && !!nextMaxId;
      if (that.moreAvailable) that.setCursor(nextMaxId);
      return _.map(data.items, medium => new Media(that.session, medium));
    });
};
