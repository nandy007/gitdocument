<code>gitdocument</code>是一个将git资源转换为html页面通过层级结构展示文档的一个开源服务。

使用文档用户可以fork相应的git资源，在使用中发现文档中的错误可以进行修改并进行<code>pull requests</code>操作，实现文档的共享管理。

# 服务使用

有两种方式使用：

## 方式一：

需要在gitdocument的作者可以将下列信息回复到gitdocument的wiki中[https://github.com/nandy007/gitdocument/wiki](https://github.com/nandy007/gitdocument/wiki)，我们会尽快进行处理。

回复信息格式：

> 文档标题：<展示在首页列表中>

> 克隆地址：<用于远程从git服务器拉取数据，不可与其他资源地址相同>

> 目录名：<用于生成访问URL的目录，仅支持英文、-、_，不可与其他资源目录同名>

而且需要您的git资源下放置一个docs目录以存放文档相关的资源，且至少包括：

> 根目录下存放一个indexes.json文件，描述文档的层级结构，最多两级，格式可参考：[示例](https://github.com/nandy007/agile-vm/blob/master/docs/indexes.json)

> 所有文档格式为md格式，要求符合markdown规范

> md文件中引用的图片也需放置到docs目录中，使用相对路径引用

> 需要配置一个webhook为https://gitdocument.exmobi.cn/receiveWebHooks

当你的全部配置好，并且我们已经在后台把你的资源克隆进来，可以通过 https://gitdocument.exmobi.cn/[目录名]/index.html 来访问你的文档。

## 方式二：

您也可以直接将gitdocument部署到自己的服务器中自行进行管理。

第一步：

> git clone https://github.com/nandy007/gitdocument.git

第二步：

> cd gitdocument

> npm install

第三步：

> 修改工程目录下的config/config.json文件，修改password的值

> node ./bin/www_gitdocument

第四步：

通过浏览器访问：

> [http://localhost:7700/index.html](http://localhost:7700/index.html)（服务首页）

> [http://localhost:7700/mng[password].html](http://localhost:7700/mng.html)（管理页面）

其中[passeord]为config.json文件中配置的password的值，注意不要加[]，比如如果password为空串则访问地址为http://localhost:7700/mng.html



