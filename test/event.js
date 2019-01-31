const md5 = require('../md5');

const testUser = {
  username: 'admin1',
  password: md5('admin'),
}

const loginTestUser = async (client) => {
  let data = await client.emit('player::login', testUser);
  client.setGlobal('uuid', data.info.uuid);
  client.setGlobal('token', data.info.token);

  return data;
}

exports.login = async function(client, chai) {
  let data = await loginTestUser(client);

  chai.expect(data.info.username).to.equal('admin1');
}

exports.loginWithToken = async function(client, chai) {
  const uuid = client.getGlobal('uuid');
  const token = client.getGlobal('token');

  let data = await client.emit('player::loginWithToken', {
    uuid,
    token
  })

  chai.expect(data.info.uuid).to.equal(uuid);
  chai.expect(data.info.token).to.equal(token);
}

exports.register = async function(client, chai) {
  const random = parseInt(Math.random() * 1e5);
  const username = 'testuser' + random;
  let data = await client.emit('player::register', {
    username,
    password: md5(random)
  })

  chai.expect(data.results.username).to.equal(username);
  chai.expect(data.results.password).to.equal(md5(md5(random)));
}

exports.getInfo = async function(client, chai) {
  const uuid = client.getGlobal('uuid');
  const token = client.getGlobal('token');

  let selfData = await client.emit('player::getInfo', {});
  chai.expect(selfData.info.uuid).to.equal(uuid);
  chai.expect(selfData.info.token).to.equal(token);

  let userData = await client.emit('player::getInfo', {
    type: 'user',
    uuid
  })
  chai.expect(userData.info.uuid).to.equal(uuid);
  chai.expect(userData.info.token).to.be.empty;
}

exports.updateInfo = async function(client, chai) {
  const token = client.getGlobal('token');
  const random = String(Math.random());

  let data = await client.emit('player::updateInfo', {
    sign: random,
    token: random
  })
  chai.expect(data.user.sign).to.equal(random);
  chai.expect(data.user.token, 'token不能被更新').to.equal(token);
  chai.expect(data.user.token).to.not.equal(random);
}

exports.changePassword = async function(client, chai) {
  const uuid = client.getGlobal('uuid');
  const randomPassword = String(parseInt(Math.random() * 1e8));

  let data1 = await client.emit('player::changePassword', {
    oldPassword: testUser.password,
    newPassword: randomPassword
  })
  let currentUser1 = await client.db.models.player_user.findOne({
    where: {
      uuid,
    }
  })
  chai.expect(data1.user.uuid).to.be.equal(uuid);
  chai.expect(currentUser1.password).to.be.equal(md5(randomPassword));

  let data2 = await client.emit('player::changePassword', {
    oldPassword: randomPassword,
    newPassword: testUser.password
  })
  let currentUser2 = await client.db.models.player_user.findOne({
    where: {
      uuid,
    }
  })
  chai.expect(data2.user.uuid).to.be.equal(uuid);
  chai.expect(currentUser2.password).to.be.equal(md5(testUser.password));
}

exports.logout = async function(client, chai) {
  const uuid = client.getGlobal('uuid');
  const token = client.getGlobal('token');

  let data = await client.emit('player::logout', {uuid, token});
  chai.expect(data.result).to.be.equal(true);


  await loginTestUser(client); // 重新登录
}
