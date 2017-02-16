#x.baidu-push
百度推送NodeJs SDK，持续更新中
##单元测试
安装SDK `npm install x.baidu-push`

在**x.baidu-push/test**目录新建**push.config.js**，内容如下

```
'use strict';
module.exports = {
  apiKey: '百度推送apiKey',
 appSecret: '百度推送appSecret'
};
```

`npm run test`

##功能列表
1. 推送单台设备 √
