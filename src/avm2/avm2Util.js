/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var log = print;

var error = Shumway.Debug.error;
var assert = Shumway.Debug.assert;
var assertNotImplemented = Shumway.Debug.assertNotImplemented;
var warning = Shumway.Debug.warning;
var notImplemented = Shumway.Debug.notImplemented;
var somewhatImplemented = Shumway.Debug.somewhatImplemented;
var unexpected = Shumway.Debug.unexpected;

var defineReadOnlyProperty = Shumway.ObjectUtilities.defineReadOnlyProperty;
var createEmptyObject = Shumway.ObjectUtilities.createEmptyObject;

var makeForwardingGetter = Shumway.FunctionUtilities.makeForwardingGetter;
var makeForwardingSetter = Shumway.FunctionUtilities.makeForwardingSetter;
var bindSafely = Shumway.FunctionUtilities.bindSafely;
var cloneObject = Shumway.ObjectUtilities.cloneObject;
var copyProperties = Shumway.ObjectUtilities.copyProperties;

var SortedList = Shumway.SortedList;

/*
 * Stringify functions that try not to call |toString| inadvertently.
 */

function toSafeString(value) {
  if (typeof value === "string") {
    return "\"" + value + "\"";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return typeof value;
}

function toSafeArrayString(array) {
  var str = [];
  for (var i = 0; i < array.length; i++) {
    str.push(toSafeString(array[i]));
  }
  return str.join(", ");
}

var getLatestGetterOrSetterPropertyDescriptor = Shumway.ObjectUtilities.getLatestGetterOrSetterPropertyDescriptor;
var defineNonEnumerableGetterOrSetter = Shumway.ObjectUtilities.defineNonEnumerableGetterOrSetter;
var defineNonEnumerableGetter = Shumway.ObjectUtilities.defineNonEnumerableGetter;
var defineNonEnumerableSetter = Shumway.ObjectUtilities.defineNonEnumerableSetter;
var defineNonEnumerableProperty = Shumway.ObjectUtilities.defineNonEnumerableProperty;
var defineNonEnumerableForwardingProperty = Shumway.ObjectUtilities.defineNonEnumerableForwardingProperty;
var defineNewNonEnumerableProperty = Shumway.ObjectUtilities.defineNewNonEnumerableProperty;

var isNumeric = Shumway.isNumeric;
var isNullOrUndefined = Shumway.isNullOrUndefined;
var isPowerOfTwo = Shumway.IntegerUtilities.isPowerOfTwo;


function time(fn, count) {
  var start = performance.now();
  for (var i = 0; i < count; i++) {
    fn();
  }
  var time = (performance.now() - start) / count;
  console.info("Took: " + time.toFixed(2) + "ms.");
  return time;
}

function clamp(x, min, max) {
  if (x < min) {
    return min;
  } else if (x > max) {
    return max;
  }
  return x;
}

var fromCharCodeArray = Shumway.StringUtilities.fromCharCodeArray;


function hasOwnProperty(object, name) {
  return Object.prototype.hasOwnProperty.call(object, name);
}

/**
 * Converts an object to an array of key, value arrays.
 */
function toKeyValueArray(o) {
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var a = [];
  for (var k in o) {
    if (hasOwnProperty.call(o, k)) {
      a.push([k, o[k]]);
    }
  }
  return a;
}

/**
 * Checks for key names that don't need to be prefixed.
 * TODO: Rename this and clean up the code that deals with prefixed vs. non-prefixed key names.
 */

function boxValue(value) {
  if (isNullOrUndefined(value) || isObject(value)) {
    return value;
  }
  return Object(value);
}

function isObject(value) {
  return typeof value === "object" || typeof value === 'function';
}

function isString(value) {
  return typeof value === "string";
}

function isFunction(value) {
  return typeof value === "function";
}

function isNumber(value) {
  return typeof value === "number";
}

function toNumber(x) {
  return +x;
}

function setBitFlags(flags, flag, value) {
  return value ? flags | flag : flags & ~flag;
}

function getBitFlags(flags, flag) {
  return !!(flags & flag);
}

/**
 * Pops elements from a source array into a destination array. This avoids
 * allocations and should be faster. The elements in the destination array
 * are pushed in the same order as they appear in the source array:
 *
 * popManyInto([1, 2, 3], 2, dst) => dst = [2, 3]
 */
function popManyInto(src, count, dst) {
  release || assert(src.length >= count);
  for (var i = count - 1; i >= 0; i--) {
    dst[i] = src.pop();
  }
  dst.length = count;
}

(function () {
  function extendBuiltin(proto, prop, f) {
    if (!proto[prop]) {
      Object.defineProperty(proto, prop,
                            { value: f,
                              writable: true,
                              configurable: true,
                              enumerable: false });
    }
  }

  var Sp = String.prototype;

  function removeColors(s) {
    return s.replace(/\033\[[0-9]*m/g, "");
  }

  extendBuiltin(Sp, "padRight", function (c, n) {
    var str = this;
    var length = removeColors(str).length;
    if (!c || length >= n) {
      return str;
    }
    var max = (n - length) / c.length;
    for (var i = 0; i < max; i++) {
      str += c;
    }
    return str;
  });

  extendBuiltin(Sp, "padLeft", function (c, n) {
    var str = this;
    var length = str.length;
    if (!c || length >= n) {
      return str;
    }
    var max = (n - length) / c.length;
    for (var i = 0; i < max; i++) {
      str = c + str;
    }
    return str;
  });

  extendBuiltin(Sp, "trim", function () {
    return this.replace(/^\s+|\s+$/g,"");
  });

  extendBuiltin(Sp, "endsWith", function (str) {
    return this.indexOf(str, this.length - str.length) !== -1;
  });

  var Ap = Array.prototype;

  extendBuiltin(Ap, "popMany", function (count) {
    release || assert(this.length >= count);
    var start = this.length - count;
    var res = this.slice(start, this.length);
    this.splice(start, count);
    return res;
  });

  extendBuiltin(Ap, "pushMany", function (array) {
    for (var i = 0; i < array.length; i++) {
      this.push(array[i]);
    }
  });

  extendBuiltin(Ap, "clone", function () {
    return this.slice(0);
  });

  extendBuiltin(Ap, "first", function () {
    release || assert(this.length > 0);
    return this[0];
  });

  extendBuiltin(Ap, "last", function () {
    release || assert(this.length > 0);
    return this[this.length - 1];
  });

  extendBuiltin(Ap, "peek", function() {
    release || assert(this.length > 0);
    return this[this.length - 1];
  });

  extendBuiltin(Ap, "empty", function() {
    return this.length === 0;
  });

  extendBuiltin(Ap, "pushUnique", function(v) {
    for (var i = 0, j = this.length; i < j; i++) {
      if (this[i] === v) {
        return;
      }
    }
    this.push(v);
  });

  var uniquesMap;
  if (typeof Map !== 'undefined' && (uniquesMap = new Map()).clear) {
    extendBuiltin(Ap, "unique", function() {
      var unique = [];
      for (var i = 0; i < this.length; i++) {
        if (uniquesMap.has(this[i])) {
          continue;
        }
        unique.push(this[i]);
        uniquesMap.set(this[i], true);
      }
      uniquesMap.clear();
      return unique;
    });
  } else {
    extendBuiltin(Ap, "unique", function() {
      var unique = [];
      for (var i = 0; i < this.length; i++) {
        unique.pushUnique(this[i]);
      }
      return unique;
    });
  }

  extendBuiltin(Ap, "replace", function(x, y) {
    if (x === y) {
      return 0;
    }
    var count = 0;
    for (var i = 0; i < this.length; i++) {
      if (this[i] === x) {
        this[i] = y;
        count ++;
      }
    }
    return count;
  });

  extendBuiltin(Ap, "count", function(x) {
    var count = 0;
    for (var i = 0; i < this.length; i++) {
      if (this[i] === x) {
        count ++;
      }
    }
    return count;
  });

  extendBuiltin(Ap, "notEmpty", function() {
    return this.length > 0;
  });

  extendBuiltin(Ap, "contains", function(val) {
    return this.indexOf(val) >= 0;
  });

  extendBuiltin(Ap, "top", function() {
    return this.length && this[this.length - 1];
  });

  extendBuiltin(Ap, "mapWithIndex", function(fn) {
    var arr = [];
    for (var i = 0; i < this.length; i++) {
      arr.push(fn(this[i], i));
    }
    return arr;
  });
})();

var utf8decode = Shumway.StringUtilities.utf8decode;
var utf8encode = Shumway.StringUtilities.utf8encode;
var escapeString = Shumway.StringUtilities.escapeString;

var bitCount = Shumway.IntegerUtilities.bitCount;
var ones = Shumway.IntegerUtilities.ones;
var leadingZeros = Shumway.IntegerUtilities.leadingZeros;
var trailingZeros = Shumway.IntegerUtilities.trailingZeros;
var getFlags = Shumway.IntegerUtilities.getFlags;

/**
 * BitSet backed by a typed array. We intentionally leave out assertions for performance reasons. We
 * assume that all indices are within bounds, and that set operations are applied to equal sized sets.
 * Inspired by Maxine's BitMap.
 *
 * If the set fits in a single word, a single int is used.
 */
function BitSetFunctor(length) {
  var ADDRESS_BITS_PER_WORD = 5;
  var BITS_PER_WORD = 1 << ADDRESS_BITS_PER_WORD;
  var BIT_INDEX_MASK = BITS_PER_WORD - 1;
  var SIZE = ((length + (BITS_PER_WORD - 1)) >> ADDRESS_BITS_PER_WORD) << ADDRESS_BITS_PER_WORD;

  function BitSet() {
    /* How many bits are set. */
    this.count = 0;
    /* Do we need to recompute the count? */
    this.dirty = 0;
    /* Size of the bit array. */
    this.size = SIZE;
    /* The word array. */
    this.bits = new Uint32Array(SIZE >> ADDRESS_BITS_PER_WORD);
  }

  function BitSetS() {
    this.count = 0;
    this.dirty = 0;
    this.size = SIZE;
    this.bits = 0;
  }

  var singleword = (SIZE >> ADDRESS_BITS_PER_WORD) === 1;
  var Ctor = singleword ? BitSetS : BitSet;

  Ctor.ADDRESS_BITS_PER_WORD = ADDRESS_BITS_PER_WORD;
  Ctor.BITS_PER_WORD = BITS_PER_WORD;
  Ctor.BIT_INDEX_MASK = BIT_INDEX_MASK;
  Ctor.singleword = singleword;

  BitSet.prototype = {
    recount: function recount() {
      if (!this.dirty) {
        return;
      }

      var bits = this.bits;
      var c = 0;
      for (var i = 0, j = bits.length; i < j; i++) {
        var v = bits[i];
        v = v - ((v >> 1) & 0x55555555);
        v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
        c += ((v + (v >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
      }

      this.count = c;
      this.dirty = 0;
    },

    set: function set(i) {
      var n = i >> ADDRESS_BITS_PER_WORD;
      var old = this.bits[n];
      var b = old | (1 << (i & BIT_INDEX_MASK));
      this.bits[n] = b;
      this.dirty |= old ^ b;
    },

    setAll: function setAll() {
      var bits = this.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        bits[i] = 0xFFFFFFFF;
      }
      this.count = this.size;
      this.dirty = 0;
    },

    assign: function assign(set) {
      this.count = set.count;
      this.dirty = set.dirty;
      this.size = set.size;
      for (var i = 0, j = this.bits.length; i < j; i++) {
        this.bits[i] = set.bits[i];
      }
    },

    clear: function clear(i) {
      var n = i >> ADDRESS_BITS_PER_WORD;
      var old = this.bits[n];
      var b = old & ~(1 << (i & BIT_INDEX_MASK));
      this.bits[n] = b;
      this.dirty |= old ^ b;
    },

    get: function get(i) {
      var word = this.bits[i >> ADDRESS_BITS_PER_WORD];
      return ((word & 1 << (i & BIT_INDEX_MASK))) !== 0;
    },

    clearAll: function clearAll() {
      var bits = this.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        bits[i] = 0;
      }
      this.count = 0;
      this.dirty = 0;
    },

    _union: function _union(other) {
      var dirty = this.dirty;
      var bits = this.bits;
      var otherBits = other.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        var old = bits[i];
        var b = old | otherBits[i];
        bits[i] = b;
        dirty |= old ^ b;
      }
      this.dirty = dirty;
    },

    intersect: function intersect(other) {
      var dirty = this.dirty;
      var bits = this.bits;
      var otherBits = other.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        var old = bits[i];
        var b = old & otherBits[i];
        bits[i] = b;
        dirty |= old ^ b;
      }
      this.dirty = dirty;
    },

    subtract: function subtract(other) {
      var dirty = this.dirty;
      var bits = this.bits;
      var otherBits = other.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        var old = bits[i];
        var b = old & ~otherBits[i];
        bits[i] = b;
        dirty |= old ^ b;
      }
      this.dirty = dirty;
    },

    negate: function negate() {
      var dirty = this.dirty;
      var bits = this.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        var old = bits[i];
        var b = ~old;
        bits[i] = b;
        dirty |= old ^ b;
      }
      this.dirty = dirty;
    },

    forEach: function forEach(fn) {
      release || assert(fn);
      var bits = this.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        var word = bits[i];
        if (word) {
          for (var k = 0; k < BITS_PER_WORD; k++) {
            if (word & (1 << k)) {
              fn(i * BITS_PER_WORD + k);
            }
          }
        }
      }
    },

    toArray: function toArray() {
      var set = [];
      var bits = this.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        var word = bits[i];
        if (word) {
          for (var k = 0; k < BITS_PER_WORD; k++) {
            if (word & (1 << k)) {
              set.push(i * BITS_PER_WORD + k);
            }
          }
        }
      }
      return set;
    },

    equals: function equals(other) {
      if (this.size !== other.size) {
        return false;
      }
      var bits = this.bits;
      var otherBits = other.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        if (bits[i] !== otherBits[i]) {
          return false;
        }
      }
      return true;
    },

    contains: function contains(other) {
      if (this.size !== other.size) {
        return false;
      }
      var bits = this.bits;
      var otherBits = other.bits;
      for (var i = 0, j = bits.length; i < j; i++) {
        if ((bits[i] | otherBits[i]) !== bits[i]) {
          return false;
        }
      }
      return true;
    },

    toBitString: function toBitString(on, off) {
      on = on || "1";
      off = off || "0";
      var str = "";
      for (var i = 0; i < length; i++) {
        str += this.get(i) ? on : off;
      }
      return str;
    },

    length: length,

    toString: function toString(names) {
      var set = [];
      for (var i = 0; i < length; i++) {
        if (this.get(i)) {
          set.push(names ? names[i] : i);
        }
      }
      return set.join(", ");
    },

    isEmpty: function isEmpty() {
      this.recount();
      return this.count === 0;
    },

    clone: function clone() {
      var set = new BitSet();
      set._union(this);
      return set;
    }
  };

  BitSetS.prototype = {
    recount: function recount() {
      if (!this.dirty) {
        return;
      }

      var c = 0;
      var v = this.bits;
      v = v - ((v >> 1) & 0x55555555);
      v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
      c += ((v + (v >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;

      this.count = c;
      this.dirty = 0;
    },

    set: function set(i) {
      var old = this.bits;
      var b = old | (1 << (i & BIT_INDEX_MASK));
      this.bits = b;
      this.dirty |= old ^ b;
    },

    setAll: function setAll() {
      this.bits = 0xFFFFFFFF;
      this.count = this.size;
      this.dirty = 0;
    },

    assign: function assign(set) {
      this.count = set.count;
      this.dirty = set.dirty;
      this.size = set.size;
      this.bits = set.bits;
    },

    clear: function clear(i) {
      var old = this.bits;
      var b = old & ~(1 << (i & BIT_INDEX_MASK));
      this.bits = b;
      this.dirty |= old ^ b;
    },

    get: function get(i) {
      return ((this.bits & 1 << (i & BIT_INDEX_MASK))) !== 0;
    },

    clearAll: function clearAll() {
      this.bits = 0;
      this.count = 0;
      this.dirty = 0;
    },

    _union: function _union(other) {
      var old = this.bits;
      var b = old | other.bits;
      this.bits = b;
      this.dirty = old ^ b;
    },

    intersect: function intersect(other) {
      var old = this.bits;
      var b = old & other.bits;
      this.bits = b;
      this.dirty = old ^ b;
    },

    subtract: function subtract(other) {
      var old = this.bits;
      var b = old & ~other.bits;
      this.bits = b;
      this.dirty = old ^ b;
    },

    negate: function negate() {
      var old = this.bits;
      var b = ~old;
      this.bits = b;
      this.dirty = old ^ b;
    },

    forEach: function forEach(fn) {
      release || assert(fn);
      var word = this.bits;
      if (word) {
        for (var k = 0; k < BITS_PER_WORD; k++) {
          if (word & (1 << k)) {
            fn(k);
          }
        }
      }
    },

    toArray: function toArray() {
      var set = [];
      var word = this.bits;
      if (word) {
        for (var k = 0; k < BITS_PER_WORD; k++) {
          if (word & (1 << k)) {
            set.push(k);
          }
        }
      }
      return set;
    },

    equals: function equals(other) {
      return this.bits === other.bits;
    },

    contains: function contains(other) {
      var bits = this.bits;
      return (bits | other.bits) === bits;
    },

    isEmpty: function isEmpty() {
      this.recount();
      return this.count === 0;
    },

    clone: function clone() {
      var set = new BitSetS();
      set._union(this);
      return set;
    },

    toBitString: BitSet.prototype.toBitString,
    toString: BitSet.prototype.toString,

    length: length,
  };

  return Ctor;
}

// https://gist.github.com/958841
function base64ArrayBuffer(arrayBuffer) {
  var base64 = '';
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048 = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032 = (2^6 - 1) << 6
    d = chunk & 63; // 63 = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3 = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '==';
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008 = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15 = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '=';
  }
  return base64;
}

var Map = (function() {
  function map () {
    this.elements = {};
  }
  map.prototype.set = function set(k, v) {
    this.elements[k] = v;
  };
  map.prototype.get = function get(k) {
    if (this.has(k)) {
      return this.elements[k];
    }
    return undefined;
  };
  map.prototype.has = function has(k) {
    return Object.prototype.hasOwnProperty.call(this.elements, k);
  };
  map.prototype.remove = function remove(k) {
    if (this.has(k)) {
      delete this.elements[k];
    }
  };
  return map;
})();



(function checkWeakMap() {
  if (typeof this.WeakMap === 'function')
    return; // weak map is supported

  var id = 0;
  function WeakMap() {
    this.id = '$weakmap' + (id++);
  };
  WeakMap.prototype = {
    has: function(obj) {
      return obj.hasOwnProperty(this.id);
    },
    get: function(obj, defaultValue) {
      return obj.hasOwnProperty(this.id) ? obj[this.id] : defaultValue;
    },
    set: function(obj, value) {
      Object.defineProperty(obj, this.id, {
        value: value,
        enumerable: false,
        configurable: true
      });
    }
  };
  this.WeakMap = WeakMap;
})();

var Callback = (function () {
  function callback() {
    this.queues = {};
  }
  callback.prototype.register = function register(type, callback) {
    assert(type);
    assert(callback);
    var queue = this.queues[type];
    if (queue) {
      if (queue.indexOf(callback) > -1) {
        return;
      }
    } else {
      queue = this.queues[type] = [];
    }
    queue.push(callback);
  };
  callback.prototype.unregister = function unregister(type, callback) {
    assert(type);
    assert(callback);
    var queue = this.queues[type];
    if (!queue) {
      return;
    }
    var i = queue.indexOf(callback);
    if (i !== -1) {
      queue.splice(i, 1);
    }
    if (queue.length === 0) {
      this.queues[type] = null;
    }
  };
  callback.prototype.notify = function notify(type, /*...*/args) {
    var queue = this.queues[type];
    if (!queue) {
      return;
    }
    queue = queue.slice();
    var args = sliceArguments(arguments, 0);
    for (var i = 0; i < queue.length; i++) {
      if ($DEBUG) {
        Counter.count("callback(" + type + ").notify");
      }
      var callback = queue[i];
      callback.apply(null, args);
    }
  };
  callback.prototype.notify1 = function notify1(type, value) {
    var queue = this.queues[type];
    if (!queue) {
      return;
    }
    queue = queue.slice();
    for (var i = 0; i < queue.length; i++) {
      if ($DEBUG) {
        Counter.count("callback(" + type + ").notify1");
      }
      var callback = queue[i];
      callback(type, value);
    }
  };
  return callback;
})();

var CircularBuffer = (function () {
  var mask = 0xFFF, size = 4096;
  function circularBuffer(Type) {
    this.index = 0;
    this.start = 0;
    this.array = new Type(size);
  }
  circularBuffer.prototype.get = function (i) {
    return this.array[i];
  };
  circularBuffer.prototype.forEachInReverse = function (visitor) {
    if (this.isEmpty()) {
      return;
    }
    var i = this.index === 0 ? size - 1 : this.index - 1;
    while (i !== this.start) {
      if (visitor(this.array[i], i)) {
        break;
      }
      i = i === 0 ? size - 1 : i - 1;
    }
  };
  circularBuffer.prototype.write = function (value) {
    this.array[this.index] = value;
    this.index = (this.index + 1) & mask;
    if (this.index === this.start) {
      this.start = (this.start + 1) & mask;
    }
  };
  circularBuffer.prototype.isFull = function () {
    return (this.index + 1) & mask === this.start;
  };
  circularBuffer.prototype.isEmpty = function () {
    return this.index === this.start;
  };
  return circularBuffer;
})();

function lazyClass(holder, name, initialize) {
  Object.defineProperty(holder, name, {
    get: function () {
      var start = performance.now();
      var value = initialize();
      print("Initialized Class: " + name + " " + (performance.now() - start).toFixed(4));
      assert (value);
      Object.defineProperty(holder, name, { value: value, writable: true });
      return value;
    }, configurable: true
  });
}

function createNewCompartment() {
  return newGlobal('new-compartment');
}

var hashBytesTo32BitsAdler = Shumway.HashUtilities.hashBytesTo32BitsAdler;
var hashBytesTo32BitsMD5 = Shumway.HashUtilities.hashBytesTo32BitsMD5;


function encodeInt32(n) {
  var a = (n >> 30) & 0x3;
  var b = (n & 0x7000000) >> 24; // 0x7000000 = (2^6 - 1) << 24
  var c = (n & 0x1C0000) >> 18; // 0x1C0000 = (2^6 - 1) << 18
  var d = (n & 0x3F000) >> 12; // 0x3F000 = (2^6 - 1) << 12
  var e = (n & 0xFC0) >> 6; // 0xFC0 = (2^6 - 1) << 6
  var f = (n & 0x3F); // 0x3F = 2^6 - 1
  return toEncoding(a) + toEncoding(b) + toEncoding(c) +
    toEncoding(d) + toEncoding(e) + toEncoding(f);
}

var variableLengthEncodeInt32 = Shumway.StringUtilities.variableLengthEncodeInt32;
var fromEncoding = Shumway.StringUtilities.fromEncoding;
var variableLengthDecodeIdentifier = Shumway.StringUtilities.variableLengthDecodeInt32;
var toEncoding = Shumway.StringUtilities.toEncoding;