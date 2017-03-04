/**
 * Created by nandy on 2017/2/28.
 */
var path = require('path'),
    fs = require("fs");
var basePath = global.config.basePath,
    cacheCategory = global.config.category,
    dataPath = basePath+'/'+cacheCategory,
    dataCachePath = dataPath+'/'+'datacache.json';

var exec = function(){
    var exe = require('child_process').exec;
    exe.apply(exe, arguments);
};

var getGitPath = exports.getGitPath = function(category){
    return basePath+'/'+category;
};

var hybrid  = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789876543210";
var createId = function(len){
    len = len||16;
    var rs = [];
    for(var i=0;i<len;i++){
        var id = Math.ceil(Math.random()*69);
        rs.push(hybrid.charAt(id));
    }
    return rs.join('');
};

var dataCache = {
    list : []
};

var initDateCache = function(cb){
    var $dataCachePath = path.join(global.rootPath, dataCachePath);
    if(fs.existsSync($dataCachePath)){
        fs.readFile($dataCachePath, 'utf-8', function(err, file){
            dataCache = err?dataCache:JSON.parse(file);
            saveDataCache(cb);
        });
    }else{
        saveDataCache(cb);
    }
};

var saveDataCache = function(cb){
    var $dataCachePath = path.join(global.rootPath, dataCachePath);
    fs.writeFile($dataCachePath, JSON.stringify(dataCache),function(err){
        cb&&cb(err);
    });
};

var itemModal = {
    category : '',
    url : '',
    title : '',
    create_time : '',
    cover : ''
};

exports.init = function(opts){

    if(fs.existsSync(path.join(global.rootPath, dataPath))){
        initDateCache(function(){
            global.config.isInit = true;
        });
    }else{
        var forInit = function(){
            exec("cd "+basePath+" && mkdir " + cacheCategory, function(err, stdout, stderr) {
                if(err){
                    console.log(arguments);
                }else{
                    initDateCache(function(){
                        global.config.isInit = true;
                    });
                }
            });
        };
        var $basePath = path.join(global.rootPath, basePath);
        if(fs.existsSync($basePath)){
            forInit();
        }else{
            fs.mkdir($basePath, function(err){
                if(!err) forInit();
            });
        }

    }
};

var isUnique = function(infoObj){
    var list = dataCache.list = dataCache.list||[], url = infoObj.url, category = infoObj.category;
    if(category===cacheCategory) return false;
    for(var i=0,len=list.length;i<len;i++){
        var item = list[i];
        if(item.url===url||item.category===category) return false;
    }
    return true;
};

var addList = function(infoObj, cb){
    infoObj.git_id = createId();
    dataCache.list = dataCache.list||[];
    dataCache.list.push(infoObj);
    saveDataCache(cb);
};

var delList = function(index, cb){
    dataCache.list.splice(index,1);
    saveDataCache(cb);
};

var getItem = exports.getItem = function(id){
    for(var i= 0,len=dataCache.list.length;i<len;i++){
        var item = dataCache.list[i];
        if(item.git_id===id||item.url===id||item.category===id){
            item.index = i;
            return item;
        }
    }
};

var format = exports.format = function(str){
    var d = /\.[^\.]+$/.exec(str);
    return d&&d.length>0?d[0]:'';
};
var mime = exports.mime = {
    "doc" : "application/msword",
    "docx" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "rar" : "application/rar",
    "zip" : "application/zip",
    "html" : "text/html",
    "css"  : "text/css",
    "js"   : "text/javascript",
    "json" : "application/json",
    "ico"  : "image/x-icon",
    "gif"  : "image/gif",
    "jpeg" : "image/jpeg",
    "jpg"  : "image/jpeg",
    "png"  : "image/png",
    "pdf"  : "application/pdf",
    "svg"  : "image/svg+xml",
    "swf"  : "application/x-shockwave-flash",
    "tiff" : "image/tiff",
    "txt"  : "text/plain",
    "wav"  : "audio/x-wav",
    "wma"  : "audio/x-ms-wma",
    "wmv"  : "video/x-ms-wmv",
    "xml"  : "text/xml",
    lookup : function(path){
        var type = format(path);
        if(!type) return 'text/plain';
        type = type.substr(1,type.length);
        return this[type]?this[type]:'text/plain';
    }
};

exports.getList = function(cb){
    initDateCache(function(){
        cb(dataCache.list||[]);
    });
};

exports.saveGit = function(infoObj, cb){
    if(isUnique(infoObj)){
        var gitPath = getGitPath(infoObj.category);//https://github.com/nandy007/agile-vm.git
        exec("rm -rf " + gitPath + " && git clone " + infoObj.url + " " + gitPath, function(err, stdout, stderr) {
            if(err){
                cb(arguments);
            }else{
                addList(infoObj, cb);
            }
        });
    }else{
        cb(null, false);
    }
};

exports.delGit = function(git_id, cb){
    var item = getItem(git_id)||{};
    var category = item.category;
    var gitPath = getGitPath(category);
    exec('rm -rf '+gitPath, function(err){
        if(err){
            cb(arguments);
        }else{
            delList(item.index, cb);
        }
    });
};

exports.updateWebhook = function(cloneUrl){
    var item = getItem(cloneUrl)||{}, category = item.category;

    var gitPath = getGitPath(category);
    var cmds = [
            'cd '+gitPath,
        'git fetch origin',
        'git merge origin/master'
    ];

    exec(cmds.join(' && '), function(err, stdout, stderr) {
        if(err) console.log(arguments);
    });
};