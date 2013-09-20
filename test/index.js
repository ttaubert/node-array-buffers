// https://github.com/ttaubert/node-array-buffers
// (c) 2013 Tim Taubert <tim@timtaubert.de>
// array-buffers may be freely distributed under the MIT license.

"use strict";

var test = require("tape");
var ArrayBuffers = require("../");

function create(bytes) {
  var buffer = new ArrayBuffer(bytes.length);
  var array = new Uint8Array(buffer);

  for (var i = 0; i < bytes.length; i++) {
    array[i] = typeof(bytes) === "string" ? bytes.charCodeAt(i) : bytes[i];
  }

  return buffer;
}

function create2(xs, split) {
  var bufs = ArrayBuffers();
  var offset = 0;

  split.forEach(function (i) {
    bufs.push(create(xs.slice(offset, offset + i)));
    offset += i;
  });

  return bufs;
}

function deepEqual(t, xs, ys, msg) {
  function conv(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (data instanceof ArrayBuffers) {
      data = data.slice();
    }

    var vals = [];
    var array = new Uint8Array(data);

    for (var i = 0; i < array.length; i++) {
      vals.push(array[i]);
    }

    return vals;
  }

  t.deepEqual(conv(xs), conv(ys), msg);
}

test("push", function (t) {
  var bufs = ArrayBuffers();
  bufs.push(create([0]));
  t.equal(bufs.push(create([1,2,3])), 4);

  bufs.push(create([4,5]));
  t.equal(bufs.push(create([6,7,8,9])), 10);

  deepEqual(t, bufs.slice(), [0,1,2,3,4,5,6,7,8,9]);

  t.throws(function () {
    bufs.push(create([11,12]), "moo");
  });

  t.equal(bufs.buffers.length, 4);
  t.end();
});

test("unshift", function (t) {
  var bufs = ArrayBuffers();
  bufs.unshift(create([6,7,8,9]));
  t.equal(bufs.unshift(create([4,5])), 6);

  bufs.unshift(create([1,2,3]));
  bufs.unshift(create([0]));
  t.equal(bufs.unshift(create([99]), create([100])), 12);

  deepEqual(t, bufs.slice(), [100,99,0,1,2,3,4,5,6,7,8,9]);

  t.throws(function () {
    bufs.unshift(create([-2,-1]), "moo");
  });

  t.equal(bufs.buffers.length, 6);
  t.end();
});

test("get", function (t) {
  var bufs = ArrayBuffers();
  bufs.unshift(create([6,7,8,9]));
  bufs.unshift(create([4,5]));
  bufs.unshift(create([1,2,3]));
  bufs.unshift(create([0]));

  t.equal(bufs.get(0), 0);
  t.equal(bufs.get(1), 1);
  t.equal(bufs.get(2), 2);
  t.equal(bufs.get(3), 3);
  t.equal(bufs.get(4), 4);
  t.equal(bufs.get(5), 5);
  t.equal(bufs.get(6), 6);
  t.equal(bufs.get(7), 7);
  t.equal(bufs.get(8), 8);
  t.equal(bufs.get(9), 9);

  t.end();
});

test("set", function (t) {
  var bufs = ArrayBuffers();
  bufs.push(create("Hel"));
  bufs.push(create("lo"));
  bufs.push(create("!"));

  bufs.set(0, "h".charCodeAt(0));
  bufs.set(3, "L".charCodeAt(0));
  bufs.set(5, ".".charCodeAt(0));

  t.equal(bufs.buffers.length, 3);
  t.equal(bufs.toString(), "helLo.");

  t.end();
});

test("slice", function (t) {
  var xs = [0,1,2,3,4,5,6,7,8,9];
  var splits = [[4,2,3,1], [2,2,2,2,2], [1,6,3,1], [9,2], [10], [5,5]];

  splits.forEach(function (split) {
    var bufs = create2(xs, split);
    deepEqual(t, bufs.slice(), xs);

    for (var i = 0; i < xs.length; i++) {
      for (var j = i; j < xs.length; j++) {
        var a = bufs.slice(i, j);
        var b = xs.slice(i, j);
        deepEqual(t, a, b);
      }
    }
  });

  t.end();
});

test("slice 2", function (t) {
  var bufs = ArrayBuffers();
  bufs.push(create([0,1,2]), create([3,4,5]), create([6,7,8]));

  deepEqual(t, bufs.slice(2, 5), [2,3,4]);
  deepEqual(t, bufs.slice(-4, -2), [5,6]);
  deepEqual(t, bufs.slice(2, 2), []);
  deepEqual(t, bufs.slice(2, 1), []);
  deepEqual(t, bufs.slice(-4), [5,6,7,8]);

  t.end();
});

