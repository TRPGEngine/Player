module.exports = function Settings(Sequelize, db) {
  let Settings = db.define('player_settings', {
    user_uuid: {type: Sequelize.STRING, unique: 'user_uuid_index'},
    user_settings: {type: Sequelize.JSON},
    system_settings: {type: Sequelize.JSON},
  });

  return Settings;
}
