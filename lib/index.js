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
 * 推送单台终端
 * @param {String} channelId 设备标识
 * @param {Object} msg 消息内容
 * @param {Number} deviceType 设备类型
 * @param {Number} msgType 消息类型
 * @param {Number} deployStatus IOS部署状态
 * @param {Number} msgExpires 过期时间
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

module.exports = BaiduPush;
