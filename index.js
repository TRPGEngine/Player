const debug = require('debug')('trpg:component:player');
const uuid = require('uuid/v1');
const event = require('./lib/event');
const PlayerList = require('./lib/list');

module.exports = function PlayerComponent(app) {
  initStorage.call(app);
  initFunction.call(app);
  initSocket.call(app);
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
    debug('start reset player storage');
    db.models.core_user.create({
      username: 'admin',
      password: md5('admin'),
      selected_actor: 1
    }, function(err, res) {
      if (err) throw err;

      db.models.core_actor.create({
        name: 'demo',
        user_id: res.id,
        info: {
          "测试信息": "测试信息内容",
          "测试信息组": {
            "测试信息组1": "测试信息内容1",
            "测试信息组2": "测试信息内容2"
          }
        }
      }, function(err, res) {
        if (err) throw err;

        debug('player storage reset completed!');
      })
    });
  });
}
function initFunction() {
  let app = this;
  let storage = app.storage;
  app.player = {
    list: new PlayerList(),
    getPlayer: function getPlayer(id, cb) {
      if(typeof id != 'number') {
        throw new Error(`id must be a Number, not a ${typeof id}`);
      }

      storage.connect(function(db) {
        let modelUser = db.models.core_user;
        modelUser.get(id, function(err, user) {
          if(!cb) { return; }

          if(!!err) {
            cb(err, null);
          }else {
            cb(null, user);
          }
        });
      });
    },
    getActor: function getActor(playerId, cb) {
      if(typeof playerId != 'number') {
        throw new Error(`id must be a Number, not a ${typeof id}`);
      }

      storage.connect(function(db) {
        let modelActor = db.models.core_actor;
        modelActor.find({user_id: playerId}, function(err, ));
      });
    }
  }
}
function initSocket() {
  let app = this;
  app.on('connection', function(socket) {
    let wrap = {app, socket};
    socket.on('player::login', event.login.bind(wrap));
  })
}