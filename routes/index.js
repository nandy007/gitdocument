var fs = require("fs"),
    async = require("async"),
    marked = require("marked"),
    path = require('path'),
    gitdata = require(global.rootPath + '/utils/gitdata');

var renderer = new marked.Renderer(), highlightjs = require(global.rootPath + '/utils/highlight');
renderer.code = function(code, language){
    // Check whether the given language is valid for highlight.js.
    var validLang = !!(language && highlightjs.getLanguage(language));
    // Highlight only if the language is valid.
    var highlighted = validLang ? highlightjs.highlight(language, code).value : code;
    // Render the highlighted code with `hljs` class.
    return '<pre><code class="hljs '+language+'">'+highlighted+'</code></pre>';
};
var tableCss = 'table table-striped';
renderer.table = function (header, body) {
    return '<table class="'+tableCss+'">'+header+body+'</table>';
};

renderer.heading = function (text, level) {
    return '<h'+level+' data-category="">'+text+'</h'+level+'>';
};

var markedFilter = function(str){
    str = marked(str).replace(/\<table\>/g, '<table class="'+tableCss+'">');
    return str;
};


marked.setOptions({
    renderer: renderer
});

exports.index = function(req , res){
    gitdata.getList(function(list){
        res.render('index.html',{list:list});
    });
};

exports.about = function(req , res){
    var aboutPath = path.join(global.rootPath, 'public/about.md');
    fs.readFile(aboutPath, 'utf-8', function(err, file){
        res.render('about.html',{file:err?'':marked(file)});
    });
};

exports.mng = function(req , res){
    var psw = (req.params||{}).psw||'';
    if(psw!=global.config.password){
        res.send('Are you kidding me?');
        return;
    }
    gitdata.getList(function(list){
        res.render('mng.html',{list:list});
    });
};

exports.savePsw = function(req , res){
    gitdata.getList(function(list){
        res.render('mng.html',{list:list});
    });
};


exports.saveGit = function(req, res){
    gitdata.saveGit(req.body, function(err, result){
        if(err){
            res.json({result:'error'});
        }else{
            res.json({result:'success'});
        }
    });
};

exports.delGit = function(req, res){
    var gitId = req.query.git_id;
    gitdata.delGit(gitId, function(err){
        if(err){
            res.json({result:'error'});
        }else{
            res.json({result:'success'});
        }
    });
};

exports.receiveWebHooks = function(req, res){
    //console.log(JSON.stringify(req.body));
    var body = req.body, params = {}, cloneUrl = '';
    if(body.payload){
        params = JSON.parse(body.payload);
    }else{
        params = body;
    }
    cloneUrl = params.repository.clone_url;
    //console.log(cloneUrl);
    gitdata.updateWebhook(cloneUrl);

    res.send('receive');
};

exports.showDocs = function(req, res){
    var category = req.params.category, name = req.params.name;
    var gitPath = gitdata.getGitPath(category), docsPath = gitPath+'/docs';
    var item = gitdata.getItem(category);
    async.parallel([
            function(callback){
                var indexPath = path.join(global.rootPath, docsPath+'/indexes.json');
                fs.readFile(indexPath, 'utf-8', function(err, file){
                    try{
                        file = JSON.parse(file);
                    }catch(e){
                        file = {};
                    }
                    callback(null, file);
                });
            },
            function(callback){
                if(name==='index'){
                    if(fs.existsSync(path.join(global.rootPath, docsPath+'/'+'index.md'))){
                        name = 'index';
                    }else if(fs.existsSync(path.join(global.rootPath, docsPath+'/'+'README.md'))){
                        name = 'README';
                    }else if(fs.existsSync(path.join(global.rootPath, docsPath+'/'+'readme.md'))){
                        name = 'readme';
                    }
                }
                var docPath = path.join(global.rootPath, docsPath+'/'+name+'.md');
                fs.readFile(docPath, 'utf-8', function(err, file){
                    file = err?"":markedFilter(file);
                    callback(null, {
                        fileName : name,
                        content : file
                    });
                });
            }
        ],
        function(err, results){
            res.render('docs.html',{indexes:results[0], file:results[1], item: item});
        });
};

exports.showOthers = function(req, res){
    var category = req.params.category, file = req.params[0];
    var filePath = path.join(global.rootPath, gitdata.getGitPath(category)+'/docs/'+file);
    fs.readFile(filePath, "binary", function(err, file){
        if(err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.write(err + "\n");
            res.end();
        } else {
            var fileName = filePath.split(/\\\//).pop();
            res.setHeader("Content-Disposition",  "attachment;filename=" + fileName.replace('%40','@')+ ";Content-Type:"+ gitdata.mime.lookup(fileName));
            res.write(file, "binary");
            res.end();
        }
    });
};