const uuid = require('uuid/v1');

module.exports = function User(orm, db) {
  let User = db.define('player_user', {
    username: {type: 'text', required: true},
    password: {type: 'text', required: true},
    nickname: {type: 'text', required: false},
    avatar: {type: 'text', required: false},
    uuid: {type: 'text', required: false},
    last_login: {type: 'date'},
    selected_actor: {type: 'integer'},
    token: {type: 'text'},
    sex: {type:'enum', values: ['男', '女', '其他', '保密'], defaultValue: '保密'},
    sign: {type: 'text'},
  }, {
    hooks: {
      beforeCreate: function(next) {
        if (!this.uuid) {
  				this.uuid = uuid();
  			}
  			return next();
      }
    },
    methods: {
      getName: function() {
        return this.nickname || this.username;
      },
      getInfo: function(includeToken = false) {
        return {
          username: this.username,
          uuid: this.uuid,
          selected_actor: this.selected_actor,
          last_login: this.last_login,
          id: this.id,
          avatar: this.avatar,
          token: includeToken ? this.token : '',
        }
      },
      getSelectedActor: function(cb) {
        let selectedActorId = this.selected_actor;
        if(!!db && !!selectedActorId) {
          selectedActorId = parseInt(selectedActorId);
          db.models.player_actor.get(selectedActorId, cb);
        }else {
          cb(new Error('data error'), null);
        }
      }
    }
  });

  User.hasMany('friends', User, {}, {key: true});

  return User;
}
