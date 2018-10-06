const util = require('util');
const _ = require('lodash');
const Resource = require('./resource');


function Save(session, params) {
  Resource.apply(this, arguments);
}

module.exports = Save;
util.inherits(Save, Resource);

const Request = require('./request');


Save.prototype.parseParams = function (json) {
  return json || {};
};


Save.create = function (session, mediaId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('save', { id: mediaId })
    .generateUUID()
    .setData({
      media_id: mediaId,
      src: 'profile',
    })
    .signPayload()
    .send()
    .then(data => new Save(session, {}));
};

Save.destroy = function (session, mediaId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('unsave', { id: mediaId })
    .generateUUID()
    .setData({
      media_id: mediaId,
      src: 'profile',
    })
    .signPayload()
    .send()
    .then(data => new Save(session, {}));
};
