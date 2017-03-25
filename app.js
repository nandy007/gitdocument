/**
 * Created by nandy007 on 2017/02/08.
 */

/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , bodyParser = require('body-parser')
    , cookieParser = require('cookie-parser')
    , favicon = require('serve-favicon');

global.rootPath = __dirname;
global.config = require('./config/config.json');
global.categoryCache = {};

var app = express();

//设置ejs使用html
app.engine('html', require('ejs').renderFile);


//设置html为模板后缀
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
//app.use(favicon(__dirname + '/../exmobi/public/images/favicon.ico'));

app.use(express.static(path.join(__dirname, './public')));


app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true }));
app.use(cookieParser());


//路由控制器
require('./controller/index').set(app);

require('./utils/gitdata').init();

module.exports = app;