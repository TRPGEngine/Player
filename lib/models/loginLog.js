module.exports = function LoginLog(orm, db) {
  let LoginLog = db.define('player_login_log', {
    user_uuid: {type: 'text'},
    user_name: {type: 'text', required: true},
    type: {type: 'enum', values: ['standard', 'token']},
    ip: {type: 'text'},
    platform: {type: 'text'},
    device: {type: 'text'},
    is_success: {type: 'boolean'},
    token: {type: 'text'},
    createAt: {type: 'date', required: false},
  }, {
    hooks: {
      beforeCreate: function(next) {
        if (!this.createAt) {
  				this.createAt = new Date();
  			}
  			return next();
      }
    },
    methods: {

    }
  });

  return LoginLog;
}