test("copy", function (t) {
  var xs = [0,1,2,3,4,5,6,7,8,9];
  var splits = [[4,2,3,1], [2,2,2,2,2], [1,6,3,1], [9,2], [10], [5,5]];

  splits.forEach(function (split) {
    var bufs = create2(xs, split);
    var buf = create(xs);

    for (var i = 0; i < xs.length; i++) {
      for (var j = i; j < xs.length; j++) {
        var t0 = new ArrayBuffer(j - i);
        var t1 = new ArrayBuffer(j - i);

        bufs.copy(t0, 0, i, j);
        new Uint8Array(t1).set(new Uint8Array(buf.slice(i, j)));
        deepEqual(t, t0, t1);
      }
    }
  });

  t.end();
});

test("indexOf", function (t) {
  var bufs = ArrayBuffers();
  bufs.push(create("Hel"));
  bufs.push(create("lo,"));
  bufs.push(create(" how are "));
  bufs.push(create("you"));
  bufs.push(create("?"));

  t.equal(bufs.indexOf("Hello"), 0);
  t.equal(bufs.indexOf("Hello", 1), -1);
  t.equal(bufs.indexOf("ello"), 1);
  t.equal(bufs.indexOf("ello", 1), 1);
  t.equal(bufs.indexOf("ello", 2), -1);
  t.equal(bufs.indexOf("e"), 1);
  t.equal(bufs.indexOf("e", 2), 13);
  t.equal(bufs.indexOf(create([0x65]), 2), 13);

  t.end();
});

test("splice", function (t) {
  var bufs = ArrayBuffers([create([0,1]), create([2,3])]);

  // do nothing
  bufs.splice(0, 0);
  deepEqual(t, bufs, [0,1,2,3]);

  // append at the end
  bufs.splice(4, 0, create([4,5]));
  deepEqual(t, bufs, [0,1,2,3,4,5]);

  // insert at the beginning
  bufs.splice(0, 0, create([6,7]));
  deepEqual(t, bufs, [6,7,0,1,2,3,4,5]);

  // insert in the middle
  bufs.splice(4, 0, create([8,9]));
  deepEqual(t, bufs, [6,7,0,1,8,9,2,3,4,5]);

  // check lengths
  deepEqual(t, bufs.buffers.length, 5);
  deepEqual(t, bufs.length, 10);

  // replace at the beginning
  var rem = bufs.splice(0, 2, create([99]));
  deepEqual(t, bufs, [99,0,1,8,9,2,3,4,5]);
  deepEqual(t, rem, [6,7]);

  rem = bufs.splice(0, 2, create([98]));
  deepEqual(t, bufs, [98,1,8,9,2,3,4,5]);
  deepEqual(t, rem, [99,0]);

  // replace at the end
  rem = bufs.splice(-3, 3, create([99,100,101]));
  deepEqual(t, bufs, [98,1,8,9,2,99,100,101]);
  deepEqual(t, rem, [3,4,5]);
  deepEqual(t, bufs.length, 8);

  // replace in the middle
  rem = bufs.splice(1, 2, create([7,7,7]));
  deepEqual(t, bufs, [98,7,7,7,9,2,99,100,101]);

  t.end();
});

test("splice 2", function (t) {
  var xs = [0,1,2,3,4,5,6,7,8,9];
  var splits = [[4,2,3,1], [2,2,2,2,2], [1,6,3,1], [9,2], [10], [5,5]];

  splits.forEach(function (split) {
    for (var i = 0; i < xs.length; i++) {
      for (var j = i; j < xs.length; j++) {
        var bufs = create2(xs, split);
        var xs_ = xs.slice();

        var a = bufs.splice(i, j);
        var b = xs_.splice(i, j);
        deepEqual(t, a, b);
        deepEqual(t, bufs.slice(), create(xs_));
      }
    }
  });

  t.end();
});

test("splice 3", function (t) {
  var xs = [0,1,2,3,4,5,6,7,8,9];
  var splits = [[4,2,3,1], [2,2,2,2,2], [1,6,3,1], [9,2], [10], [5,5]];
  var reps = [[], [1], [5,6], [3,1,3,3,7], [9,8,7,6,5,4,3,2,1,2,3,4,5]];

  splits.forEach(function (split) {
    reps.forEach(function (rep) {
      for (var i = 0; i < xs.length; i++) {
        for (var j = i; j < xs.length; j++) {
          var bufs = create2(xs, split);
          var xs_ = xs.slice();

          var a = bufs.splice.apply(
            bufs, [i, j].concat(create(rep))
          );

          var b = xs_.splice.apply(xs_, [i, j].concat(rep));

          deepEqual(t, a, b);
          deepEqual(t, bufs.slice(), create(xs_));
        }
      }
    });
  });

  t.end();
});
