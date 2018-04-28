(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global['localstorage-cache'] = factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
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

var sizeof = function sizeof(object) {
    var objectList = [];
    var stack = [object];
    var bytes = 0;

    while (stack.length) {
        var value = stack.pop();

        if (typeof value === 'boolean') {
            bytes += 4;
        } else if (typeof value === 'string') {
            bytes += value.length * 2;
        } else if (typeof value === 'number') {
            bytes += 8;
        } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && objectList.indexOf(value) === -1) {
            objectList.push(value);
            // if the object is not an array, add the sizes of the keys
            if (Object.prototype.toString.call(value) != '[object Array]') {
                for (var key in value) {
                    bytes += 2 * key.length;
                }
            }
            for (var key in value) {
                stack.push(value[key]);
            }
        }
    }
    return bytes;
};

var CACHE = 'storage_cache';
var MARKS = 'storage_marks';
var CREATEAT = 'c';
var UPDATEAT = 'u';
var EXPIRE = 'e';
var TIMES = 't';

var LocalStorageCache = function () {
  function LocalStorageCache(size, strategy) {
    classCallCheck(this, LocalStorageCache);

    var _storage = localStorage.getItem(CACHE) || '{}';
    var storage = JSON.parse(_storage);

    var _marks = localStorage.getItem(MARKS) || '{}';
    var marks = JSON.parse(_marks);

    this.storage = storage;
    this.marks = marks;
    this.strategy = strategy || 'LRU';

    if (size > 3 * 1024) {
      throw new Error('超过最大空间（3MB）限制！');
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

      var newItemSize = sizeof(defineProperty({}, key, value));
      if (newItemSize >= this.size) {
        throw new Error('单次缓存的数据大于缓存整体空间大小！');
      }

      var itemMark = this._getMarks(key);
      var newItemMark = (_newItemMark = {}, defineProperty(_newItemMark, CREATEAT, new Date().getTime()), defineProperty(_newItemMark, UPDATEAT, new Date().getTime()), _newItemMark);

      if (expire) {
        newItemMark[EXPIRE] = expire;
      }

      if (!itemMark) {
        newItemMark[TIMES] = 0;
      }

      var storageSize = sizeof(this.storage);
      if (newItemSize + storageSize < this.size) {
        // 缓存空间足够
        this._setMarks(key, newItemMark);
        return;
      }

      var keys = Object.keys(this.marks);
      var v = this.strategy === 'LFU' ? TIMES : UPDATEAT;
      keys = keys.sort(function (a, b) {
        return _this.marks[a][v] < _this.marks[b][v];
      });

      while (newItemSize + sizeof(this.storage) >= this.size) {
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
        // 已过期
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
