var fs = require("fs.extra"),
    async = require("async"),
    marked = require("marked"),
    path = require('path'),
    gitdata = require(global.rootPath + '/utils/gitdata');

var renderer = new marked.Renderer(), highlightjs = require(global.rootPath + '/utils/highlight');
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
        var reg = new RegExp(kws[i], 'g');
        file = file.replace(reg, function(s){
            return '<font class="kw">'+s+'</font>';
        });
    }
    return file;
};


marked.setOptions({
    renderer: renderer
});

exports.index = function (req, res) {
    var k = (req.query.k || '').trim();
    var kws = k.replace(/[ ]+/g, ' ').split(' ');
    gitdata.getList(function (list) {
        if (k === '') {
            res.render('index.html', { list: list, k: k });
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
        res.render('index.html', { list: arr, k: k });
    });
};

exports.about = function (req, res) {
    var aboutPath = path.join(global.rootPath, 'README.md');
    fs.readFile(aboutPath, 'utf-8', function (err, file) {
        res.render('about.html', { file: err ? '' : marked(file) });
    });
};

exports.mng = function (req, res) {
    gitdata.getList(function (list) {
        res.render('mng.html', { list: list });
    });
};

exports.savePsw = function (req, res) {
    gitdata.getList(function (list) {
        res.render('mng.html', { list: list });
    });
};


exports.saveGit = function (req, res) {
    var coverPath = req.files&&req.files.cover.path;
    var category = req.body.category;
    if(!coverPath){
        res.json({ result: 'error' });
        return;
    }
    var filePath = path.join(global.rootPath, gitdata.getGitPath('source'), category+'.png');
    fs.copy(coverPath, filePath, function(err){
        fs.removeSync(coverPath);
    });
    gitdata.saveGit(req.body, function (err, result) {
        if (err) {
            res.json({ result: 'error' });
        } else {
            res.json({ result: 'success' });
        }
    });
};

exports.delGit = function (req, res) {
    var gitId = req.query.git_id;
    gitdata.delGit(gitId, function (err) {
        if (err) {
            res.json({ result: 'error' });
        } else {
            res.json({ result: 'success' });
        }
    });
};

exports.receiveWebHooks = function (req, res) {
    //console.log(JSON.stringify(req.body));
    var body = req.body, params = {}, cloneUrl = '';
    if (body.payload) {
        params = JSON.parse(body.payload);
    } else {
        params = body;
    }
    cloneUrl = params.repository.clone_url;
    //console.log(cloneUrl);
    gitdata.updateWebhook(cloneUrl);

    res.send('receive');
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

exports.search = function (req, res) {
    var k = (req.query.k || '').trim();
    var kws = k.replace(/[ ]+/g, ' ').split(' ');

    var category = req.params.category;
    var gitPath = gitdata.getGitPath(category), docsPath = gitPath + '/docs';
    var item = gitdata.getItem(category);

    var categoryContent = JSON.parse(fs.readFileSync(path.join(docsPath, 'indexes.json'), 'utf-8')),
        categoryList = getCategoryCache(category, function () {
            return getCategoryList(categoryContent, docsPath);
        });
    var arr = [];
    if(k===''){
        res.render('search.html', { list: arr, k: k, item: item });
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

    res.render('search.html', { list: arr, k: k, item: item });
};

exports.showImg = function(req, res){
    var img = req.query.img;
    res.render('showImg.html', { img: img });
};

exports.source = function(req, res){
    var imgName = req.params.source;
    if(!imgName){
        res.redirect('/img/default-cover.png');
        return;
    }
    var filePath = path.join(global.rootPath, gitdata.getGitPath('source'), imgName);
    if(!fs.existsSync(filePath)){
        res.redirect('/img/default-cover.png');
        return;
    }
    var readStream = fs.createReadStream(filePath);
    var fileName = filePath.split(/\\\//).pop();
    var imgName = req.params.source;
    res.setHeader("Content-Disposition", "attachment;filename=" + imgName + ";Content-Type:" + gitdata.mime.lookup(imgName));
    readStream.pipe(res);
};

exports.showDocs = function (req, res) {
    var k = (req.query.k || '').trim();
    var category = req.params.category, name = req.params.name;
    var gitPath = gitdata.getGitPath(category), docsPath = gitPath + '/docs';
    var item = gitdata.getItem(category);
    async.parallel([
        function (callback) {
            var indexPath = path.join(global.rootPath, docsPath + '/indexes.json');
            fs.readFile(indexPath, 'utf-8', function (err, file) {
                try {
                    file = JSON.parse(file);
                } catch (e) {
                    file = {};
                }
                callback(null, file);
            });
        },
        function (callback) {
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
            fs.readFile(docPath, 'utf-8', function (err, file) {
                file = err ? "" : markedFilter(keywordHighlight(k, file));
                callback(null, {
                    fileName: name,
                    content: file
                });
            });
        }
    ],
        function (err, results) {
            res.render('docs.html', { indexes: results[0], file: results[1], item: item, k: k });
        });
};

exports.showOthers = function (req, res) {
    var category = req.params.category, file = req.params[0];
    var filePath = path.join(global.rootPath, gitdata.getGitPath(category) + '/docs/' + file);
    if(!fs.existsSync(filePath)){
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.write(err + "\n");
        res.end();
        return;
    }
    
    var readStream = fs.createReadStream(filePath);
    var fileName = filePath.split(/\\\//).pop();
    res.setHeader("Content-Disposition", "attachment;filename=" + fileName.replace('%40', '@') + ";Content-Type:" + gitdata.mime.lookup(fileName));
    readStream.pipe(res);
};