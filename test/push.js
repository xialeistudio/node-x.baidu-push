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
  it.skip('pushSingleDevice to IOS', function (done) {
    var message = baiduPush.buildMessageForIOS('测试', '测试内容', {
      url: 'https://www.baidu.com'
    });
    baiduPush.pushSingleDevice('4651203809675659079', message, BaiduPush.Constants.DeviceType.IOS, BaiduPush.Constants.MsgType.Notification)
      .then(function (res) {
        assert(res.response_params.send_time >= 0);
        done();
      }).catch(done);
  });
  it.skip('pushSingleDevice to Android', function (done) {
    var message = baiduPush.buildMessageForAndroid('测试', '测试内容', {
      url: 'https://www.baidu.com'
    });
    baiduPush.pushSingleDevice('3890568362655332611', message, BaiduPush.Constants.DeviceType.ANDROID, BaiduPush.Constants.MsgType.Notification)
      .then(function (res) {
        assert(res.response_params.send_time >= 0);
        done();
      }).catch(done);
  });
  it.skip('pushAll', function (done) {
    var message = baiduPush.buildMessageForIOS('测试', '测试内容', {
      url: 'https://www.baidu.com'
    });
    baiduPush.pushAll(message, BaiduPush.Constants.MsgType.Notification, BaiduPush.Constants.DeviceType.IOS)
      .then(function (res) {
        assert(res.response_params.send_time >= 0);
        done();
      }).catch(done);
  });

  it.skip('pushTags', function (done) {
    var message = baiduPush.buildMessageForIOS('测试', '测试内容', {
      url: 'https://www.baidu.com'
    });
    baiduPush.pushTags('x-test', message, BaiduPush.Constants.MsgType.Notification, BaiduPush.Constants.DeviceType.IOS)
      .then(function (res) {
        assert(res.response_params.send_time >= 0);
        done();
      })
      .catch(function (e) {
        assert(e.message === 'Tag Not Found');
        done();
      });
  });
  it.skip('pushBatchDevices', function (done) {
    var message = baiduPush.buildMessageForIOS('测试', '测试内容', {
      url: 'https://www.baidu.com'
    });
    baiduPush.pushBatchDevices(['4651203809675659079'], message, BaiduPush.Constants.DeviceType.IOS, BaiduPush.Constants.MsgType.Notification)
      .then(function (res) {
        assert(res.response_params.send_time >= 0);
        done();
      }).catch(done);
  });
  it.skip('reportQueryMsgStatus', function (done) {
    baiduPush.reportQueryMsgStatus('3098627216180841684', BaiduPush.Constants.DeviceType.IOS).then(function (res) {
      assert(res.response_params.total_num >= 0);
      done();
    }).catch(done);
  });
  it.skip('reportQueryTimerRecords', function (done) {
    baiduPush.reportQueryTimerRecords('3098627216180841684', BaiduPush.Constants.DeviceType.IOS).then(function (res) {
      assert(res.response_params.result.length === 0);
      done();
    }).catch(done);
  });
  it.skip('reportQueryTopicRecords', function (done) {
    baiduPush.reportQueryTopicRecords('3098627216180841684', BaiduPush.Constants.DeviceType.IOS).then(function (res) {
      assert(res.response_params.result.length === 0);
      done();
    }).catch(done);
  });
  it.skip('appQueryTags', function (done) {
    //default -> 1886410780668447971
    baiduPush.appQueryTags(BaiduPush.Constants.DeviceType.IOS).then(function (res) {
      assert(res.response_params.result.length >= 0);
      done();
    }).catch(done);
  });
  it.skip('appCreateTag', function (done) {
    baiduPush.appCreateTag(BaiduPush.Constants.DeviceType.IOS, 'admin_ios').then(function (res) {
      assert(res.response_params.result === 0);
      done();
    }).catch(done);
  });
  it.skip('appDelTag', function (done) {
    baiduPush.appDelTag(BaiduPush.Constants.DeviceType.IOS, 'R').then(function (res) {
      assert(res.response_params.result === 0);
      done();
    }).catch(done);
  });
  it.skip('tagAddDevices', function (done) {
    baiduPush.tagAddDevices(BaiduPush.Constants.DeviceType.IOS, 'admin_ios', ['4651203809675659079']).then(function (res) {
      assert(res.response_params.result.length >= 0);
      done();
    }).catch(done);
  });
  it.skip('tagDelDevices', function (done) {
    baiduPush.tagDelDevices(BaiduPush.Constants.DeviceType.IOS, 'admin_ios', ['4651203809675659079']).then(function (res) {
      assert(res.response_params.result.length >= 0);
      done();
    }).catch(done);
  });
  it.skip('tagDeviceNum IOS', function (done) {
    baiduPush.tagDeviceNum(BaiduPush.Constants.DeviceType.IOS, 'default').then(function (res) {
      assert(res.response_params.device_num >= 0);
      done();
    }).catch(done);
  });
  it.skip('timerQueryList', function (done) {
    baiduPush.timerQueryList(BaiduPush.Constants.DeviceType.IOS).then(function (res) {
      assert(res.response_params.total_num >= 0);
      done();
    }).catch(done);
  });
  it.skip('timerCancel', function (done) {
    baiduPush.timerCancel('4651203809675659079', BaiduPush.Constants.DeviceType.IOS).then(function (res) {
      assert(res.request_id > 0);
      done();
    }).catch(function (e) {
      assert(e.code === 30605);
      done();
    });
  });
  it.skip('topicQueryList', function (done) {
    baiduPush.topicQueryList(BaiduPush.Constants.DeviceType.IOS).then(function (res) {
      assert(res.response_params.total_num >= 0);
      done();
    }).catch(done);
  });
  it.skip('reportStatisticDevice', function (done) {
    baiduPush.reportStatisticDevice(BaiduPush.Constants.DeviceType.ANDROID).then(function (res) {
      assert(res.response_params.total_num >= 0);
      done();
    }).catch(done);
  });
  it('reportStatisticTopic', function (done) {
    baiduPush.reportStatisticTopic('xx', BaiduPush.Constants.DeviceType.ANDROID).then(function (res) {
      assert(res.response_params.total_num >= 0);
      done();
    }).catch(done);
  });
});
