const _ = require('lodash');

function StoryTray(session) {
  this.session = session;
}

module.exports = StoryTray;
const Request = require('../request');
const Helpers = require('../../../helpers');
const Media = require('../media');

StoryTray.prototype.get = function () {
  const that = this;
  return new Request(that.session)
    .setMethod('GET')
    .setResource('storyTray')
    .send()
    .then((data) => {
      const media = _.map(data.items, medium => new Media(that.session, medium));
      return media;
    });
};
