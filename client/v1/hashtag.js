const urlencode = require('urlencode');
const util = require('util');
const _ = require('lodash');
const camelKeys = require('camelcase-keys');
const Resource = require('./resource');

function Hashtag(session, params) {
  Resource.apply(this, arguments);
}

util.inherits(Hashtag, Resource);
module.exports = Hashtag;

const Request = require('./request');
const Helpers = require('../../helpers');


Hashtag.prototype.parseParams = function (json) {
  const hash = camelKeys(json);
  hash.mediaCount = parseInt(json.media_count);
  if (_.isObject(hash.id)) hash.id = hash.id.toString();
  return hash;
};


Hashtag.search = function (session, query) {
  return session.getAccountId()
    .then((id) => {
      const rankToken = Helpers.buildRankToken(id);
      return new Request(session)
        .setMethod('GET')
        .setResource('hashtagsSearch', {
          query: urlencode(query),
          rankToken,
        })
        .send();
    })
    .then(data => _.map(data.results, hashtag => new Hashtag(session, hashtag)));
};

Hashtag.related = function (session, tag) {
  tag = urlencode(tag);
  return new Request(session)
    .setMethod('GET')
    .setResource('hashtagsRelated', {
      tag,
      visited: `[{"id":"${tag}","type":"hashtag"}]`,
      related_types: '["hashtag"]',
    })
    .send()
    .then(data => _.map(data.related, hashtag => new Hashtag(session, hashtag)));
};

Hashtag.info = function (session, tag) {
  tag = urlencode(tag);
  return new Request(session)
    .setMethod('GET')
    .setResource('hashtagsInfo', {
      tag,
    })
    .send()
    .then(hashtag => new Hashtag(session, hashtag));
};

Hashtag.follow = function (session, tag) {
  tag = urlencode(tag);
  return new Request(session)
    .setUrl(`https://i.instagram.com/api/v1/tags/follow/${tag}/`)
    .setMethod('POST')
    .generateUUID()
    .signPayload()
    .setBodyType('form')
    .send()
};
