const debug = require('debug')('trpg:component:player');
const uuid = require('uuid/v1');
const md5 = require('./md5');
const event = require('./lib/event');
const PlayerList = require('./lib/list');

module.exports = function PlayerComponent(app) {
  initStorage.call(app);
  initFunction.call(app);
  initSocket.call(app);
  initReset.call(app);
}

function initStorage() {
  let app = this;
  let storage = app.storage;
  storage.registerModel(require('./lib/models/user.js'));
  storage.registerModel(require('./lib/models/invite.js'));

  app.on('initCompleted', function(app) {
    // 数据信息统计
    debug('storage has been load 2 player db model');
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
        let modelUser = db.models.player_user;
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
    find: function find(uuid, cb) {
      if(typeof uuid !== 'string') {
        throw new Error(`uuid must be a string, not a ${typeof uuid}`);
      }

      storage.connect(function(db) {
        let modelUser = db.models.player_user;
        modelUser.find({uuid}, function(err, user) {
          if(!cb) { return; }

          if(!!err) {
            cb(err, null);
          }else {
            cb(null, user);
          }
        });
      });
    },
    getActorList: function getActorList(playerId, cb) {
      if(typeof playerId != 'number') {
        throw new Error(`id must be a Number, not a ${typeof id}`);
      }

      storage.connect(function(db) {
        let modelActor = db.models.player_actor;
        modelActor.find({user_id: playerId}, function(err, actor) {
          if(!cb) { return; }

          if(!!err) {
            cb(err, null);
          }else {
            cb(null, actor);
          }
        });
      });
    },
    getActor: function getActor(id, cb) {
      if(typeof id != 'number') {
        debug(`id must be a Number, not a ${typeof id}`);
        return;
      }

      storage.connect(function(db) {
        let modelActor = db.models.player_actor;
        modelActor.get(id, function(err, actor) {
          if(!cb) { return; }

          if(!!err) {
            cb(err, null);
          }else {
            cb(null, actor);
          }
        });
      });
    },
    makeFriend: function makeFriend(uuid1, uuid2, cb) {
      if(!uuid1 || !uuid2) {
        debug('make friend need 2 uuid: receive %o', {uuid1, uuid2});
        return;
      }

      storage.connect(function(db) {
        let modelUser = db.models.player_user;

        modelUser.one({uuid: uuid1}, function(err, user1) {
          modelUser.one({uuid: uuid2}, function(err, user2) {
            let isErrorSend = false;
            let flag = false;
            let handleError = function(err) {
              if(!!err && !isErrorSend) {
                isErrorSend = true;
                cb(err);
              }else {
                if(flag === true) {
                  cb(null);
                }
                flag = true;
              }
            }
            user1.addFriends([user2], handleError);
            user2.addFriends([user1], handleError);
          })
        })
      });
    },
    getFriends: function(uuid, cb) {
      storage.connect(function(db) {
        let modelUser = db.models.player_user;

        modelUser.one({uuid}, function(err, user) {
          if(!!err) {
            cb(err)
          }else {
            user.getFriends(cb)
          }
        });
      });
    }
  }
}
function initSocket() {
  let app = this;
  app.on('connection', function(socket) {
    let wrap = {app, socket};
    socket.on('player::login', event.login.bind(wrap));
    socket.on('player::loginWithToken', event.loginWithToken.bind(wrap));
    socket.on('player::register', event.register.bind(wrap));
    socket.on('player::getInfo', event.getInfo.bind(wrap));
    socket.on('player::logout', event.logout.bind(wrap));
    socket.on('player::findUser', event.findUser.bind(wrap));
    socket.on('player::addFriend', event.addFriend.bind(wrap));
    socket.on('player::getFriends', event.getFriends.bind(wrap));
    socket.on('player::invite', event.sendFriendInvite.bind(wrap));
    socket.on('player::refuseFriendInvite', event.refuseFriendInvite.bind(wrap));
    socket.on('player::agreeFriendInvite', event.agreeFriendInvite.bind(wrap));
    socket.on('player::getFriendsInvite', event.getFriendsInvite.bind(wrap));
  })
}
function initReset() {
  let app = this;

  app.on('resetStorage', function(storage, db) {
    debug('start reset player storage');
    db.models.player_user.create([{
      username: 'admin',
      password: md5('admin'),
      selected_actor: 1
    },{
      username: 'admin2',
      password: md5('admin'),
      selected_actor: 2
    }], function(err, res) {
      if (err) throw err;

      debug('player storage reset completed!');
    });
  });
}
