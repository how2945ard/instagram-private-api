const util = require('util');
const Promise = require('bluebird');
const _ = require('lodash');
const CONSTANTS = require('./constants');


function CookieStorage(cookieStorage) {
  this.storage = cookieStorage;
}


Object.defineProperty(CookieStorage.prototype, 'store', {
  get() { return this.storage; },
  set(val) {},
});


const Exceptions = require('./exceptions');

module.exports = CookieStorage;


CookieStorage.prototype.getCookieValue = function (name) {
  const self = this;
  return new Promise(((resolve, reject) => {
    self.storage.findCookie(CONSTANTS.HOSTNAME, '/', name, (err, cookie) => {
      if (err) return reject(err);
      if (!_.isObject(cookie)) return reject(new Exceptions.CookieNotValidError(name));
      resolve(cookie);
    });
  }));
};


CookieStorage.prototype.putCookie = function (cookie) {
  const args = _.toArray(arguments);
  const self = this;
  return new Promise(((resolve, reject) => {
    self.storage.putCookie(cookie, resolve);
  }));
};


CookieStorage.prototype.getCookies = function () {
  const self = this;
  return new Promise(((resolve, reject) => {
    self.storage.findCookies(CONSTANTS.HOSTNAME, '/', (err, cookies) => {
      if (err) return reject(err);
      resolve(cookies || []);
    });
  }));
};


CookieStorage.prototype.getAccountId = function () {
  const self = this;
  return this.getCookieValue('ds_user_id')
    .then((cookie) => {
      const id = parseInt(cookie.value);
      if (_.isNumber(id) && !_.isNaN(id)) {
        return id;
      }
      throw new Exceptions.CookieNotValidError('ds_user_id');
    });
};


CookieStorage.prototype.getSessionId = function () {
  const currentTime = new Date().getTime();
  return this.getCookieValue('sessionid')
    .then((cookie) => {
      const acceptable = cookie.expires instanceof Date && cookie.expires.getTime() > currentTime;
      if (acceptable) return cookie.value;
      throw new Exceptions.CookieNotValidError('sessionid');
    });
};


CookieStorage.prototype.removeCheckpointStep = function () {
  const self = this;
  return new Promise(((resolve, reject) => {
    self.storage.removeCookie(CONSTANTS.HOSTNAME, '/', 'checkpoint_step', (err) => {
      if (err) return reject(err);
      resolve();
    });
  }));
};


CookieStorage.prototype.destroy = function () {
  throw new Error('Mehtod destroy is not implemented');
};
