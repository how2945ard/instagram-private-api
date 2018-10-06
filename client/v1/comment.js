const util = require('util');
const _ = require('lodash');
const crypto = require('crypto');
const camelKeys = require('camelcase-keys');
const Resource = require('./resource');

function Comment(session, params) {
  Resource.apply(this, arguments);
}

util.inherits(Comment, Resource);
module.exports = Comment;

const Request = require('./request');
const Account = require('./account');
const Media = require('./media');


Comment.prototype.parseParams = function (json) {
  const hash = camelKeys(json);
  hash.created = json.created_at;
  hash.status = (json.status || 'unknown').toLowerCase();
  hash.id = json.pk || json.id;
  this.account = new Account(this.session, json.user);
  return hash;
};


Comment.prototype.account = function () {
  return this.account;
};


Comment.prototype.getParams = function () {
  return _.defaults({
    account: this.account.params,
  }, this._params);
};


Comment.create = function (session, mediaId, text) {
  return new Request(session)
    .setMethod('POST')
    .setResource('comment', { id: mediaId })
    .generateUUID()
    .setData({
      media_id: mediaId,
      src: 'profile',
      comment_text: text,
      idempotence_token: crypto.createHash('md5').update(text).digest('hex'),
    })
    .signPayload()
    .send()
    .then(data => new Comment(session, data.comment));
};

Comment.delete = function (session, mediaId, commentId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('commentDelete', { id: mediaId, commentId })
    .generateUUID()
    .setData({
      media_id: mediaId,
      src: 'profile',
      idempotence_token: crypto.createHash('md5').update(commentId).digest('hex'),
    })
    .signPayload()
    .send()
    .then(data => data);
};

Comment.bulkDelete = function (session, mediaId, commentIds) {
  return new Request(session)
    .setMethod('POST')
    .setResource('commentBulkDelete', { id: mediaId })
    .generateUUID()
    .setData({
      media_id: mediaId,
      comment_ids_to_delete: commentIds.join(','),
      src: 'profile',
      idempotence_token: crypto.createHash('md5').update(commentIds.join(',')).digest('hex'),
    })
    .signPayload()
    .send()
    .then(data => data);
};
