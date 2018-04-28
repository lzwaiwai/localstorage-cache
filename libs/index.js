import sizeof from './sizeof';

const CACHE = 'storage_cache';
const MARKS = 'storage_marks';
const CREATEAT = 'c';
const UPDATEAT = 'u'
const EXPIRE = 'e';
const TIMES = 't';

class LocalStorageCache {
  constructor(size, strategy) {
    const _storage = localStorage.getItem(CACHE) || '{}';
    const storage = JSON.parse(_storage);

    const _marks = localStorage.getItem(MARKS) || '{}';
    const marks = JSON.parse(_marks);

    this.storage = storage;
    this.marks = marks;
    this.strategy = strategy || 'LRU';

    if (size > 3 * 1024) {
      throw new Error('超过最大空间（3MB）限制！')
    }

    this.size = (size || 2 * 1024) * 1024;
  }

  _getValue(key) {
    return this.storage[key];
  }

  _setValue(key, value) {
    this.storage[key] = value;
    localStorage.setItem(CACHE, JSON.stringify(this.storage));
  }

  _getMarks(key) {
    return this.marks[key];
  }

  _setMarks(key, value) {
    this.marks[key] = value;
    localStorage.setItem(MARKS, JSON.stringify(this.marks));
  }

  _remove(key) {
    if (this.storage[key])  {
      delete this.storage[key];
      localStorage.setItem(CACHE, JSON.stringify(this.storage));
    }

    if (this.marks[key]) {
      delete this.marks[key];
      localStorage.setItem(MARKS, JSON.stringify(this.marks));
    }
  }

  _clear() {
    localStorage.removeItem(CACHE);
    localStorage.removeItem(MARKS);
  }

  _overflow(key, value, expire) {
    const newItemSize = sizeof({[key]: value});
    if (newItemSize >= this.size) {
      throw new Error('单次缓存的数据大于缓存整体空间大小！');
    }

    const itemMark = this._getMarks(key);
    const newItemMark = {
      [CREATEAT]: new Date().getTime(),
      [UPDATEAT]: new Date().getTime()
    };

    if (expire) {
      newItemMark[EXPIRE] = expire;
    }

    if (!itemMark) {
      newItemMark[TIMES] = 0;
    }

    const storageSize = sizeof(this.storage);
    if (newItemSize + storageSize < this.size) { // 缓存空间足够
      this._setMarks(key, newItemMark);
      return;
    }

    let keys = Object.keys(this.marks);
    const v = this.strategy === 'LFU' ? TIMES : UPDATEAT;
    keys = keys.sort((a, b) => this.marks[a][v] < this.marks[b][v]);

    while (newItemSize + sizeof(this.storage) >= this.size) {
      const _key = keys.pop();

      delete this.storage[_key];
      delete this.marks[_key];
    }
    this._setMarks(key, newItemMark);
  }

  getCache(key) {
    if (!key) {
      throw new Error('missing arguments!');
    }

    const itemMark = this._getMarks(key);
    const value = this._getValue(key);

    if (!value) {
      return undefined;
    }

    if (itemMark[EXPIRE] && itemMark[EXPIRE] * 1000 + itemMark[CREATEAT] < new Date().getTime()) { // 已过期
      this._remove(key);
      return undefined;
    }

    itemMark[UPDATEAT] = new Date().getTime();
    ++itemMark[TIMES];

    this._setMarks(key, itemMark);

    return value;
  }

  setCache(key, value, expire) {
    if (!key || !value) {
      throw new Error('missing arguments!');
    }

    this._overflow(key, value, expire);
    this._setValue(key, value);
    return this;
  }

  deleteCache(key) {
    if (!key) {
      throw new Error('missing arguments!');
    }

    this._remove(key);
    return this;
  }

  clearCache() {
    this._clear();
    return this;
  }
};

window.LocalStorageCache = LocalStorageCache;
export default LocalStorageCache;
