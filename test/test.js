const player = require('../');
// let app = require('trpg-core')();
let app = require('../../Core/')();
app.load(player);
app.run();

app.player.getPlayer(1, function(err, user) {
  console.log(user);
});
app.close();
