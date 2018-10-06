const util = require('util');
const fs = require('fs');
const _ = require('lodash');
const request = require('request-promise');
const Resource = require('./resource');
const CookieStorage = require('./cookie-storage');
const RequestJar = require('./jar');

function Session(device, storage, proxy) {
  this.setDevice(device);
  this.setCookiesStorage(storage);
  if (_.isString(proxy) && !_.isEmpty(proxy)) this.proxyUrl = proxy;
}

util.inherits(Session, Resource);
module.exports = Session;

const CONSTANTS = require('./constants');
const Account = require('./account');
const Exceptions = require('./exceptions');
const Request = require('./request');
const Device = require('./device');
const QE = require('./qe');
const Megaphone = require('./megaphone');
const Timeline = require('./feeds/timeline-feed');
const Inbox = require('./feeds/inbox');
const Thread = require('./thread');
const Relationship = require('./relationship');
const Helpers = require('../../helpers');

Object.defineProperty(Session.prototype, 'jar', {
  get() { return this._jar; },
  set(val) {},
});


Object.defineProperty(Session.prototype, 'cookieStore', {
  get() { return this._cookiesStore; },
  set(val) {},
});


Object.defineProperty(Session.prototype, 'device', {
  get() { return this._device; },
  set(val) {},
});


Object.defineProperty(Session.prototype, 'CSRFToken', {
  get() {
    const cookies = this.jar.getCookies(CONSTANTS.HOST);
    const item = _.find(cookies, { key: 'csrftoken' });
    return item ? item.value : 'missing';
  },
  set(val) {},
});

Object.defineProperty(Session.prototype, 'proxyUrl', {
  get() {
    return this._proxyUrl;
  },
  set(val) {
    if (!Helpers.isValidUrl(val) && val !== null) throw new Error('`proxyUrl` argument is not an valid url');
    this._proxyUrl = val;
  },
});


Session.prototype.setCookiesStorage = function (storage) {
  if (!(storage instanceof CookieStorage)) throw new Error('`storage` is not an valid instance of `CookieStorage`');
  this._cookiesStore = storage;
  this._jar = new RequestJar(storage.store);
  return this;
};


Session.prototype.setDevice = function (device) {
  if (!(device instanceof Device)) throw new Error('`device` is not an valid instance of `Device`');
  this._device = device;
  return this;
};


Session.prototype.getAccountId = function () {
  const that = this;
  return this._cookiesStore.getSessionId()
    .then(() => that._cookiesStore.getAccountId());
};


Session.prototype.setProxy = function (url) {
  this.proxyUrl = url;
  return this;
};


Session.prototype.getAccount = function () {
  const that = this;
  return that.getAccountId()
    .then(id => Account.getById(that, id));
};


Session.prototype.destroy = function () {
  const that = this;
  return new Request(this)
    .setMethod('POST')
    .setResource('logout')
    .generateUUID()
    .send()
    .then((response) => {
      that._cookiesStore.destroy();
      delete that._cookiesStore;
      return response;
    });
};


Session.login = function (session, username, password) {
  return new Request(session)
    .setResource('login')
    .setMethod('POST')
    .generateUUID()
    .setData({
      username,
      password,
      login_attempt_count: 0,
    })
    .signPayload()
    .send()
    .catch((error) => {
      if (error.name == 'RequestError' && _.isObject(error.json)) {
        if (error.json.invalid_credentials) throw new Exceptions.AuthenticationError(error.message);
        if (error.json.error_type === 'inactive user') throw new Exceptions.AccountBanned(`${error.json.message} ${error.json.help_url}`);
      }
      throw error;
    })
    .then(() => [session, QE.sync(session)])
    .spread((session) => {
      const autocomplete = Relationship.autocompleteUserList(session)
        .catch(Exceptions.RequestsLimitError, () => false);
      return [session, autocomplete];
    })
    .spread(session => [session, new Timeline(session).get()])
    .spread(session => [session, Thread.recentRecipients(session)])
    .spread(session => [session, new Inbox(session).get()])
    .spread(session => [session, Megaphone.logSeenMainFeed(session)])
    .spread(session => session)
    .catch(Exceptions.CheckpointError, error => session.getAccountId()
      .then(() => session)
      .catch(Exceptions.CookieNotValidError, (e) => {
        throw error;
      }));
};

Session.create = function (device, storage, username, password, proxy) {
  const that = this;
  const session = new Session(device, storage);
  if (_.isString(proxy) && !_.isEmpty(proxy)) session.proxyUrl = proxy;
  return session.getAccountId()
    .then(() => session)
    .catch(Exceptions.CookieNotValidError, () => Session.login(session, username, password));
};
