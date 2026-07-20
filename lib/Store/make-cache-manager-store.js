import { createCache } from 'cache-manager';
import { proto } from '../../WAProto/index.js';
import { BufferJSON, initAuthCreds } from '../Utils/index.js';

const makeCacheManagerAuthState = async (store, sessionKey) => {
    const defaultKey = (file) => `${sessionKey}:${file}`;
    const databaseConn = await createCache(store);
    const writeData = async (file, data) => {
        let ttl = undefined;
        if (file === 'creds') {
            ttl = 63115200;
        }
        await databaseConn.set(defaultKey(file), JSON.stringify(data, BufferJSON.replacer), ttl);
    };
    const readData = async (file) => {
        try {
            const data = await databaseConn.get(defaultKey(file));
            if (data) {
                return JSON.parse(data, BufferJSON.reviver);
            }
            return null;
        }
        catch (error) {
            return null;
        }
    };
    const removeData = async (file) => {
        try {
            return await databaseConn.del(defaultKey(file));
        }
        catch {
        }
    };
    const clearState = async () => {
        try {
            const result = await databaseConn.store.keys(`${sessionKey}*`);
            await Promise.all(result.map(async (key) => await databaseConn.del(key)));
        }
        catch (err) {
        }
    };
    const creds = (await readData('creds')) || initAuthCreds();
    return {
        clearState,
        saveCreds: () => writeData('creds', creds),
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
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
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(key, value) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                },
            }
        }
    };
};
export default makeCacheManagerAuthState;
