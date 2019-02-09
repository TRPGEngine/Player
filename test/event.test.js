const _ = require('lodash');
const event = require('../lib/event');
const md5 = require('../md5');
const db = global.db;
const testEvent = global.testEvent;
const emitEvent = global.emitEvent;

describe('account', () => {
  test('login should be ok', async () => {
    let ret = await testEvent(event.login, {
      username: 'admin1',
      password: md5('admin')
    })

    expect(ret.result).toBe(true);
    expect(ret).toHaveProperty('info');
    expect(ret.info.username).toBe('admin1');
  });

  test.todo('login should be error if username and password is error');

  test.todo('login with token should be ok');

  test.todo('register should be ok');

  test.todo('logout should be ok');
})

describe('user action', () => {
  let userInfo = {};
  let userInfoDbInstance = null;

  beforeAll(async () => {
    const loginInfo = await emitEvent('player::login', {
      username: 'admin1',
      password: md5('admin')
    })
    expect(loginInfo.result).toBe(true);
    userInfo = loginInfo.info

    userInfoDbInstance = await db.models.player_user.findOne({
      where: {uuid: userInfo.uuid}
    })
  })

  afterAll(async () => {
    await emitEvent('player::logout', {
      uuid: userInfo.uuid,
      token: userInfo.token
    })

    userInfo = {};
    userInfoDbInstance = null;
  })

  test.todo('getInfo should be ok');

  test.todo('updateInfo should be ok');

  test.todo('changePassword should be ok');

  test.todo('findUser should be ok');

  test('addFriend should be ok', async () => {
    let testUser = await db.models.player_user.findOne({where: {
      username: 'admin5'
    }})
    expect(testUser).toBeTruthy();
    let targetUUID = testUser.uuid;

    let ret = await emitEvent('player::addFriend', {
      uuid: targetUUID
    })
    expect(ret.result).toBe(true);

    // 查询数据库校验是否写入数据库
    let friends = await userInfoDbInstance.getFriend();
    expect(friends).toHaveProperty('length');

    let friendIndex = _.findIndex(friends, {uuid: targetUUID})
    expect(friendIndex).toBeGreaterThanOrEqual(0);
  })

  test('getFriends should be ok', async () => {
    let ret = await emitEvent('player::getFriends')

    expect(ret.result).toBe(true);
    expect(ret).toHaveProperty('list');
    ret.list.map((item) => {
      // 检测返回的好友列表不能带入敏感信息
      expect(item.token).toBeFalsy();
      expect(item.app_token).toBeFalsy();
    })
  })
})
