/**
 * Created by nandy007 on 2017/02/08.
 */

/**
 * Module dependencies.
 */

const  http = require('http')
    , path = require('path');


const appConfig = require('./config/config');

global.rootPath = __dirname;
global.config = appConfig.common;
global.categoryCache = {};

const app = require('chestnut-app');

const router = require('chestnut-router');
const filters = require('./filters/router.filter');
router.addFilters(filters);


// 定义自己的static目录，默认的公共的static仍然在外层生效

if (process.env.NODE_ENV !== 'production') {
    app.start(appConfig);
} else {
    app.startCluster(appConfig);
}



require('./utils/gitdata').init();

module.exports = app;