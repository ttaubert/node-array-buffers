// https://github.com/ttaubert/array-buffers
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
  t.equal(xs.byteLength, ys.length);

  var array = new Uint8Array(xs);
  var xsvals = [];

  for (var i = 0; i < array.length; i++) {
    xsvals.push(array[i]);
  }

  t.deepEqual(xsvals, ys, msg);
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
  t.equal(bufs.get(0), "h".charCodeAt(0));
  t.equal(bufs.get(3), "L".charCodeAt(0));
  t.equal(bufs.get(5), ".".charCodeAt(0));

  t.end();
});

test("slice", function (t) {
  var xs = [0,1,2,3,4,5,6,7,8,9];
  var splits = [ [4,2,3,1], [2,2,2,2,2], [1,6,3,1], [9,2], [10], [5,5] ];

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

/*test('splice', function (t) {
    var xs = [0,1,2,3,4,5,6,7,8,9];
    var splits = [ [4,2,3,1], [2,2,2,2,2], [1,6,3,1], [9,2], [10], [5,5] ];
    
    splits.forEach(function (split) {
        for (var i = 0; i < xs.length; i++) {
            for (var j = i; j < xs.length; j++) {
                var bufs = create(xs, split);
                var xs_ = xs.slice();
                
                var a_ = bufs.splice(i,j);
                var a = [].slice.call(a_.slice());
                var b = xs_.splice(i,j);
                deepEqual(t, a, b,
                    '[' + a.join(',') + ']'
                        + ' != ' + 
                    '[' + b.join(',') + ']'
                );
                
                deepEqual(t, bufs.slice(), new Buffer(xs_),
                    '[' + [].join.call(bufs.slice(), ',') + ']'
                        + ' != ' + 
                    '[' + [].join.call(xs_, ',') + ']'
                );
            }
        }
    });
    t.end();
});

test('splice rep', function (t) {
    var xs = [0,1,2,3,4,5,6,7,8,9];
    var splits = [ [4,2,3,1], [2,2,2,2,2], [1,6,3,1], [9,2], [10], [5,5] ];
    var reps = [ [], [1], [5,6], [3,1,3,3,7], [9,8,7,6,5,4,3,2,1,2,3,4,5] ];
    
    splits.forEach(function (split) {
        reps.forEach(function (rep) {
            for (var i = 0; i < xs.length; i++) {
                for (var j = i; j < xs.length; j++) {
                    var bufs = create(xs, split);
                    var xs_ = xs.slice();
                    
                    var a_ = bufs.splice.apply(
                        bufs, [ i, j ].concat(new Buffer(rep))
                    );
                    var a = [].slice.call(a_.slice());
                    var b = xs_.splice.apply(xs_, [ i, j ].concat(rep));
                    
                    deepEqual(t, a, b,
                        '[' + a.join(',') + ']'
                            + ' != ' + 
                        '[' + b.join(',') + ']'
                    );
                    
                    deepEqual(t, bufs.slice(), new Buffer(xs_),
                        '[' + [].join.call(bufs.slice(), ',') + ']'
                            + ' != ' + 
                        '[' + [].join.call(xs_, ',') + ']'
                    );
                }
            }
        });
    });
    t.end();
}); 

test('copy', function (t) {
    var xs = [0,1,2,3,4,5,6,7,8,9];
    var splits = [ [4,2,3,1], [2,2,2,2,2], [1,6,3,1], [9,2], [10], [5,5] ];
    
    splits.forEach(function (split) {
        var bufs = create(xs, split);
        var buf = new Buffer(xs);
        
        for (var i = 0; i < xs.length; i++) {
            for (var j = i; j < xs.length; j++) {
                var t0 = new Buffer(j - i);
                var t1 = new Buffer(j - i);
                
                deepEqual(
                    t,
                    bufs.copy(t0, 0, i, j),
                    buf.copy(t1, 0, i, j)
                );
                
                deepEqual(t, t0, t1);
            }
        }
    });
    t.end();
});

test('indexOf', function (t) {
    var bufs = Buffers();
    bufs.push(new Buffer("Hel"));
    bufs.push(new Buffer("lo,"));
    bufs.push(new Buffer(" how are "));
    bufs.push(new Buffer("you"));
    bufs.push(new Buffer("?"));
    t.equal( bufs.indexOf("Hello"), 0 );
    t.equal( bufs.indexOf("Hello", 1), -1 );
    t.equal( bufs.indexOf("ello"), 1 );
    t.equal( bufs.indexOf("ello", 1), 1 );
    t.equal( bufs.indexOf("ello", 2), -1 );
    t.equal( bufs.indexOf("e"), 1 );
    t.equal( bufs.indexOf("e", 2), 13 );
    t.equal( bufs.indexOf(new Buffer([0x65]), 2), 13 );
    t.end();
});*/
