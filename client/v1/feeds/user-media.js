const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');

function UserMediaFeed(session, accountId, limit) {
  this.accountId = accountId;
  this.timeout = 10 * 60 * 1000; // 10 minutes
  this.limit = limit;
  FeedBase.apply(this, arguments);
}
util.inherits(UserMediaFeed, FeedBase);

module.exports = UserMediaFeed;
const Media = require('../media');
const Request = require('../request');
const Helpers = require('../../../helpers');
const Account = require('../account');


UserMediaFeed.prototype.get = function () {
  const that = this;
  return this.session.getAccountId()
    .then((id) => {
      const rankToken = Helpers.buildRankToken(id);
      return new Request(that.session)
        .setMethod('GET')
        .setResource('userFeed', {
          id: that.accountId,
          maxId: that.getCursor(),
          rankToken,
        })
        .send()
        .then((data) => {
          that.moreAvailable = data.more_available;
          const lastOne = _.last(data.items);
          if (that.moreAvailable && lastOne) that.setCursor(lastOne.id);
          return _.map(data.items, medium => new Media(that.session, medium));
        });
    });
};
