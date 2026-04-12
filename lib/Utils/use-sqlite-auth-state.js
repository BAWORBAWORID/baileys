"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSqliteAuthState = void 0;
const async_mutex_1 = require("async-mutex");
const WAProto_1 = require("../../WAProto");
const auth_utils_1 = require("./auth-utils");
const generics_1 = require("./generics");
const fixAuthStorageKey = (file) => {
    var _a;
    return (_a = file === null || file === void 0 ? void 0 : file.replace(/\//g, '__')) === null || _a === void 0 ? void 0 : _a.replace(/:/g, '-');
};
/**
 * SQLite-backed auth (single .db file, one row per key). Requires optional dependency `better-sqlite3`:
 * `npm install better-sqlite3`
 */
const useSqliteAuthState = async (databaseFilePath) => {
    let Database;
    try {
        Database = require('better-sqlite3');
    }
    catch (_a) {
        throw new Error('useSqliteAuthState requires better-sqlite3: npm install better-sqlite3');
    }
    const db = new Database(databaseFilePath);
    db.exec(`
CREATE TABLE IF NOT EXISTS yebail_auth_kv (
  k TEXT PRIMARY KEY NOT NULL,
  v TEXT NOT NULL
)`);
    const sel = db.prepare('SELECT v FROM yebail_auth_kv WHERE k = ?');
    const upsert = db.prepare('INSERT OR REPLACE INTO yebail_auth_kv (k, v) VALUES (?, ?)');
    const del = db.prepare('DELETE FROM yebail_auth_kv WHERE k = ?');
    const keyLocks = new Map();
    const getKeyLock = (storageKey) => {
        let mutex = keyLocks.get(storageKey);
        if (!mutex) {
            mutex = new async_mutex_1.Mutex();
            keyLocks.set(storageKey, mutex);
        }
        return mutex;
    };
    const readData = async (file) => {
        const storageKey = fixAuthStorageKey(file);
        const mutex = getKeyLock(storageKey);
        return mutex.acquire().then(async (release) => {
            try {
                const row = sel.get(storageKey);
                const raw = row ? row.v : null;
                if (raw == null || raw === '') {
                    return null;
                }
                return JSON.parse(raw, generics_1.BufferJSON.reviver);
            }
            catch (_a) {
                return null;
            }
            finally {
                release();
            }
        });
    };
    const writeData = async (data, file) => {
        const storageKey = fixAuthStorageKey(file);
        const mutex = getKeyLock(storageKey);
        return mutex.acquire().then(async (release) => {
            try {
                const value = JSON.stringify(data, generics_1.BufferJSON.replacer);
                upsert.run(storageKey, value);
            }
            finally {
                release();
            }
        });
    };
    const removeData = async (file) => {
        const storageKey = fixAuthStorageKey(file);
        const mutex = getKeyLock(storageKey);
        return mutex.acquire().then(async (release) => {
            try {
                del.run(storageKey);
            }
            finally {
                release();
            }
        });
    };
    const creds = (await readData('creds.json')) || (0, auth_utils_1.initAuthCreds)();
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}.json`);
                        if (type === 'app-state-sync-key' && value) {
                            value = WAProto_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const file = `${category}-${id}.json`;
                            tasks.push(value ? writeData(value, file) : removeData(file));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => {
            return writeData(creds, 'creds.json');
        }
    };
};
exports.useSqliteAuthState = useSqliteAuthState;
