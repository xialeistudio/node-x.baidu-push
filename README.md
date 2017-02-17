#x.baidu-push
百度推送NodeJs SDK，持续更新中
##单元测试
+ 安装SDK `npm install x.baidu-push`
+ 在**x.baidu-push/test**目录新建**push.config.js**，内容如下

```
'use strict';
module.exports = {
  apiKey: '百度推送apiKey',
 appSecret: '百度推送appSecret'
};
```

+ 更改测试用例中的channel_id,tag等等为自己的参数
+ 执行测试 `npm run test`
#单元测试的时候请特别注意pushAll的测试用例，不要轻易推送测试消息给线上的所有用户。
##功能列表
1. 推送单台设备
2. 推送所有设备
3. 推送指定标签组
4. 推送消息给批量设备
5. 查询消息的发送状态
6. 查询定时消息的发送记录
7. 查询指定分类主题的发送记录
8. 查询标签组列表
9. 创建标签组
10. 删除标签组
11. 添加设备到标签组
12. 将设备从标签组移除
13. 查询标签组设备数量
14. 查询定时任务列表
15. 取消定时任务
16. 查询分类主题列表
17. 当前应用的设备统计信息
18. 查询分类主题统计信息
