/**
 * @date 2017/2/15
 * @author xialeistudio<1065890063@qq.com>
 */
'use strict';
var mocha = require('mocha');
var assert = require('assert');
var describe = mocha.describe;
var it = mocha.it;

describe('test lib/push-error.js', function () {
  var PushError = require('../lib/push-error');
  it('test constructor', function () {
    var e = new PushError('Method Not Allowed', 30601, 12345678);
    assert(e instanceof PushError);
    assert(e instanceof Error);
    assert(e.message === 'Method Not Allowed');
    assert(e.code === 30601);
    assert(e.requestId === 12345678);
  });
});

describe('test lib/index.js', function () {
  this.timeout(10000);
  var BaiduPush = require('../lib/index');
  var config = require('./push.config');
  var baiduPush = new BaiduPush(config.apiKey, config.appSecret);
  it('pushSingleDevice to IOS', function (done) {
    var message = baiduPush.buildMessageForIOS('测试', '测试内容', {
      url: 'https://www.baidu.com'
    });
    baiduPush.pushSingleDevice('4651203809675659079', message, BaiduPush.Constants.DeviceType.IOS, BaiduPush.Constants.MsgType.Notification)
      .then(function (res) {
        assert(res.response_params.send_time > 0);
        done();
      }).catch(done);
  });
  it('pushSingleDevice to Android', function (done) {
    var message = baiduPush.buildMessageForAndroid('测试', '测试内容', {
      url: 'https://www.baidu.com'
    });
    baiduPush.pushSingleDevice('3890568362655332611', message, BaiduPush.Constants.DeviceType.ANDROID, BaiduPush.Constants.MsgType.Notification)
      .then(function (res) {
        assert(res.response_params.send_time > 0);
        done();
      }).catch(done);
  });
});
