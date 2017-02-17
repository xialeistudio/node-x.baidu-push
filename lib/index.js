/**
 * @date 2017/2/16
 * @author xialeistudio<1065890063@qq.com>
 */
'use strict';
var qs = require('querystring');
var fetch = require('node-fetch');
var debug = require('debug')('x.baidu-push');
var packageInfo = require('../package.json');
var os = require('os');
var crypto = require('crypto');
var PushError = require('./push-error');

/**
 * 基础接口
 * @type {string}
 */
var baseURL = 'https://api.tuisong.baidu.com/rest/3.0';
/**
 * 构造方法
 * @param {String} apiKey
 * @param {String} appSecret
 * @constructor
 */
function BaiduPush(apiKey, appSecret) {
  this._apiKey = apiKey;
  this._appSecret = appSecret;
  debug('initialize', {
    apiKey: this._apiKey,
    appSecret: this._appSecret
  });
}
/**
 * 常量
 * @type {Object}
 */
BaiduPush.Constants = {
  DeviceType: {// 设备类型
    ANDROID: 3,// 安卓
    IOS: 4// IOS
  },
  DeployStatus: {// IOS应用部署状态
    Development: 1,// 开发状态
    Production: 2// 生产状态（默认）
  },
  MsgType: {// 消息类型
    Message: 0,// 消息（默认）
    Notification: 1// 通知
  }
};
/**
 * MD5加密
 * @param {*} data 待加密数据
 * @return {String} 密钥
 */
BaiduPush.prototype.md5 = function (data) {
  var md5 = crypto.createHash('md5');
  md5.update(data);
  return md5.digest('hex');
};
/**
 * 获取请求格式
 * @return {String}
 */
BaiduPush.prototype.getContentType = function () {
  return 'application/x-www-form-urlencoded;charset=utf-8';
};
/**
 * 获取UserAgent信息
 * @return {String}
 */
BaiduPush.prototype.getUserAgent = function () {
  var nodeVersion = process.version;
  var userAgent = 'BCCS_SDK/3.0 (' + os.type() + '; ' + os.release() + '; ' + os.arch() + ') NodeJs/' + nodeVersion + ' (' + packageInfo.name + '/' + packageInfo.version + ')';
  debug('getUserAgent', userAgent);
  return userAgent;
};
/**
 * URL编码
 * @param {String} string 待编码字符串
 * @return {String} 编码
 */
