<code>gitdocument</code>是一个将git资源转换为html页面通过层级结构展示文档的一个开源服务，开源地址为[https://github.com/nandy007/gitdocument](https://github.com/nandy007/gitdocument)。

读者可以fork相应的git资源，在使用中发现文档中的错误可以进行修改并进行<code>pull requests</code>操作，实现文档的共享管理。


# 服务使用


您也可以直接将gitdocument部署到自己的服务器中自行进行管理。

第一步：

> git clone https://github.com/nandy007/gitdocument.git ./gitdocument

第二步：

> cd gitdocument

> npm install

第三步：

> 修改工程目录下的config/config.json文件，修改password的值， 并启动

> npm run start

第四步：

通过浏览器访问：

> [http://localhost:7700/index.html](http://localhost:7700/index.html)（服务首页）

> [http://localhost:7700/mng/main[password].html](http://localhost:7700/mng/main.html)（管理页面）

其中[passeord]为config.json文件中配置的password的值，注意不要加[]，比如如果password为空串则访问地址为http://localhost:7700/mng/main.html


# 其他注意事项：
项目中main.html页面可以添加的github项目目前需要满足一定要求，否则无法在主页显示：

- 项目目录下要有docs目录
- docs目录下存在README.md(可选)
- docs目录下有indexex.json文件：文件内容为整个文档的目录结构，格式如下：
```json
			{
			"contains": [
					{
						"group": "GIS学习资料",
						"contains": [
							{
								"subject": "GIS学习资料",
								"mdlink": "GIS学习资料"
							}
						 ],
						 "contains": [
							{
								"subject": "GIS知识笔记",
								"mdlink": "GIS知识笔记"
							}
						 ]
					},
					{
						"group": "GIS学习资料1",
							"contains": [
								{
									"subject": "GIS学习资料1",
									"mdlink": "GIS学习资料1"
								}
							 ],
							 "contains": [
								{
									"subject": "GIS知识笔记1",
									"mdlink": "GIS知识笔记1"
								}
							 ]
					}
				]
			}
```




