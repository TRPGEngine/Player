const uuid = require('uuid/v1');

module.exports = function Actor(orm, db) {
  var Actor = db.define('player_actor', {
    name: {type: 'text', required: true},
    uuid: {type: 'text', required: true, defaultValue: uuid()},
    info: {type: 'object'}
  }, {
    methods: {

    }
  });
  
  let User = db.models.player_user;
  if(!!User) {
    Actor.hasOne('owner', User);
  }

  return Actor;
}
