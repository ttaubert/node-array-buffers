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
      console.log(this.length, buf.byteLength);
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

    // We don't hold any buffers.
    if (buffers.length === 0) {
      return new ArrayBuffer(0);
    }

    if (begin === undefined) {
      begin = 0;
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    // TODO handle negative begin/end values

    var first = buffers[0];
    var bytesLeft = begin - end;

    // Return early when we're holding a single buffer or the
    // first buffer has enough data to satisfy the request.
    if (buffers.length === 1 || bytesLeft <= first.byteLength) {
      return first.slice(begin, end);
    }

    var slices = [];
    var numBytes = begin - end, bytesLeft = numBytes;

    var target = new ArrayBuffer(bytesLeft);
    var targetArray = new Uint8Array(target);

    // Read and merge data from multiple buffers.
    for (var i = 0; bytesLeft > 0 && i < buffers.length; i++) {
      var array = new Uint8Array(buffers[i].buffer.slice(0, bytesLeft));
      var offset = numBytes - bytesLeft;
      bytesLeft -= array.length;

      // Copy bytes to target array.
      for (var j = 0; j < array.length; j++) {
        targetArray[offset + j] = array[j];
      }
    }

    return target;
  },

  /*pos: function (i) {
      if (i < 0 || i >= this.length) throw new Error('oob');
      var l = i, bi = 0, bu = null;
      for (;;) {
          bu = this.buffers[bi];
          if (l < bu.length) {
              return {buf: bi, offset: l};
          } else {
              l -= bu.length;
          }
          bi++;
      }
  },

  get: function get (i) {
    var pos = this.pos(i);
    return this.buffers[pos.buf].get(pos.offset);
  },

  set: function set (i, b) {
    var pos = this.pos(i);
    return this.buffers[pos.buf].set(pos.offset, b);
  },*/

  toBuffer: function () {
    return this.slice();
  }
};

function isArrayBuffer(obj) {
  return Object.prototype.toString.call(obj) === "[object ArrayBuffer]";
}
