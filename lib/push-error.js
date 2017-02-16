/**
 * @date 2017/2/16
 * @author xialeistudio<1065890063@qq.com>
 */
'use strict';
/**
 * 推送错误
 * @param {String} message 错误消息
 * @param {Number} code 错误码
 * @param {Number} requestId 请求ID
 * @constructor
 */
function PushError(message, code, requestId) {
  Error.call(this);
  this.message = message;
  this.code = code;
  this.requestId = requestId;
  this.name = 'PushError';
}

PushError.prototype = new Error();
module.exports = PushError;
