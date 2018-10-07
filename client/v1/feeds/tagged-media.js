const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');

function TaggedMediaFeed(session, tag, limit) {
  this.tag = tag;
  this.limit = parseInt(limit) || null;
  FeedBase.apply(this, arguments);
}
util.inherits(TaggedMediaFeed, FeedBase);

module.exports = TaggedMediaFeed;
const Media = require('../media');
const Request = require('../request');
const Helpers = require('../../../helpers');
const Exceptions = require('../exceptions');

TaggedMediaFeed.prototype.get = function () {
  const that = this;
  return this.session.getAccountId()
    .then((id) => {
      const rankToken = Helpers.buildRankToken(id);
      return new Request(that.session)
        .setMethod('GET')
        .setResource('tagFeed', {
          tag: that.tag,
          maxId: that.getCursor(),
          rankToken,
        })
        .send()
        .then((data) => {
          that.moreAvailable = data.more_available && !!data.next_max_id;
          if (!that.moreAvailable && !_.isEmpty(data.ranked_items) && !that.getCursor()) {
            return false;
          }
          if (!that.moreAvailable) {
            return false;
          }
          if (that.moreAvailable) {
            that.setCursor(data.next_max_id);
          }
          return _.map(data.items, medium => new Media(that.session, medium));
        });
    });
};


function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

const markStoriesAsSeen = function (session, stories, sourceID, id) {
  const reels = {};
  seenAt = Math.floor(new Date() / 1000) - 30;
  _.forEach(stories, (story) => {
    if (story.taken_at > seenAt) {
      seenAt = story.taken_at + 2;
    }
    if (seenAt > Math.floor(new Date() / 1000)) {
      seenAt = Math.floor(new Date() / 1000);
    }
    seenAt += getRandomArbitrary(1, 3);
    reels[`${story.pk}_${story.user.pk}_${sourceID}`] = [`${story.taken_at}_${seenAt}`];
  });
  const url = 'https://i.instagram.com/api/v2/media/seen/?reel=1&live_vod=0';
  return new Request(session)
    .setUrl(url)
    .setMethod('POST')
    .generateUUID()
    .setData({ reels, live_vods: [], _uid: id })
    .signPayload()
    .setBodyType('form')
    .send()
    .catch(error => console.error(error.message));
};

TaggedMediaFeed.prototype.getStory = function () {
  const that = this;
  return this.session.getAccountId()
    .then((id) => {
      const rankToken = Helpers.buildRankToken(id);
      return new Request(that.session)
        .setMethod('GET')
        .setResource('tagFeed', {
          tag: that.tag,
          maxId: that.getCursor(),
          rankToken,
        })
        .send()
        .then((data) => {
          if (!data.story) {
            return [];
          }
          return markStoriesAsSeen(that.session, data.story.items, data.story.id, id)
            .then(() => _.map(data.story.items, medium => medium));
        });
    });
};
