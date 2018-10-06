const should = require('should');
const Promise = require('bluebird');
const path = require('path');
const mkdirp = require('mkdirp');
const inquirer = require('inquirer');
const _ = require('lodash');
const fs = require('fs');
const Client = require('../../../client/v1');


describe('`TaggedMedia` class', () => {
  let feed; let
    session;

  before(() => {
    // https://github.com/huttarichard/instagram-private-api/issues/23
    session = require('../../run').session;
    feed = new Client.Feed.TaggedMedia(session, 'форумтаврида');
  });

  it('should not be problem to get media', (done) => {
    const originalCursor = feed.getCursor();
    feed.get().then((media) => {
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
