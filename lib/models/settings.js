module.exports = function Settings(orm, db) {
  let Settings = db.define('player_settings', {
    user_settings: {type: 'object'},
    system_settings: {type: 'object'},
    createAt: {type: 'date', time: true},
    updateAt: {type: 'date', time: true},
  }, {
    hooks: {
      beforeCreate: function(next) {
        if (!this.createAt) {
  				this.createAt = new Date();
  			}
        if (!this.updateAt) {
  				this.updateAt = new Date();
  			}
  			return next();
      }
    },
    methods: {

    }
  });

  const User = db.models.player_user;
  Settings.hasOne('owner', User, { reverse: "settings" });

  return Settings;
}
