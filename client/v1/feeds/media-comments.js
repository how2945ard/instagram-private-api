const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');
const Exceptions = require('../exceptions');

function MediaCommentsFeed(session, mediaId, limit) {
  this.mediaId = mediaId;
  this.limit = limit;
  FeedBase.apply(this, arguments);
}
util.inherits(MediaCommentsFeed, FeedBase);

module.exports = MediaCommentsFeed;
const Request = require('../request');
const Comment = require('../comment');


MediaCommentsFeed.prototype.getCursor = function () {
  if (typeof this.cursor === 'string') {
    this.cursor = JSON.parse(this.cursor);
  }

  return this.cursor ? this.cursor.server_cursor : this.cursor;
};

MediaCommentsFeed.prototype.get = function () {
  const that = this;
  return new Request(that.session)
    .setMethod('GET')
    .setResource('mediaComments', {
      mediaId: that.mediaId,
      maxId: that.getCursor(),
    })
    .send()
    .then((data) => {
      that.moreAvailable = data.has_more_comments && !!data.next_max_id;
      if (that.moreAvailable) {
        that.setCursor(data.next_max_id);
      }
      return _.map(data.comments, (comment) => {
        comment.pk = comment.pk.c.join('');
        comment.media_id = that.mediaId;
        return new Comment(that.session, comment);
      });
    })
    .catch((reason) => {
      if (reason.json.message === 'Media is unavailable') throw new Exceptions.MediaUnavailableError();
      else throw reason;
    });
};
