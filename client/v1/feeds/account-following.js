const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');

function AccountFollowingFeed(session, accountId, limit) {
  this.accountId = accountId;
  this.limit = limit || 7500;
  // Should be enought for 7500 records
  this.timeout = 10 * 60 * 1000;
  FeedBase.apply(this, arguments);
}
util.inherits(AccountFollowingFeed, FeedBase);

module.exports = AccountFollowingFeed;
const Request = require('../request');
const Helpers = require('../../../helpers');
const Account = require('../account');

AccountFollowingFeed.prototype.get = function () {
  const that = this;
  return new Request(that.session)
    .setMethod('GET')
    .setResource('followingFeed', {
      id: that.accountId,
      maxId: that.getCursor(),
      rankToken: Helpers.generateUUID(),
    })
    .send()
    .then((data) => {
      that.moreAvailable = !!data.next_max_id;
      if (that.moreAvailable) that.setCursor(data.next_max_id);
      return _.map(data.users, user => new Account(that.session, user));
    });
};
