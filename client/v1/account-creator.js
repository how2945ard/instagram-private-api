const util = require('util');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const clean = require('underscore.string/clean');
const Resource = require('./resource');
const Helpers = require('../../helpers');


function AccountCreator(session, type) {
  if (!(session instanceof Session)) throw new Error('AccountCreator needs valid session as first argument');
  this.session = session;
  if (!_.includes(['phone', 'email'], type)) throw new Error('AccountCreator class needs either phone or email as type');
  this.type = type;
}


exports.AccountCreator = AccountCreator;

const Exceptions = require('./exceptions');
const QE = require('./qe');
const Relationship = require('./relationship');
const discover = require('./discover');
const Request = require('./request');
const Thread = require('./thread');
var Session = require('./session');
const Account = require('./account');


AccountCreator.prototype.setUsername = function (username) {
  username = username.toLowerCase();
  if (!username || !(/^[a-z0-9\._]{1,50}$/).test(username)) throw new Exceptions.InvalidUsername(username);
  this.username = username;
  return this;
};


AccountCreator.prototype.setName = function (name) {
  this.name = name;
  return this;
};


AccountCreator.prototype.setPassword = function (password) {
  if (!password || password.length < 6) throw new Exceptions.InvalidPassword();
  this.password = password;
  return this;
};


AccountCreator.prototype.checkUsername = function (username) {
  return new Request(this.session)
    .setMethod('POST')
    .setResource('checkUsername')
    .setData({ username })
    .signPayload()
    .send();
};


AccountCreator.prototype.usernameSuggestions = function (username) {
  return new Request(this.session)
    .setMethod('POST')
    .setResource('usernameSuggestions')
    .setData({
      name: username,
    })
    .signPayload()
    .send();
};


AccountCreator.prototype.validateUsername = function () {
  const username = this.username;
  const self = this;
  if (!username) return Promise.reject(new Exceptions.InvalidUsername('Empty'));
  return this.checkUsername(username)
    .then((json) => {
      if (!json.available) throw new Exceptions.InvalidUsername(username, json);
      return true;
    })
    .catch(Exceptions.InvalidUsername, e => self.usernameSuggestions(username)
      .then((json) => {
        e.json.suggestions = json.suggestions;
        throw e;
      }));
};


AccountCreator.prototype.autocomplete = function (account) {
  const session = this.session;
  return QE.sync(session)
    .then(() => {
      const autocomplete = Relationship.autocompleteUserList(session)
        .catch(Exceptions.RequestsLimitError, () => false);
      return [account, autocomplete];
    })
    .spread(account => [account, Thread.recentRecipients(session)])
    .spread(account => [account, discover(session, true)]);
};


AccountCreator.prototype.validate = function () {
  throw new Error('Please override this method in order to validate account');
};


AccountCreator.prototype.create = function () {
  throw new Error('Please override this method in order to register account');
};


AccountCreator.prototype.register = function () {
  const args = _.toArray(arguments);
  const self = this;
  return self.validate()
    .then(() => self.create(...args))
    .then(account => self.autocomplete(account));
};


function AccountPhoneCreator(session) {
  AccountCreator.call(this, session, 'phone');
}

exports.AccountPhoneCreator = AccountPhoneCreator;
util.inherits(AccountPhoneCreator, AccountCreator);

AccountPhoneCreator.prototype.setPhone = function (phone) {
  if (!phone || !(/^([0-9\(\)\/\+ \-]*)$/).test(phone)) throw new Exceptions.InvalidPhone(phone);
  this.phone = phone;
  return this;
};


AccountPhoneCreator.prototype.setPhoneCallback = function (callback) {
  if (!_.isFunction(callback)) throw new Error('Callback must be function which returns promise');
  this.phoneCallback = callback;
  return this;
};


AccountPhoneCreator.prototype.validate = function () {
  if (!this.phoneCallback) throw new Error('You must call `setPhoneCallback` and supply callback');
  return this.validateUsername();
};


AccountPhoneCreator.prototype.create = function () {
  const that = this;
  return new Request(that.session)
    .setMethod('POST')
    .setResource('registrationSMSCode')
    .setData({
      phone_number: that.phone,
    })
    .signPayload()
    .send()
    .then(json => that.phoneCallback())
    .then((code) => {
      if (!_.isString(code) && !_.isNumber(code)) throw new Exceptions.AccountRegistrationError('Code is invalid');
      code = clean(code.toString().trim()).replace(/\s+/, '');
      if (code.toString().length !== 6) throw new Error('Code must be 6 digits number');
      return [new Request(that.session)
        .setMethod('POST')
        .setResource('registrationValidateSMSCode')
        .setData({
          phone_number: that.phone,
          verification_code: code,
        })
        .signPayload()
        .send(), code];
    })
    .spread((json, code) => {
      if (!json.verified) throw new Exceptions.AccountRegistrationError('Code is invalid', json);
      return new Request(that.session)
        .setMethod('POST')
        .setResource('registrationCreateValidated')
        .setData({
          password: that.password,
          username: that.username,
          phone_number: that.phone,
          verification_code: code,
          first_name: that.name,
          force_sign_up_code: '',
          qs_stamp: '',
          phone_id: Helpers.generateUUID(),
          guid: Helpers.generateUUID(),
          waterfall_id: Helpers.generateUUID(),
        })
        .signPayload()
        .send();
    })
    .then((json) => {
      if (!json.account_created) throw new Exceptions.AccountRegistrationError(null, json);
      return new Account(that.session, json.created_user);
    });
};


function AccountEmailCreator(session) {
  AccountCreator.call(this, session, 'email');
}

exports.AccountEmailCreator = AccountEmailCreator;
util.inherits(AccountEmailCreator, AccountCreator);

AccountEmailCreator.prototype.setEmail = function (email) {
  if (!email || !Helpers.validateEmail(email)) throw new Exceptions.InvalidEmail(email);
  this.email = email;
  return this;
};


AccountEmailCreator.prototype.checkEmail = function () {
  return new Request(this.session)
    .setMethod('POST')
    .setResource('checkEmail')
    .setData({
      email: this.email,
      qe_id: Helpers.generateUUID(),
    })
    .signPayload()
    .send();
};


AccountEmailCreator.prototype.validate = function () {
  const email = this.email;
  const validateEmail = _.bind(this.checkEmail, this);
  if (!email || !Helpers.validateEmail(email)) return Promise.reject(new Exceptions.InvalidEmail(email));
  return this.validateUsername()
    .then(() => validateEmail())
    .then((json) => {
      if (!json.available || !json.valid) return Promise.reject(new Exceptions.InvalidEmail(email));
      return true;
    });
};


AccountEmailCreator.prototype.create = function () {
  const uuid = Helpers.generateUUID();
  const guid = Helpers.generateUUID();
  const that = this;
  return new Request(that.session)
    .setMethod('POST')
    .setResource('registrationCreate')
    .setData({
      phone_id: uuid,
      username: that.username,
      first_name: that.name,
      guid,
      email: that.email,
      force_sign_up_code: '',
      qs_stamp: '',
      password: that.password,
    })
    .signPayload()
    .send()
    .then((json) => {
      if (!json.account_created) throw new Exceptions.AccountRegistrationError(null, json);
      return new Account(that.session, json.created_user);
    });
};
