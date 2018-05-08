

var fs = require("fs-extra"),
    marked = require("marked"),
    path = require('path'),
    gitdata = require('../utils/gitdata');

var renderer = new marked.Renderer(), highlightjs = require('../utils/highlight');
renderer.code = function (code, language) {
    code = code.replace(/<font class="kw">(((?!<\/font>).)*)<\/font>/g, function(s, s1){  
        return '__$$$'+s1+'$$$__';
    });
    // Check whether the given language is valid for highlight.js.
    var validLang = !!(language && highlightjs.getLanguage(language));
    // Highlight only if the language is valid.
    var highlighted = validLang ? highlightjs.highlight(language, code).value : code;
    highlighted = highlighted.replace(/__\$\$\$(((?!\$\$\$__).)*)\$\$\$__/g, function(s, s1){
        return '<font class="kw">'+s1+'</font>';
    });
    // Render the highlighted code with `hljs` class.
    return '<pre><code class="hljs ' + language + '">' + highlighted + '</code></pre>';
};
var tableCss = 'table table-striped';
renderer.table = function (header, body) {
    return '<table class="' + tableCss + '">' + header + body + '</table>';
};

/*renderer.heading = function (text, level) {
    return '<h'+level+' data-category="">'+text+'</h'+level+'>';
};*/

var markedFilter = function (str) {
    str = marked(str.replace(/(<h[^>]*id\=[^>]*)>/g, function (s, s1) {
        if (s.indexOf('data-category') > -1) return s;
        return s1 + ' data-category=""' + '>';
    })).replace(/\<table\>/g, '<table class="' + tableCss + '">');
    return str;
};

var keywordHighlight = function(k, file){
    if(k==='') return file;
    var kws = k.split(' ');
    for(var i=0,l=kws.length;i<l;i++){
        var reg = new RegExp(kws[i].replace(/[\(\)\#\{\}\?\*\+\$]/g, function(s){
            return '\\'+s;
        }), 'g');
        file = file.replace(reg, function(s){
            return '<font class="kw">'+s+'</font>';
        });
    }
    return file;
};

marked.setOptions({
    renderer: renderer
});

var formateRender = function(obj){
    obj.config = global.config;
    return obj;
};

exports.index = async function (ctx) {
    
    var k = (ctx.query.k || '').trim();
    var kws = k.replace(/[ ]+/g, ' ').split(' ');
    const list = gitdata.getList();
    if (k === '') {
        await ctx.render('index', formateRender({ list: list, k: k }));
        return;
    }
    var arr = [];
    for (var i = 0, l = (list || []).length; i < l; i++) {
        var li = list[i], title = li.title.toLowerCase();
        for (j = 0, len = kws.length; j < len; j++) {
            if (title.indexOf(kws[j].toLowerCase()) < 0) {
                li = null;
                break;
            }
        }
        if (li) {
            arr.push(li);
        }
    }
    await ctx.render('index', formateRender({ list: arr, k: k }));
};

exports.about = async function (ctx) {
    var aboutPath = path.join(global.rootPath, 'README.md');
    const file = fs.readFileSync(aboutPath, 'utf-8');
    await ctx.render('about', formateRender({ file: file?marked(file):'' }));
};

exports.mng = async function (ctx) {
    const list = gitdata.getList();
    await ctx.render('mng', formateRender({ list: list }));
};

exports.savePsw = async function (ctx) {
    const list = gitdata.getList();
    await ctx.render('mng', formateRender({ list: list }));
};


exports.saveGit = async function (ctx) {
    const filesObj = ctx.request.filesObj || {};
    var coverPath = (filesObj.cover || {}).path;
    var category = ctx.request.body.category;
    if(!coverPath){
        ctx.body = { result: 'error' };
        return;
    }
    var filePath = path.join(global.rootPath, gitdata.getGitPath('source'), category+'.png');
    fs.copyFileSync(coverPath, filePath);
    const rs = await gitdata.saveGit(ctx.request.body);
    if(rs){
        ctx.body = { result: 'error' };
    }else{
        ctx.body = { result: 'success' };
    }
};

exports.delGit = async function (ctx) {
    var gitId = ctx.query.git_id;
    const rs = gitdata.delGit(gitId);
    if(rs){
        ctx.body = { result: 'error' };
    }else{
        ctx.body = { result: 'success' };
    }
};

exports.receiveWebHooks = function (ctx) {
    //console.log(JSON.stringify(req.body));
    var body = ctx.request.body, params = {}, cloneUrl = '';
    if (body.payload) {
        params = JSON.parse(body.payload);
    } else {
        params = body;
    }
    cloneUrl = params.repository.clone_url;
    //console.log(cloneUrl);
    gitdata.updateWebhook(cloneUrl);

    ctx.body = 'receive';
};

