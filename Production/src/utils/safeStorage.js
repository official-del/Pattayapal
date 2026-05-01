/**
 * 🛡️ safeStorage.js
 * This file MUST be the first import in main.jsx.
 * It patches window.safeStorage and window.safeSessionStorage BEFORE
 * any React component or context tries to access them.
 *
 * Required because In-App browsers (LINE, Facebook, Instagram, WeChat)
 * block or restrict localStorage/sessionStorage access, throwing SecurityError.
 */

const createSafeWrapper = (storageKey) => {
  const _mem = Object.create(null); // in-memory fallback

  const _get = () => {
    try {
      return window[storageKey];
    } catch (_) {
      return null;
    }
  };

  const _canUse = () => {
    try {
      const s = window[storageKey];
      const testKey = '__safe_test__';
      s.setItem(testKey, '1');
      s.removeItem(testKey);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Test once
  const _usable = _canUse();

  return {
    getItem(key) {
      if (_usable) {
        try { return _get().getItem(key); } catch (_) {}
      }
      return Object.prototype.hasOwnProperty.call(_mem, key) ? _mem[key] : null;
    },
    setItem(key, value) {
      if (_usable) {
        try { _get().setItem(key, value); return; } catch (_) {}
      }
      _mem[key] = String(value);
    },
    removeItem(key) {
      if (_usable) {
        try { _get().removeItem(key); return; } catch (_) {}
      }
      delete _mem[key];
    },
    clear() {
      if (_usable) {
        try { _get().clear(); return; } catch (_) {}
      }
      for (const k in _mem) delete _mem[k];
    },
    key(i) {
      if (_usable) {
        try { return _get().key(i); } catch (_) {}
      }
      return Object.keys(_mem)[i] ?? null;
    },
    get length() {
      if (_usable) {
        try { return _get().length; } catch (_) {}
      }
      return Object.keys(_mem).length;
    },
  };
};

// Assign to window immediately — before any other module runs
window.safeStorage = createSafeWrapper('localStorage');
window.safeSessionStorage = createSafeWrapper('sessionStorage');
