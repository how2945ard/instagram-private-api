const util = require('util');
const _ = require('lodash');
const Resource = require('./resource');


function Like(session, params) {
  Resource.apply(this, arguments);
}

module.exports = Like;
util.inherits(Like, Resource);

const Request = require('./request');


Like.prototype.parseParams = function (json) {
  return json || {};
};


Like.create = function (session, mediaId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('like', { id: mediaId })
    .generateUUID()
    .setData({
      media_id: mediaId,
      src: 'profile',
    })
    .signPayload()
    .send()
    .then(data => new Like(session, {}));
};

Like.destroy = function (session, mediaId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('unlike', { id: mediaId })
    .generateUUID()
    .setData({
      media_id: mediaId,
      src: 'profile',
    })
    .signPayload()
    .send()
    .then(data => new Like(session, {}));
};
