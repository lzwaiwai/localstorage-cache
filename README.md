# localstorage-cache
  storage

## Installation

#### In a browser:
```html
<script src="localstorage-cache.js"></script>
```

#### Using npm:
```shell
$ npm i -g localstorage-cache
$ npm i --save localstorage-cache
```

#### Usage:
```javascript
import LocalStorageCache from 'localstorage-cache';

/*
 * Set cache size: 2 * 1024KB(2MB)
 * set cache strategy: LRU / LFU;
 */
const storageCache = new LocalStorageCache(2 * 1024, 'LRU'); //

/**
 * set cache, and unit of expire is second.
 * @param {string/number} key
 * @param {any} value
 * @param {number} [expire]
 * @param {string} [charset]
 */
storageCache.setCache('name', 'lzwaiwai', 'utf8').setCache('age', 18);
storageCache.setCache('work', 'IT', 24 * 60 * 60);

/**
 * get cache by key.
 * @param {string/number} key
 * @returns
 */
const cacheWork = storageCache.getCache('work');
console.log(cacheWork);

/**
 * delete cache by key.
 * @param {string/number} key
 */
storageCache.deleteCache('age');

/**
 * delete all cache.
 */
storageCache.clearCache();
...
```