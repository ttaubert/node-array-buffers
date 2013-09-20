# array-buffers

Treat a collection of ArrayBuffers as a single contiguous ArrayBuffer.

[![browser support](http://ci.testling.com/ttaubert/node-array-buffers.png)](http://ci.testling.com/ttaubert/node-array-buffers)

[![build status](https://secure.travis-ci.org/ttaubert/node-array-buffers.png)](http://travis-ci.org/ttaubert/node-array-buffers)

This module is a clone of
[buffers](https://github.com/substack/node-buffers).
It uses the same API but works with ArrayBuffers, only.
It is supposed to be used in browsers and bundled using
[browserify](https://github.com/substack/node-browserify).

There's nothing wrong with using it for ArrayBuffers in node as well...

# examples

## slice

    function createBuffer(elems) {
      var array = new Uint8Array(new ArrayBuffer(elems.length));
      elems.forEach(function (elem, i) { array[i] = elem });
      return array.buffer;
    }

    var ArrayBuffers = require("array-buffers");
    var bufs = ArrayBuffers();
    bufs.push(createBuffer([1,2,3]));
    bufs.push(createBuffer([4,5,6,7]));
    bufs.push(createBuffer([8,9,10]));

    console.dir(bufs.slice(2,8));

output:

    $ node examples/slice.js
    <ArrayBuffer 03 04 05 06 07 08>

## splice

    function createBuffer(elems) {
      var array = new Uint8Array(new ArrayBuffer(elems.length));
      elems.forEach(function (elem, i) { array[i] = elem });
      return array.buffer;
    }

    var ArrayBuffers = require("array-buffers");
    var bufs = ArrayBuffers();
    bufs.push(createBuffer([1,2,3]));
    bufs.push(createBuffer([4,5,6,7]));
    bufs.push(createBuffer([8,9,10]));

    var removed = bufs.splice(2, 4);
    console.log(removed.slice());
    console.log(bufs.slice());

output:

    $ node examples/splice.js
    <ArrayBuffer 03 04 05 06>
    <ArrayBuffer 01 02 07 08 09 0a>

# methods

ArrayBuffers(buffers)
----------------

Create an ArrayBuffers with an array of `ArrayBuffer`s if specified, else `[]`.

.push(buf1, buf2...)
--------------------

Push buffers onto the end. Just like `Array.prototype.push`.

.unshift(buf1, buf2...)
-----------------------

Unshift buffers onto the head. Just like `Array.prototype.unshift`.

.slice(i, j)
------------

Slice a range out of the buffer collection as if it were contiguous.
Works just like the `Array.prototype.slice` version.

.splice(i, howMany, replacements)
---------------------------------

Splice the buffer collection as if it were contiguous.
Works just like `Array.prototype.splice`, even the replacement part!

.copy(dst, dstStart, start, end)
--------------------------------

Copy the buffer collection as if it were contiguous to the `dst` ArrayBuffer
with the specified bounds.

.get(i)
-------

Get a single element at index `i`.

.set(i, x)
----------

Set a single element's value at index `i`.

.indexOf(needle, offset)
----------

Find a string or buffer `needle` inside the buffer collection. Returns
the position of the search string or -1 if the search string was not
found.

Provide an `offset` to skip that number of characters at the beginning
of the search. This can be used to find additional matches.

This function will return the correct result even if the search string
is spread out over multiple internal buffers.

.toBuffer()
-----------

Convert the buffer collection to a single buffer, equivalent with `.slice(0, buffers.length)`

.toString(encoding, start, end)
-----------

Decodes and returns a string from the buffer collection.
Works just like `Buffer.prototype.toString`

# install

With [npm](https://npmjs.org) do:

```
npm install array-buffers
```

# license

MIT

