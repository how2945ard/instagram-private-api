const should = require('should');
const Promise = require('bluebird');
const path = require('path');
const mkdirp = require('mkdirp');
const inquirer = require('inquirer');
const _ = require('lodash');
const fs = require('fs');
const Client = require('../../../client/v1');


describe('`AccountFollowing` class', () => {
  let feed; let
    session;

  before(() => {
    session = require('../../run').session;
    feed = new Client.Feed.AccountFollowing(session, '193860719');
  });

  it('should not be problem to get followings', (done) => {
    const originalCursor = feed.getCursor();
    feed.get().then((data) => {
      _.each(data, (account) => {
        account.should.be.instanceOf(Client.Account);
      });
      should(originalCursor).should.not.equal(feed.getCursor());
      feed.moreAvailable.should.be.Boolean();
      feed.moreAvailable.should.equal(false);
      done();
    });
  });
});
