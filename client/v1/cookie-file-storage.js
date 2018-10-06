const util = require('util');
const FileCookieStore = require('tough-cookie-filestore');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const Helpers = require('../../helpers');
const CookieStorage = require('./cookie-storage');


function CookieFileStorage(cookiePath) {
  cookiePath = path.resolve(cookiePath);
  Helpers.ensureExistenceOfJSONFilePath(cookiePath);
  CookieStorage.call(this, new FileCookieStore(cookiePath));
}

util.inherits(CookieFileStorage, CookieStorage);
module.exports = CookieFileStorage;


CookieFileStorage.prototype.destroy = function () {
  fs.unlinkSync(this.storage.filePath);
};
