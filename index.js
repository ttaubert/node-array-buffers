// https://github.com/ttaubert/array-buffers
// (c) 2013 Tim Taubert <tim@timtaubert.de>
// array-buffers may be freely distributed under the MIT license.

"use strict";

module.exports = ArrayBuffers;

function ArrayBuffers(buffers) {
  if (!(this instanceof ArrayBuffers)) {
    return new ArrayBuffers(buffers);
  }

  this.length = 0;
  this.buffers = [];

  if (buffers) {
    this.push.apply(this, buffers);
  }
}

ArrayBuffers.prototype = {
  push: function () {
    for (var i = 0; i < arguments.length; i++) {
      if (!isArrayBuffer(arguments[i])) {
        throw new TypeError("Tried to push a non-ArrayBuffer.");
      }
    }

    for (var i = 0; i < arguments.length; i++) {
      var buf = arguments[i];
      this.buffers.push(buf);
      this.length += buf.byteLength;
    }

    return this.length;
  },

  unshift: function () {
    for (var i = 0; i < arguments.length; i++) {
      if (!isArrayBuffer(arguments[i])) {
        throw new TypeError("Tried to unshift a non-ArrayBuffer.");
      }
    }

    for (var i = 0; i < arguments.length; i++) {
      var buf = arguments[i];
      this.buffers.unshift(buf);
      this.length += buf.byteLength;
    }

    return this.length;
  },

  slice: function (begin, end) {
    var buffers = this.buffers;
    if (buffers.length === 0) {
      return new ArrayBuffer(0);
    }

    if (begin === undefined) {
      begin = 0;
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    // TODO handle negative indices

    var numBytes = end - begin;
    if (numBytes <= 0) {
      return new ArrayBuffer(0);
    }

    var pos = this.pos(begin);
    var index = pos.offset;

    var target = new ArrayBuffer(numBytes);
    var targetArray = new Uint8Array(target);
    var targetOffset = 0;

    for (var i = pos.buffer; numBytes > 0 && i < buffers.length; i++) {
      var buf = buffers[i];
      var length = Math.min(buf.byteLength - index, numBytes);
      targetArray.set(new Uint8Array(buf, index, length), targetOffset);

      index = 0;
      numBytes -= length;
      targetOffset += length;
    }

    return target;
  },

  copy: function (dst, dstart, start, end) {
    var dstArray = new Uint8Array(dst, dstart);
    var srcArray = new Uint8Array(this.slice(start, end));
    dstArray.set(srcArray);
  },

  pos: function (index) {
    if (index < 0 || index >= this.length) {
      throw new Error("oob");
    }

    var buffers = this.buffers;

    for (var i = 0; i < buffers.length; i++, index -= buf.byteLength) {
      var buf = buffers[i];
      if (index < buf.byteLength) {
        return {buffer: i, offset: index};
      }
    }
  },

  get: function get(index) {
    var pos = this.pos(index);
    var view = new DataView(this.buffers[pos.buffer]);
    return view.getUint8(pos.offset);
  },

  set: function set(index, val) {
    var pos = this.pos(index);
    var view = new DataView(this.buffers[pos.buffer]);
    return view.setUint8(pos.offset, val);
  },

  toBuffer: function () {
    return this.slice();
  }
};

function isArrayBuffer(obj) {
  return Object.prototype.toString.call(obj) === "[object ArrayBuffer]";
}
