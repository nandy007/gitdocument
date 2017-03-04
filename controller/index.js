
exports.set = function(app){

    var docs  = require(global.rootPath+'/routes/index');

    app.get('/index.html',docs.index);

    app.get('/about.html',docs.about);

    app.get('/mng(:psw)?.html',docs.mng);

    app.post('/saveGit',docs.saveGit);

    app.post('/savePsw',docs.savePsw);

    app.get('/delGit',docs.delGit);

    app.post('/receiveWebHooks',docs.receiveWebHooks);

    app.get('/(:category)/(:name).html',docs.showDocs);

    app.get('/(:category)/(*)',docs.showOthers);

};