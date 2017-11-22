const uuid = require('uuid/v1');

module.exports = function User(orm, db) {
  let User = db.define('player_user', {
    username: {type: 'text', required: true},
    password: {type: 'text', required: true},
    nickname: {type: 'text', required: false},
    avatar: {type: 'text', required: false},
    uuid: {type: 'text', required: false},
    last_login: {type: 'date', time: true},
    last_ip: {type: 'text'},
    createAt: {type: 'date', time: true},
    token: {type: 'text'},
    sex: {type:'enum', values: ['男', '女', '其他', '保密'], defaultValue: '保密'},
    sign: {type: 'text'},
  }, {
    hooks: {
      beforeCreate: function(next) {
        if (!this.uuid) {
  				this.uuid = uuid();
  			}
        if(!this.createAt) {
          this.createAt = new Date();
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
          last_login: this.last_login,
          id: this.id,
          avatar: this.avatar,
          token: includeToken ? this.token : '',
          sex: this.sex,
          sign: this.sign,
        }
      },
      updateInfo: function(data) {
        // 数据保护
        delete data.id;
        delete data.username;
        delete data.uuid;
        delete data.createAt;
        delete data.token;

        return Object.assign(this, data);
      }
    }
  });

  User.hasMany('friends', User, {}, {key: true});

  return User;
}
