
const routerUtil = require('chestnut-router');
const router = routerUtil.create(global.config.projectPath);

const docs = require('../controllers/docs');

module.exports = router
  .get('/', async function(ctx){
    ctx.redirect(global.config.projectPath + '/index.html');
  })
  .get('/index.html', docs.index)
  .get('/about.html', docs.about)
  .get('/mng/main(:psw)?.html', docs.mng)
  .post('/mng/saveGit', docs.saveGit)
  .get('/mng/delGit', docs.delGit)
  .post('/receiveWebHooks', docs.receiveWebHooks)
  .get('/source/:source', docs.source)
  .get('/:category/search.html', docs.search)
  .get('/:category/showImg.html', docs.showImg)
  .get('/:category/:name.html', docs.showDocs)
  .get('/:category/*', docs.showOthers);