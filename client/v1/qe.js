const util = require('util');
const _ = require('lodash');
const Resource = require('./resource');
const CONSTANTS = require('./constants');


function QE() {
  Resource.apply(this, arguments);
}

util.inherits(QE, Resource);

module.exports = QE;
const Exceptions = require('./exceptions');
const Request = require('./request');

// Lets fake this experiment bullshit
QE.sync = function (session) {
  const random = parseInt(Math.random() * 100) + 1;
  const experiments = _.sampleSize(CONSTANTS.EXPERIMENTS, random);
  return session.getAccountId()
    .then(id => new Request(session)
      .setMethod('POST')
      .setResource('qeSync')
      .generateUUID()
      .setData({
        id,
        _uid: id,
        experiments: experiments.join(','),
      })
      .signPayload()
      .send());
};
