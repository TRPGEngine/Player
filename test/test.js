const player = require('../');
// let app = require('trpg-core')();
let app = require('../../Core/')();
app.load(player);

app.run();
app.close();
