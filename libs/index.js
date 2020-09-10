import sizeof from './sizeof';

const CACHE = 'storage_cache';
const MARKS = 'storage_marks';
const CREATEAT = 'c';
const UPDATEAT = 'u'
const EXPIRE = 'e';
const TIMES = 't';

class LocalStorageCache {
  constructor(size, strategy, charset, keyAppend) {
    if (keyAppend) {
      this.CACHE_KEY = `${CACHE}_${keyAppend}`
      this.MARKS_KEY = `${MARKS}_${keyAppend}`
    } else {
      this.CACHE_KEY = CACHE
      this.MARKS_KEY = MARKS
    }

    const _storage = localStorage.getItem(this.CACHE_KEY) || '{}';
    const storage = JSON.parse(_storage);

    const _marks = localStorage.getItem(this.MARKS_KEY) || '{}';
    const marks = JSON.parse(_marks);

    this.storage = storage;
    this.marks = marks;
    this.strategy = strategy || 'LRU';
    this.charset = charset;

    if (size > 3 * 1024) {
      throw new Error('3MB is the upper limit of size')
    }

    this.size = (size || 2 * 1024) * 1024;
  }

  _getValue(key) {
    return this.storage[key];
  }

  _setValue(key, value) {
    this.storage[key] = value;
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.storage));
  }

  _getMarks(key) {
    return this.marks[key];
  }

  _setMarks(key, value) {
    this.marks[key] = value;
    localStorage.setItem(this.MARKS_KEY, JSON.stringify(this.marks));
  }

  _remove(key) {
    if (this.storage[key])  {
      delete this.storage[key];
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.storage));
    }

    if (this.marks[key]) {
      delete this.marks[key];
      localStorage.setItem(this.MARKS_KEY, JSON.stringify(this.marks));
    }
  }

  _clear() {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.MARKS_KEY);
  }

  _overflow(key, value, expire) {
    const newItemSize = sizeof({[key]: value}, this.charset);
    if (newItemSize >= this.size) {
      throw new Error(`the size of ${key} is bigger than cache\'s`);
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

    const storageSize = sizeof(this.storage, this.charset);
    if (newItemSize + storageSize < this.size) { // size is enough
      this._setMarks(key, newItemMark);
      return;
    }

    let keys = Object.keys(this.marks);
    const v = this.strategy === 'LFU' ? TIMES : UPDATEAT;
    keys = keys.sort((a, b) => this.marks[a][v] < this.marks[b][v]);

    while (newItemSize + sizeof(this.storage, this.charset) >= this.size) {
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

    if (itemMark[EXPIRE] && itemMark[EXPIRE] * 1000 + itemMark[CREATEAT] < new Date().getTime()) { // expired
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