BaiduPush.prototype.encodeURIComponent = function (string) {
  var rv = encodeURIComponent(string).replace(/[!'()*~]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
  return rv.replace(/%20/g, '+');
};
/**
 * 请求签名
 * @param {String} apiName API名称 /test/echo
 * @param {Object} postFields POST数据
 * @return {String} 签名结果
 */
BaiduPush.prototype.sign = function (apiName, postFields) {
  var method = 'POST';
  var params = {};
  if (postFields !== undefined) {
    Object.keys(postFields).forEach(function (key) {
      params[key] = postFields[key];
    });
  }
  var string = '';
  Object.keys(params).sort().forEach(function (key) {
    string += key + '=' + params[key];
  });
  string = method + baseURL + apiName + string + this._appSecret;
  var sign = this.md5(this.encodeURIComponent(string));
  debug('signString', string, sign);
  return sign;
};
/**
 * 获取请求参数
 * @param {String} apiName API名称 /test/echo
 * @param {Object} postFields POST数据
 * @return {Object} 请求参数
 */
BaiduPush.prototype.getRequestParams = function (apiName, postFields) {
  postFields.apikey = this._apiKey;
  postFields.timestamp = parseInt(Date.now() / 1000, 10);
  postFields.sign = this.sign(apiName, postFields);
  return postFields;
};
/**
 * 请求API
 * @param {String} apiName API名称
 * @param {Object} postFields 请求参数
 * @return {Promise}
 */
BaiduPush.prototype.request = function (apiName, postFields) {
  postFields = this.getRequestParams(apiName, postFields);
  var body = qs.stringify(postFields);
  return fetch(baseURL + apiName, {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': this.getContentType(),
      'User-Agent': this.getUserAgent(),
      'Content-Length': body.length
    }
  }).then(function (res) {
    return res.json();
  }).then(function (res) {
    debug('request', body, res);
    if (res.error_code !== undefined && res.error_code > 0) {
      throw new PushError(res.error_msg, res.error_code, res.request_id);
    }
    return res;
  }).catch(function (e) {
    throw e;
  });
};
/**
 * 生成Android设备所用消息
 * @param {String} title 推送标题
 * @param {String} description 推送内容
 * @param {Object} params 推送额外参数
 * @return {Object} 消息体
 */
BaiduPush.prototype.buildMessageForAndroid = function (title, description, params) {
  var data = {
    title: title,
    description: description,
    notification_basic_style: 7,
    custom_content: {}
  };
  Object.keys(params).forEach(function (key) {
    data.custom_content[key] = params[key];
  });
  return params;
};
/**
 * 生成IOS设备所用消息
 * @param {String} title 推送标题
 * @param {String} description 推送内容
 * @param {Object} params 推送额外参数
 * @return {Object} 消息体
 */
BaiduPush.prototype.buildMessageForIOS = function (title, description, params) {
  var data = {
    aps: {
      alert: description,
      sound: 'default'
    }
  };
  Object.keys(params).forEach(function (key) {
    data[key] = params[key];
  });
  return data;
};

/**
 * 推送单台设备
 * @param {String} channelId 设备标识
 * @param {Object} msg 消息内容
 * @param {Number} deviceType 设备类型
 * @param {Number} msgType 消息类型
 * @param {Number} deployStatus IOS部署状态
 * @param {Number} msgExpires 过期时间
 * @return {Promise}
 */
BaiduPush.prototype.pushSingleDevice = function (channelId, msg, deviceType, msgType, deployStatus, msgExpires) {
  var params = {
    channel_id: channelId,
    msg: JSON.stringify(msg),
    device_type: deviceType
  };
  if (msgType !== undefined) {
    params.msg_type = msgType;
  }
  if (deployStatus !== undefined) {
    params.deploy_status = deployStatus;
  }
  if (msgExpires !== undefined) {
    params.msg_expires = msgExpires;
  }
  return this.request('/push/single_device', params);
};
/**
 * 推送所有设备
 * @param {Object} msg 消息内容
 * @param {Number} msgType 消息类型
 * @param {Number} deviceType 设备类型
 * @param {Number} deployStatus IOS部署状态
 * @param {Number} msgExpires 过期时间
 * @param {Number} sendTime 定时推送，用于指定的实际发送时间
 * @return {Promise}
 */
BaiduPush.prototype.pushAll = function (msg, msgType, deviceType, deployStatus, msgExpires, sendTime) {
  var params = {
    msg: JSON.stringify(msg),
    device_type: deviceType
  };
  if (msgType !== undefined) {
    params.msg_type = msgType;
  }
  if (deployStatus !== undefined) {
    params.deploy_status = deployStatus;
  }
  if (msgExpires !== undefined) {
    params.msg_expires = msgExpires;
  }
  if (sendTime !== undefined) {
    params.send_time = sendTime;
  }
  return this.request('/push/all', params);
};
/**
 * 推送指定标签组
 * @param {String} tag 标签名称
 * @param {Object} msg 消息内容
 * @param {Number} deviceType 设备类型
 * @param {Number} msgType 消息类型
 * @param {Number} tagType 标签类型
 * @param {Number} deployStatus IOS部署状态
 * @param {Number} msgExpires 过期时间
 * @param {Number} sendTime 定时推送，用于指定的实际发送时间
 * @return {Promise}
 */
BaiduPush.prototype.pushTags = function (tag, msg, msgType, deviceType, tagType, deployStatus, msgExpires, sendTime) {
  var params = {
    msg: JSON.stringify(msg),
    tag: tag,
    type: 1,
    device_type: deviceType
  };
  if (msgType !== undefined) {
    params.msg_type = msgType;
  }
  if (deployStatus !== undefined) {
    params.deploy_status = deployStatus;
  }
  if (msgExpires !== undefined) {
    params.msg_expires = msgExpires;
  }
  if (sendTime !== undefined) {
    params.send_time = sendTime;
  }
  return this.request('/push/tags', params);
};
/**
 * 推送消息给批量设备（批量单播）
 * @param {Array} channelIds 设备标识
 * @param {Object} msg 消息内容
 * @param {Number} deviceType 设备类型
 * @param {Number} msgType 消息类型
 * @param {Number} deployStatus IOS部署状态
 * @param {Number} msgExpires 过期时间
 * @param {String} topicId 分类主题名称
 * @return {Promise}
 */
BaiduPush.prototype.pushBatchDevices = function (channelIds, msg, deviceType, msgType, deployStatus, msgExpires, topicId) {
  var params = {
    channel_ids: JSON.stringify(channelIds),
    msg: JSON.stringify(msg),
    device_type: deviceType
  };
  if (msgType !== undefined) {
    params.msg_type = msgType;
  }
  if (deployStatus !== undefined) {
    params.deploy_status = deployStatus;
  }
  if (msgExpires !== undefined) {
    params.msg_expires = msgExpires;
  }
  if (topicId !== undefined) {
    params.topic_id = topicId;
  }
  return this.request('/push/batch_device', params);
};
/**
 * 查询消息的发送状态
 * @param {String} msgId 消息ID
 * @param {Number} deviceType 设备类型
 * @return {Promise}
 */
BaiduPush.prototype.reportQueryMsgStatus = function (msgId, deviceType) {
  var params = {
    msg_id: msgId,
    device_type: deviceType
  };
  return this.request('/report/query_msg_status', params);
};
/**
 * 查询定时消息的发送记录
 * @param {String} timerId 定时任务ID
 * @param {Number} deviceType 推送设备类型
 * @param {Number} start 指定返回记录的起始索引位置
 * @param {Number} limit 返回的记录条数
 * @param {Number} rangeStart 指定查询起始时间范围，unix时间戳
 * @param {Number} rangeEnd  指定查询截止时间范围，unix时间戳
 * @return {Promise}
 */
BaiduPush.prototype.reportQueryTimerRecords = function (timerId, deviceType, start, limit, rangeStart, rangeEnd) {
  var params = {
    timer_id: timerId,
    device_type: deviceType
  };
  if (start !== undefined) {
    params.start = start;
  }
  if (limit !== undefined) {
    params.limit = limit;
  }
  if (rangeStart !== undefined) {
    params.range_start = rangeStart;
  }
  if (rangeEnd !== undefined) {
    params.range_end = rangeEnd;
  }
  return this.request('/report/query_timer_records', params);
};
/**
 * 查询指定分类主题的发送记录
 * @param {String} topicId 分类主题名称
 * @param {Number} deviceType 推送设备类型
 * @param {Number} start 指定返回记录的起始索引位置
 * @param {Number} limit 返回的记录条数
 * @param {Number} rangeStart 指定查询起始时间范围，unix时间戳
 * @param {Number} rangeEnd  指定查询截止时间范围，unix时间戳
 * @return {Promise}
 */
BaiduPush.prototype.reportQueryTopicRecords = function (topicId, deviceType, start, limit, rangeStart, rangeEnd) {
  var params = {
    topic_id: topicId,
    device_type: deviceType
  };
  if (start !== undefined) {
    params.start = start;
  }
  if (limit !== undefined) {
    params.limit = limit;
  }
  if (rangeStart !== undefined) {
    params.range_start = rangeStart;
  }
  if (rangeEnd !== undefined) {
    params.range_end = rangeEnd;
  }
  return this.request('/report/query_topic_records', params);
};
/**
 * 查询标签组列表
 * @param {Number} deviceType 设备类型
 * @param {String} tag 标签名称
 * @param {Number} start 指定返回记录的起始索引位置
 * @param {Number} limit 返回的记录条数
 * @return {Promise}
 */
BaiduPush.prototype.appQueryTags = function (deviceType, tag, start, limit) {
  var params = {
    device_type: deviceType
  };
  if (tag !== undefined) {
    params.tag = tag;
  }
  if (start !== undefined) {
    params.start = start;
  }
  if (limit !== undefined) {
    params.limit = limit;
  }
  return this.request('/app/query_tags', params);
};
/**
 * 创建标签组
 * @param {Number} deviceType 设备类型
 * @param {String} tag 标签名称
 * @return {Promise}
 */
BaiduPush.prototype.appCreateTag = function (deviceType, tag) {
  var params = {
    device_type: deviceType,
    tag: tag
  };
  return this.request('/app/create_tag', params);
};
/**
 * 删除标签组
 * @param {Number} deviceType 设备类型
 * @param {String} tag 标签名称
 * @return {Promise}
 */
BaiduPush.prototype.appDelTag = function (deviceType, tag) {
  var params = {
    device_type: deviceType,
    tag: tag
  };
  return this.request('/app/del_tag', params);
};
/**
 * 添加设备到标签组
 * @param {Number} deviceType 设备类型
 * @param {String} tag 标签名称
 * @param {Array} channelIds 设备ID列表
 * @return {Promise}
 */
BaiduPush.prototype.tagAddDevices = function (deviceType, tag, channelIds) {
  var params = {
    device_type: deviceType,
    tag: tag,
    channel_ids: JSON.stringify(channelIds)
  };
  return this.request('/tag/add_devices', params);
};
/**
 * 将设备从标签组中移除
 * @param {Number} deviceType 设备类型
 * @param {String} tag 标签名称
 * @param {Array} channelIds 设备ID列表
 * @return {Promise}
 */
BaiduPush.prototype.tagDelDevices = function (deviceType, tag, channelIds) {
  var params = {
    device_type: deviceType,
    tag: tag,
    channel_ids: JSON.stringify(channelIds)
  };
  return this.request('/tag/del_devices', params);
};
/**
 * 查询标签组设备数量
 * @param {Number} deviceType 设备类型
 * @param {String} tag 标签名称
 * @return {Promise}
 */
BaiduPush.prototype.tagDeviceNum = function (deviceType, tag) {
  var params = {
    device_type: deviceType,
    tag: tag
  };
  return this.request('/tag/device_num', params);
};
/**
 * 查询定时任务列表
 * @param {Number} deviceType 设备类型
 * @param {String} timerId 推送接口返回的timer_id唯一标识一个定时推送任务
 * @param {Number} start  指定返回记录的起始索引位置
 * @param {Number} limit  返回的记录条数
 * @return {Promise}
 */
BaiduPush.prototype.timerQueryList = function (deviceType, timerId, start, limit) {
  var params = {
    device_type: deviceType
  };
  if (timerId !== undefined) {
    params.timer_id = timerId;
  }
  if (start !== undefined) {
    params.start = start;
  }
  if (limit !== undefined) {
    params.limit = limit;
  }
  return this.request('/timer/query_list', params);
};
/**
 * 取消定时任务
 * @param {String} timerId 取消尚未执行的定时推送任务
 * @param {Number} deviceType 设备类型
 * @return {Promise}
 */
BaiduPush.prototype.timerCancel = function (timerId, deviceType) {
  var params = {
    timer_id: timerId,
    device_type: deviceType
  };
  return this.request('/timer/cancel', params);
};
/**
 * 查询分类主题列表
 * @param {Number} deviceType 设备类型
 * @param start
 * @param limit
 * @return {Promise}
 */
BaiduPush.prototype.topicQueryList = function (deviceType, start, limit) {
  var params = {
    device_type: deviceType
  };
  if (start !== undefined) {
    params.start = start;
  }
  if (limit !== undefined) {
    params.limit = limit;
  }
  return this.request('/topic/query_list', params);
};
/**
 * 当前应用的设备统计信息
 * @param {Number} deviceType 设备类型
 * @return {Promise}
 */
BaiduPush.prototype.reportStatisticDevice = function (deviceType) {
  var params = {
    device_type: deviceType
  };
  return this.request('/report/statistic_device', params);
};
/**
 * 查询分类主题统计信息
 * @param {String} topicId 一个已使用过的分类主题
 * @param {Number} deviceType 设备类型
 * @return {Promise}
 */
BaiduPush.prototype.reportStatisticTopic = function (topicId, deviceType) {
  var params = {
    device_type: deviceType,
    topic_id: topicId
  };
  return this.request('/report/statistic_topic', params);
};
module.exports = BaiduPush;
