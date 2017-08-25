const debug = require('debug')('trpg:component:player:event');
const md5 = require('../md5');
const uuid = require('uuid/v1');

exports.login = function login(data, cb) {
  let app = this.app;
  let socket = this.socket;

  try {
    if(typeof data === 'string') {
      data = JSON.parse(data);
    }

    let username = data.username;
    let password = data.password;

    if(!!username && !!password) {
      app.storage.connect(function(db) {
        let modelUser = db.models.player_user;
        modelUser.one({username, password: md5(password)}, function(err, user) {
          if(!!err) {
            throw new Error(err);
          }

          if(!user) {
            debug('login fail, try to login [%s] and password error', username);
            if(!!cb) {
              cb({result: false, msg: "账户或密码错误"});
            }
          } else {
            debug('login success!user [%s(%s)] has been login', user.username, user.uuid);
            // console.log(user.getInfo());
            user.last_login = new Date();
            user.token = uuid();
            user.save();

            // 加入到列表中
            if(!!app.player) {
              app.player.list.add(user, socket);
            }

            if(!!cb) {
              cb({result: true, info: user.getInfo()});
            }
          }
        })
      });
    } else {
      debug('login fail, miss necessary parameter: %o', data);
      if(!!cb) {
        cb({result: false, msg: "缺少必要参数"});
      }
    }
  } catch (e) {
    debug('login fail. received data %o \n%O', data, e);
  }
}

exports.loginWithToken = function loginWithToken(data, cb) {
  let app = this.app;
  let socket = this.socket;
  try {
    if(typeof data === 'string') {
      data = JSON.parse(data);
    }

    let uuid = data.uuid;
    let token = data.token;

    if(!!uuid && !!token) {
      app.storage.connect(function(db) {
        let modelUser = db.models.player_user;
        modelUser.one({uuid, token}, function(err, user) {
          if(!!err) {
            throw new Error(err);
          }

          if(!user) {
            debug('login with token fail, try to login %s and password error', uuid);
            if(!!cb) {
              cb({result: false, msg: "TOKEN错误或过期"});
            }
          } else {
            debug('login with token success!user %s has been login', user.uuid);
            // console.log(user.getInfo());
            user.last_login = new Date();
            user.token = uuid();
            user.save();

            // 加入到列表中
            if(!!app.player) {
              app.player.list.add(user, socket);
            }

            if(!!cb) {
              cb({result: true, info: user.getInfo()});
            }
          }
        })
      });
    } else {
      debug('login with token fail, miss necessary parameter: %o', data);
      if(!!cb) {
        cb({result: false, msg: "缺少必要参数"});
      }
    }
  }catch(e) {
    debug('login with token fail. received data %o \n%O', data, e);
  }
}

exports.register = function register(data, cb) {
  let app = this.app;
  let socket = this.socket;
  try {
    if(typeof data === 'string') {
      data = JSON.parse(data);
    }

    let username = data.username;
    let password = data.password;

    if(!!username && !!password) {
      app.storage.connect(function(db) {
        let modelUser = db.models.player_user;
        modelUser.one({username}, function(err, user) {
          if(!!err) {
            throw new Error(err);
          }

          if(!!user) {
            debug('register failed!user %s has been existed', user.username);
            cb({result: false, msg: '用户名已存在'});
          } else {
            modelUser.create({username, password:md5(password)}, function(err, results) {
              if(!!err) {
                throw new Error(err);
              }

              debug('register success: %o', results);
              cb({result: true, results});
            })
          }
        })
      });
    } else {
      debug('register fail, miss necessary parameter: %o', data);
      if(!!cb) {
        cb({result: false, msg: "缺少必要参数"});
      }
    }
  }catch(e) {
    debug('register fail. received data %o \n%O', data, e);
  }
}

exports.getInfo = function getUserInfo(data, cb) {
  let app = this.app;
  let socket = this.socket;
  let type = data.type || 'self';
  let uuid = data.uuid;

  if(!!type) {
    if(type === 'self') {
      let player = app.player.list.find(socket);
      if(!!player) {
        cb({result: true, info: player.user});
      }else {
        cb({result: false, msg: '用户不存在，请检查登录状态'});
      }
    }else if(type === 'user') {
      app.storage.connect(function(db) {
        let User = db.models.player_user;
        User.one({uuid}, function(err, user) {
          if(!!err) {
            cb({result: false, msg: err.toString()});
            return;
          }
          if(!!user) {
            cb({result: true, info: user.getInfo()});
          }else{
            cb({result: false, msg: '用户不存在'});
          }
        })
      })
    }else if(type === 'actor') {
      app.storage.connect(function(db) {
        let Actor = db.models.player_actor;
        Actor.one({uuid}, function(err, actor) {
          if(!!err) {
            cb({result: false, msg: err.toString()});
            return;
          }
          if(!!actor) {
            cb({result: true, info: actor})
          }else {
            cb({result: false, msg: '人物不存在'});
          }
        })
      })
    }else {
      cb({result: false, msg: '未知的类型'});
    }
  } else {
    cb({result: false, msg: '参数不全'});
  }
}
