const Helpers = {};
const fs = require('fs');
const path = require('path');
const touch = require('touch');
const isStream = require('is-stream');
const validUrl = require('valid-url');
const _ = require('lodash');

const emailTester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-?\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;


Helpers.validateEmail = function (email) {
  if (!email) return false;
  if (email.length > 254) return false;
  const valid = emailTester.test(email);
  if (!valid) return false;
  const parts = email.split('@');
  if (parts[0].length > 64) return false;
  const domainParts = parts[1].split('.');
  if (domainParts.some(part => part.length > 63)) return false;
  return true;
};

Helpers.generateUUID = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0; const
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).toLowerCase();
};

Helpers.getRandomArbitrary = function (min, max) {
  return Math.random() * (max - min) + min;
};


Helpers.buildRankToken = function (accountId) {
  return `${accountId}_${Helpers.generateUUID()}`;
};


Helpers.isValidUrl = validUrl.isUri;


Helpers.ensureExistenceOfJSONFilePath = function (path) {
  try {
    touch.sync(path);
    JSON.parse(fs.readFileSync(path));
  } catch (e) {
    fs.unlinkSync(path);
  }
  touch.sync(path);
};


Helpers.resolveDirectoryPath = function (directory) {
  directory = path.resolve(directory);
  if (!fs.statSync(directory).isDirectory()) throw new Error(`Path \`${directory}\` is not directory!`);
  return directory;
};

Helpers.fileExists = function (path) {
  try {
    return fs.statSync(path).isFile();
  } catch (e) {
    return false;
  }
};

Helpers.pathToStream = function (streamOrPath) {
  const stream = _.isString(streamOrPath) ?
    fs.createReadStream(path.resolve(streamOrPath)) :
    streamOrPath;
  if (!isStream(stream)) throw new Error('Argument is not posible to convert to stream!');
  return stream;
};

Helpers.pathToBuffer = function (bufferOrPath) {
  return new Promise(((resolve) => {
    if (!_.isString(bufferOrPath)) {
      return callback(null, bufferOrPath);
    }
    fs.readFile(path.resolve(bufferOrPath), callback);


    function callback(err, buffer) {
      if (err) throw err;
      if (!Buffer.isBuffer(buffer)) throw new Error('Argument is not posible to convert to buffer!');
      return resolve(buffer);
    }
  }));
};

Helpers.isStream = function (stream) {
  return isStream(stream);
};

Helpers.dataToRequestOption = function (data, filename) {
  let raw; let
    options = {};
  if (_.isString(filename)) options.filename = filename;
  if (data instanceof Buffer) {
    raw = data;
  } else if (isStream(data)) {
    raw = data;
  } else if (_.isString(data)) {
    raw = Helpers.pathToStream(data);
  } else if (_.isObject(data)) {
    raw = Helpers.dataToRequestOption(data.value).value;
    options = _.defaults(options, _.omit(data, 'value'));
  } else {
    throw new Error('Invalid data passed as argument for request!');
  }
  return { value: raw, options };
};

Helpers.extractUrl = function (text) {
  return text.match(/((?:https\:\/\/)|(?:http\:\/\/)|(?:www\.))?([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\??)[a-zA-Z0-9\-\._\?\,\'\/\\\+&%\$#\=~]+)/g);
};

module.exports = Helpers;
