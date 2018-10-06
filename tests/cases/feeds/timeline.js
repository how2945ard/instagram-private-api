const should = require('should');
const Promise = require('bluebird');
const path = require('path');
const mkdirp = require('mkdirp');
const inquirer = require('inquirer');
const _ = require('lodash');
const fs = require('fs');
const Client = require('../../../client/v1');

describe('`Timeline` class', () => {
  let feed; let
    session;

  before(() => {
    session = require('../../run').session;
    feed = new Client.Feed.Timeline(session);
  });

  it('should not be problem to get timeline feed', (done) => {
    const originalCursor = feed.getCursor();
    feed.get().then((media) => {
      media.should.not.be.empty();
      _.each(media, (medium) => {
        medium.should.be.instanceOf(Client.Media);
      });
      should(originalCursor).should.not.equal(feed.getCursor());
      feed.moreAvailable.should.be.Boolean();
      feed.moreAvailable.should.equal(true);
      done();
    });
  });
});
