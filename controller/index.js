
var getPSW = function(url){
    var psw = '';
    url.replace(/mng([^\.]*)\.html/, function(s, s1){
        psw = s1||'';
    });
    return psw;
};

var validate = function(psw){
    return psw===global.config.password;
};

var send = function(res){
    res.send('Are you kidding me?');
};

var filter = function(req, res, next){
    var psw = getPSW(req.url)||getPSW(req.headers.referer||'');
    if(validate(psw)){
        next();
    }else{
        send(res);
    }
};

exports.set = function(app){

    var docs  = require(global.rootPath+'/routes/index');

    app.get('/',docs.index);

    app.get('/index.html',docs.index);

    app.get('/about.html',docs.about);

    app.get('/mng(:psw)?.html', filter, docs.mng);

    app.post('/saveGit', filter, docs.saveGit);

    app.get('/delGit', filter, docs.delGit);

    app.post('/receiveWebHooks',docs.receiveWebHooks);

    app.get('/(:category)/search.html',docs.search);

    app.get('/(:category)/showImg.html',docs.showImg);

    app.get('/(:category)/(:name).html',docs.showDocs);

    app.get('/(:category)/(*)',docs.showOthers);

};