var getCategoryList = function (categoryContent, docsPath, groups, rs) {
    rs = rs || { date: new Date().getTime() };
    groups = groups || [];

    var group = categoryContent.group || '首页';
    var contains = categoryContent.contains;
    var mdlink = categoryContent.mdlink;
    var subject = categoryContent.subject;
    if (mdlink) {
        try{
        rs[mdlink] = {
            mdlink : mdlink,
            subject: subject,
            groups: groups,
            content: (fs.readFileSync(path.join(docsPath, mdlink + '.md'), 'utf-8')||'').toLowerCase()
        };
        }catch(e){

        }
    } else if (contains) {
        for (var i = 0, l = contains.length; i < l; i++) {
            var g = groups.slice(0);
            g.push(group);
            getCategoryList(contains[i], docsPath, g, rs);
        }
    }
    return rs;
};
var validateCategoryCache = function(){
    
    var maxCache = global.config.maxCache||10,
        categoryCache = global.categoryCache,
        num = 0,
        tempCategory;
    for(var k in categoryCache){
        if((num++)===0) tempCategory = k;
    }
    if(num>=maxCache){ 
        delete global.categoryCache[tempCategory];
    }
};

var getCategoryCache = function (category, getter) {
    var categoryCache = global.categoryCache[category];
    var date = new Date().getTime();
    var gap = 604800000;
    if (!categoryCache || (date - categoryCache.date) > gap) {
        validateCategoryCache();
        categoryCache = global.categoryCache[category] = getter();
    }
    return categoryCache;
};

exports.search = async function (ctx) {
    var k = (ctx.request.query.k || '').trim();
    var kws = k.replace(/[ ]+/g, ' ').split(' ');

    var category = ctx.params.category;
    var gitPath = gitdata.getGitPath(category), docsPath = gitPath + '/docs';
    var item = gitdata.getItem(category);

    var categoryContent = JSON.parse(fs.readFileSync(path.join(docsPath, 'indexes.json'), 'utf-8')),
        categoryList = getCategoryCache(category, function () {
            return getCategoryList(categoryContent, docsPath);
        });
    var arr = [];
    if(k===''){
        await ctx.render('search', formateRender({ list: arr, k: k, item: item }));
        return;
    }
    for (var i in categoryList) {
        var content = categoryList[i].content||'',
            flag = true;
        for (j = 0, len = kws.length; j < len; j++) {
            if (content.indexOf(kws[j].toLowerCase()) < 0) {
                flag = false;
                break;
            }
        }
        if (flag) {
            arr.push(categoryList[i]);
        }
    }

    await ctx.render('search', formateRender({ list: arr, k: k, item: item }));
};

exports.showImg = async function(ctx){
    var img = ctx.query.img;
    await ctx.render('showImg', formateRender({ img: img }));
};

exports.source = async function(ctx){
    var imgName = ctx.params.source;
    if(!imgName){
        ctx.redirect('/img/default-cover.png');
        return;
    }
    var filePath = path.join(global.rootPath, gitdata.getGitPath('source'), imgName);
    if(!fs.existsSync(filePath)){
        ctx.redirect('/img/default-cover.png');
        return;
    }
    var readStream = fs.createReadStream(filePath);
    var fileName = filePath.split(/\\\//).pop();

    ctx.res.setHeader("Content-Disposition", "attachment;filename=" + imgName + ";Content-Type:" + gitdata.mime.lookup(imgName));
    ctx.body = readStream;
};

exports.showDocs = async function (ctx) {
    var k = (ctx.request.query.k || '').trim();
    var category = ctx.params.category, name = ctx.params.name;
    var gitPath = gitdata.getGitPath(category), docsPath = gitPath + '/docs';
    var item = gitdata.getItem(category);


    var indexPath = path.join(global.rootPath, docsPath + '/indexes.json');
    const indexFile = require(indexPath, 'utf-8');

    if (name === 'index') {
        if (fs.existsSync(path.join(global.rootPath, docsPath + '/' + 'index.md'))) {
            name = 'index';
        } else if (fs.existsSync(path.join(global.rootPath, docsPath + '/' + 'README.md'))) {
            name = 'README';
        } else if (fs.existsSync(path.join(global.rootPath, docsPath + '/' + 'readme.md'))) {
            name = 'readme';
        }
    }
    var docPath = path.join(global.rootPath, docsPath + '/' + name + '.md');
    let docFile = fs.readFileSync(docPath, 'utf-8');
    docFile = markedFilter(keywordHighlight(k, docFile || ''));
    const docContent = {fileName: name, content: docFile};

    await ctx.render('docs.ejs', formateRender({ indexes: indexFile, file: docContent, item: item, k: k }));
    
};

exports.showOthers = async function (ctx) {
    var category = ctx.params.category, fileName = ctx.params[0];
    var filePath = path.join(global.rootPath, gitdata.getGitPath('/'+category+'/docs/'+fileName));

    if(!fs.existsSync(filePath)){
        ctx.body = '';
        return;
    }

    var readStream = fs.createReadStream(filePath);

    ctx.res.setHeader("Content-Disposition", "attachment;filename=" + fileName + ";Content-Type:" + gitdata.mime.lookup(fileName));
    ctx.body = readStream;

};