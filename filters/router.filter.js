
var validate = function(psw){
    return psw===global.config.password;
};

function getFilesObj(files){
    const obj = {};
    files.forEach(file => {
        if(file.fieldname){
            obj[file.fieldname] = file
        }
    });
    return obj
}


// 此规则需要自己定义
const rules = {
    default: function (ctx) {
        console.log(111);
        const hasData = !!(ctx.session && ctx.session.userinfo);
        let rs = hasData;

        const files = ctx.request.files;

        if(files && files.length>0){
            const filesObj = getFilesObj(files);
            ctx.request.filesObj = filesObj;
        }

        if(ctx.url.indexOf('/mng-/')===0){
            if(validate(ctx.params.psw)){
                ctx.session.userinfo = {key: global.config.password};
                return true;
            }else if(!hasData){
                ctx.body = '非法访问！';
                return false;
            }
        }

        return true;
    }
};

module.exports = rules;