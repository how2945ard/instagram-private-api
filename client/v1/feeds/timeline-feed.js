const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');

function TimelineFeed(session, limit) {
  this.limit = parseInt(limit) || null;
  FeedBase.apply(this, arguments);
}
util.inherits(TimelineFeed, FeedBase);

module.exports = TimelineFeed;
const Request = require('../request');
const Helpers = require('../../../helpers');
const Media = require('../media');


TimelineFeed.prototype.get = function () {
  const that = this;
  return this.session.getAccountId()
    .then((id) => {
      const rankToken = Helpers.buildRankToken(id);
      return new Request(that.session)
        .setMethod('GET')
        .setResource('timelineFeed', {
          maxId: that.getCursor(),
          rankToken,
        })
        .send();
    })
    .then((data) => {
      that.moreAvailable = data.more_available;
      const media = _.compact(_.map(data.feed_items, (item) => {
        const medium = item.media_or_ad;
        if (!medium || medium.injected) return false;
        return new Media(that.session, medium);
      }));
      if (that.moreAvailable) that.setCursor(data.next_max_id);
      return media;
    });
};
