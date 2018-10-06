const util = require('util');
const _ = require('lodash');
const Resource = require('./resource');

function Megaphone() {
  Resource.apply(this, arguments);
}

util.inherits(Megaphone, Resource);
const Request = require('./request');

module.exports = Megaphone;
const Exceptions = require('./exceptions');


Megaphone.log = function (session, data) {
  return new Request(session)
    .setMethod('POST')
    .setResource('megaphoneLog')
    .generateUUID()
    .setData(_.extend(data, {
      uuid: session.device.md5,
    }));
};

Megaphone.logSeenMainFeed = function (session) {
  return Megaphone.log(session, {
    action: 'seen',
    display_medium: 'main_feed',
    type: 'feed_aysf',
  });
};
