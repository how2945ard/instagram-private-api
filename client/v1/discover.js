const _ = require('lodash');
const Request = require('./request');
const Helpers = require('../../helpers');
const Media = require('./media');
const Account = require('./account');

module.exports = function (session, inSingup) {
  return new Request(session)
    .setMethod('POST')
    .setResource('discoverAyml')
    .generateUUID()
    .setData({
      phone_id: Helpers.generateUUID(),
      in_signup: inSingup ? 'true' : 'false',
      module: 'discover_people',
    })
    .send()
    .then((json) => {
      const items = _.property('suggested_users.suggestions')(json) || [];
      return _.map(items, item => ({
        account: new Account(session, item.user),
        mediaIds: item.media_ids,
      }));
    });
};
