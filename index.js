// https://github.com/ttaubert/node-array-buffers
// (c) 2013 Tim Taubert <tim@timtaubert.de>
// array-buffers may be freely distributed under the MIT license.

"use strict";

var utf8 = require("to-utf8");

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
    var args = parseSliceArgs(this.length, begin, end);
    if (!args) {
      return new ArrayBuffer(0);
    }

    var target = new ArrayBuffer(args.length);
    copyInternal.call(this, target, 0, args.begin, args.length);
    return target;
  },

  splice: function (offset, howMany) {
    var num = this.length;
    offset = Math.min(num, (offset|0) || 0);
    if (offset < 0) offset += num;

    var buffers = this.buffers;
    howMany = Math.max(0, (howMany|0) || 0);

    // split an internal buffer in two
    function splitAt(pos) {
      var bufi = pos.buffer;

      if (pos.offset > 0) {
        var buf = buffers[bufi];
        var left = sliceBuffer(buf, 0, pos.offset);
        var right = sliceBuffer(buf, pos.offset);
        buffers.splice(bufi, 1, left, right);
        bufi++;
      }

      return bufi;
    }

    var bcount = 0;
    var boffset = buffers.length;

    if (offset < num) {
      var end = offset + howMany;
      bcount = -(boffset = splitAt(this.pos(offset)));
      bcount += end < num ? splitAt(this.pos(end)) : buffers.length;
    }

    var reps = [].slice.call(arguments, 2);
    var args = [boffset, bcount].concat(reps);
    var removed = buffers.splice.apply(buffers, args);

    for (var i = 0; i < reps.length; i++) {
      this.length += reps[i].byteLength;
    }

    var removedBuffers = ArrayBuffers(removed);
    this.length -= removedBuffers.length;
    return removedBuffers;
  },

  copy: function (dst, dstart, begin, end) {
    var args = parseSliceArgs(this.length, begin, end);
    if (!args) {
      return; // nothing to do
    }

    copyInternal.call(this, dst, dstart, args.begin, args.length);
  },

  pos: function (index) {
    if (index < 0 || index >= this.length) {
      throw new Error("oob");
    }

    if (!index) {
      return {buffer: 0, offset: 0};
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

  indexOf: function (needle, offset) {
    if (typeof(needle) === "string") {
      needle = createBufferFromString(needle);
    } else if (!isArrayBuffer(needle)) {
      throw new TypeError("needle must be a string or an ArrayBuffer");
    }

    if (!needle.byteLength) {
      return 0;
    }

    if (!this.length) {
      return -1;
    }

    var pos = this.pos(offset);
    var buffers = this.buffers;
    var index = offset || 0, match = 0;
    var needleArray = new Uint8Array(needle);

    for (var i = pos.buffer; i < buffers.length; i++) {
      var array = new Uint8Array(buffers[i], pos.offset);
      pos.offset = 0;

      for (var j = 0; j < array.length; j++, index++) {
        if (array[j] === needleArray[match]) {
          if (++match === needleArray.length) {
            return index - match + 1;
          }
        } else {
          match = 0;
        }
      }
    }

    return -1;
  },

  toBuffer: function () {
    return this.slice();
  },

  toString: function (encoding, start, end) {
    if (encoding && encoding != "utf8") {
      throw new Error("unsupported encoding");
    }
    return utf8(new Uint8Array(this.slice(start, end)));
  }
};

function parseSliceArgs(num, begin, end) {
  begin = (begin|0) || 0;
  end = end === (void 0) ? num : (end|0);

  if (begin < 0) begin += num;
  if (end < 0) end += num;

  if (num === 0 || begin >= num || begin >= end) {
    return null;
  }

  return {begin: begin, length: Math.min(num, end) - begin};
}

function copyInternal(dst, dstart, begin, numBytes) {
  dstart = (dstart|0) || 0;

  var buffers = this.buffers;
  var pos = this.pos(begin);
  var index = pos.offset;

  var targetArray = new Uint8Array(dst, dstart);
  var targetOffset = 0;

  for (var i = pos.buffer; numBytes > 0 && i < buffers.length; i++) {
    var buf = buffers[i];
    var length = Math.min(buf.byteLength - index, numBytes);
    targetArray.set(new Uint8Array(buf, index, length), targetOffset);

    index = 0;
    numBytes -= length;
    targetOffset += length;
  }
};

function createBufferFromString(str) {
  var buffer = new ArrayBuffer(str.length);
  var array = new Uint8Array(buffer);

  for (var i = 0; i < str.length; i++) {
    array[i] = str.charCodeAt(i);
  }

  return buffer;
}

function sliceBuffer(buf, begin, end) {
  // Use ArrayBuffer.slice when available.
  if (typeof(buf.slice) === "function") {
    if (typeof(end) === "undefined") {
      end = buf.byteLength;
    }
    return buf.slice(begin, end);
  }

  // Fallback to a custom implementation for IE.
  var args = parseSliceArgs(buf.byteLength, begin, end);
  if (!args) {
    return new ArrayBuffer(0);
  }

  var target = new ArrayBuffer(args.length);
  var targetArray = new Uint8Array(target);
  targetArray.set(new Uint8Array(buf, args.begin, args.length));
  return target;
}

function isArrayBuffer(obj) {
  return Object.prototype.toString.call(obj) === "[object ArrayBuffer]";
}
