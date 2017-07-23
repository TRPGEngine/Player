const debug = require('debug')('trpg:component:player');
const md5 = require('./lib/md5');
const uuid = require('uuid/v1');

module.exports = function PlayerComponent(app) {
  initStorage.call(app);
}

function initStorage() {
  let app = this;
  let storage = app.storage;
  storage.registerModel(require('./lib/models/actor.js'));
  storage.registerModel(require('./lib/models/user.js'));

  app.on('initCompleted', function(app) {
    // 数据信息统计
    debug('storage has been load 2 player db model');
  });

  app.on('resetStorage', function(storage, db) {
    debug('player begin reset storage');

    console.log(db);
  });
}
