(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global['localstorage-cache'] = factory());
}(this, (function () { 'use strict';

// http://www.alloyteam.com/2013/12/js-calculate-the-number-of-bytes-occupied-by-a-string/
var sizeof = function sizeof(obj, charset) {
    var str = JSON.stringify(obj);
    var total = 0,
        charCode,
        i,
        len;
    charset = charset ? charset.toLowerCase() : '';
    if (charset === 'utf-16' || charset === 'utf16') {
        for (i = 0, len = str.length; i < len; i++) {
            charCode = str.charCodeAt(i);
            if (charCode <= 0xffff) {
                total += 2;
            } else {
                total += 4;
            }
        }
    } else {
        for (i = 0, len = str.length; i < len; i++) {
            charCode = str.charCodeAt(i);
            if (charCode <= 0x007f) {
                total += 1;
            } else if (charCode <= 0x07ff) {
                total += 2;
            } else if (charCode <= 0xffff) {
                total += 3;
            } else {
                total += 4;
            }
        }
    }
    return total;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var CACHE = 'storage_cache';
var MARKS = 'storage_marks';
var CREATEAT = 'c';
var UPDATEAT = 'u';
var EXPIRE = 'e';
var TIMES = 't';

var LocalStorageCache = function () {
  function LocalStorageCache(size, strategy, charset) {
    classCallCheck(this, LocalStorageCache);

    var _storage = localStorage.getItem(CACHE) || '{}';
    var storage = JSON.parse(_storage);

    var _marks = localStorage.getItem(MARKS) || '{}';
    var marks = JSON.parse(_marks);

    this.storage = storage;
    this.marks = marks;
    this.strategy = strategy || 'LRU';
    this.charset = charset;

    if (size > 3 * 1024) {
      throw new Error('3MB is the upper limit of size');
    }

    this.size = (size || 2 * 1024) * 1024;
  }

  createClass(LocalStorageCache, [{
    key: '_getValue',
    value: function _getValue(key) {
      return this.storage[key];
    }
  }, {
    key: '_setValue',
    value: function _setValue(key, value) {
      this.storage[key] = value;
      localStorage.setItem(CACHE, JSON.stringify(this.storage));
    }
  }, {
    key: '_getMarks',
    value: function _getMarks(key) {
      return this.marks[key];
    }
  }, {
    key: '_setMarks',
    value: function _setMarks(key, value) {
      this.marks[key] = value;
      localStorage.setItem(MARKS, JSON.stringify(this.marks));
    }
  }, {
    key: '_remove',
    value: function _remove(key) {
      if (this.storage[key]) {
        delete this.storage[key];
        localStorage.setItem(CACHE, JSON.stringify(this.storage));
      }

      if (this.marks[key]) {
        delete this.marks[key];
        localStorage.setItem(MARKS, JSON.stringify(this.marks));
      }
    }
  }, {
    key: '_clear',
    value: function _clear() {
      localStorage.removeItem(CACHE);
      localStorage.removeItem(MARKS);
    }
  }, {
    key: '_overflow',
    value: function _overflow(key, value, expire) {
      var _newItemMark,
          _this = this;

      var newItemSize = sizeof(defineProperty({}, key, value), this.charset);
      if (newItemSize >= this.size) {
        throw new Error('the size of ' + key + ' is bigger than cache\'s');
      }

      var itemMark = this._getMarks(key);
      var newItemMark = (_newItemMark = {}, defineProperty(_newItemMark, CREATEAT, new Date().getTime()), defineProperty(_newItemMark, UPDATEAT, new Date().getTime()), _newItemMark);

      if (expire) {
        newItemMark[EXPIRE] = expire;
      }

      if (!itemMark) {
        newItemMark[TIMES] = 0;
      }

      var storageSize = sizeof(this.storage, this.charset);
      if (newItemSize + storageSize < this.size) {
        // size is enough
        this._setMarks(key, newItemMark);
        return;
      }

      var keys = Object.keys(this.marks);
      var v = this.strategy === 'LFU' ? TIMES : UPDATEAT;
      keys = keys.sort(function (a, b) {
        return _this.marks[a][v] < _this.marks[b][v];
      });

      while (newItemSize + sizeof(this.storage, this.charset) >= this.size) {
        var _key = keys.pop();

        delete this.storage[_key];
        delete this.marks[_key];
      }
      this._setMarks(key, newItemMark);
    }
  }, {
    key: 'getCache',
    value: function getCache(key) {
      if (!key) {
        throw new Error('missing arguments!');
      }

      var itemMark = this._getMarks(key);
      var value = this._getValue(key);

      if (!value) {
        return undefined;
      }

      if (itemMark[EXPIRE] && itemMark[EXPIRE] * 1000 + itemMark[CREATEAT] < new Date().getTime()) {
        // expired
        this._remove(key);
        return undefined;
      }

      itemMark[UPDATEAT] = new Date().getTime();
      ++itemMark[TIMES];

      this._setMarks(key, itemMark);

      return value;
    }
  }, {
    key: 'setCache',
    value: function setCache(key, value, expire) {
      if (!key || !value) {
        throw new Error('missing arguments!');
      }

      this._overflow(key, value, expire);
      this._setValue(key, value);
      return this;
    }
  }, {
    key: 'deleteCache',
    value: function deleteCache(key) {
      if (!key) {
        throw new Error('missing arguments!');
      }

      this._remove(key);
      return this;
    }
  }, {
    key: 'clearCache',
    value: function clearCache() {
      this._clear();
      return this;
    }
  }]);
  return LocalStorageCache;
}();



window.LocalStorageCache = LocalStorageCache;

return LocalStorageCache;

})));
//# sourceMappingURL=localstorage-cache.js.map
