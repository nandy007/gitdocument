
const path = require('path');

module.exports = {
    projectPath : "",
    port: 7700,                                      //按需修改
    rootPath: path.join(__dirname, '../'),
    middleware: {
        staticPath: path.join(__dirname, '../public'),
        sessionConfig: {
          key: 'SESSIONID',
          cookie : {
            maxAge : 30 * 60 * 1000 //24 * 60 * 60 * 1000
          }
        },
        multiParser: { dest: path.join(__dirname, '../public/uploads/') }                                      //按需修改
    },
    common: {
        "category" : "gitdocument",
        "isInit" : false,
        "basePath": "../gits",
        "password" : "",
        "maxCache" : 10,
        "copyright" : "",
        "url" : "",
        "beian": ""
    }
};