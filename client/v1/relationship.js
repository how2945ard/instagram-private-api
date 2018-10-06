const util = require('util');
const _ = require('lodash');
const Resource = require('./resource');

function Relationship(session, params) {
  Resource.apply(this, arguments);
}

util.inherits(Relationship, Resource);
module.exports = Relationship;
const Request = require('./request');
const Account = require('./account');
const Exceptions = require('./exceptions');

Relationship.prototype.setAccountId = function (accountId) {
  this.accountId = parseInt(accountId);
};


Relationship.prototype.getParams = function () {
  return _.defaults({
    accountId: this.accountId,
  }, this._params);
};


Relationship.get = function (session, accountId) {
  return new Request(session)
    .setMethod('GET')
    .setResource('friendshipShow', { id: accountId })
    .send()
    .then((data) => {
      const relationship = new Relationship(session, data);
      relationship.setAccountId(accountId);
      return relationship;
    });
};


Relationship.pendingFollowers = function (session) {
  return new Request(session)
    .setMethod('GET')
    .setResource('friendshipPending')
    .generateUUID()
    .signPayload()
    .send()
    .then(data => _.map(data.users, (data, key) => {
      const relationship = new Relationship(session, data);
      relationship.setAccountId(data.pk);
      return relationship;
    }));
};


Relationship.prototype.approvePending = function () {
  return Relationship.approvePending(this.session, this.accountId);
};
Relationship.approvePending = function (session, accountId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('friendshipPendingApprove', { id: accountId })
    .setData({
      user_id: accountId,
    })
    .generateUUID()
    .signPayload()
    .send();
};


Relationship.getMany = function (session, accountIds) {
  return new Request(session)
    .setMethod('POST')
    .generateUUID()
    .setData({ user_ids: accountIds.join(',') })
    .setResource('friendshipShowMany')
    .send()
    .then(data => _.map(data.friendship_statuses, (data, key) => {
      const relationship = new Relationship(session, data);
      relationship.setAccountId(key);
      return relationship;
    }));
};


Relationship.create = function (session, accountId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('follow', { id: accountId })
    .generateUUID()
    .setData({ user_id: accountId })
    .signPayload()
    .send()
    .then((data) => {
      const relationship = new Relationship(session, data.friendship_status);
      relationship.setAccountId(accountId);
      return relationship;
    })
    .catch((err) => {
      if (err instanceof Exceptions.RequestError && err.message.indexOf('following the max limit') !== -1) {
        throw new Exceptions.TooManyFollowsError();
      } else {
        throw err;
      }
    });
};


Relationship.destroy = function (session, accountId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('unfollow', { id: accountId })
    .generateUUID()
    .setData({ user_id: accountId })
    .signPayload()
    .send()
    .then((data) => {
      const relationship = new Relationship(session, data.friendship_status);
      relationship.setAccountId(accountId);
      return relationship;
    });
};


Relationship.autocompleteUserList = function (session) {
  return new Request(session)
    .setMethod('GET')
    .setResource('autocompleteUserList')
    .send()
    .then((json) => {
      json.accounts = _.map(json.users, account => new Account(session, account));
      json.expires = parseInt(json.expires * 1000);
      return json;
    });
};

Relationship.block = function (session, accountId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('block', { id: accountId })
    .generateUUID()
    .setData({ user_id: accountId })
    .signPayload()
    .send()
    .then((data) => {
      const relationship = new Relationship(session, data.friendship_status);
      relationship.setAccountId(accountId);
      return relationship;
    });
};

Relationship.prototype.block = function () {
  return Relationship.block(this.session, this.accountId);
};

Relationship.unblock = function (session, accountId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('unblock', { id: accountId })
    .generateUUID()
    .setData({ user_id: accountId })
    .signPayload()
    .send()
    .then((data) => {
      const relationship = new Relationship(session, data.friendship_status);
      relationship.setAccountId(accountId);
      return relationship;
    });
};

Relationship.prototype.unblock = function () {
  return Relationship.unblock(this.session, this.accountId);
};
