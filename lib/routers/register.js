const debug = require('debug')('trpg:component:player:router:register');
const Router = require('koa-router');
const router = new Router();
const geetestWrapper = require('../utils/geetestWrapper');

router.get('/validate', async function (ctx, next) {
  const geetest = ctx.geetest;
  if(geetest) {
    let data = await geetestWrapper(geetest, 'register', null);
    console.log('data', data);
    if(!data.success) {
      // 进入 fallback，如果一直进入此模式，请检查服务器到极验服务器是否可访问
      debug('[geetest] enter fallback');
      ctx.session.fallback = true;
      ctx.body = data;
    }else {
      ctx.session.fallback = false;
      ctx.body = data;
    }
  }else {
    throw '极验未加载';
  }
});

module.exports = router;
