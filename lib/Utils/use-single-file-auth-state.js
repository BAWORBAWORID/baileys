import { Mutex } from 'async-mutex';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { proto } from '../../WAProto/index.js';
import { initAuthCreds } from './auth-utils.js';
import { BufferJSON } from './generics.js';
const fileLocks = new Map();
const getFileLock = (path) => {
    let mutex = fileLocks.get(path);
    if (!mutex) {
        mutex = new Mutex();
        fileLocks.set(path, mutex);
    }
    return mutex;
};
/**
 * stores the full authentication state in a single JSON file.
 * Useful for single session bots or quick deployments.
 * */
export const useSingleFileAuthState = async (filename = 'auth_info.json') => {
    const filePath = filename;
    const mutex = getFileLock(filePath);
    await mkdir(dirname(filePath), { recursive: true }).catch(() => { });
    let creds;
    let keys = {};
    const readData = async () => {
        return mutex.acquire().then(async (release) => {
            try {
                const data = await readFile(filePath, { encoding: 'utf-8' });
                const parsed = JSON.parse(data, BufferJSON.reviver);
                return parsed || {};
            }
            catch {
                return {};
            }
            finally {
                release();
            }
        });
    };
    const writeData = async () => {
        return mutex.acquire().then(async (release) => {
            try {
                const dataToSave = {
                    creds,
                    keys
                };
                await writeFile(filePath, JSON.stringify(dataToSave, BufferJSON.replacer, 2));
            }
            finally {
                release();
            }
        });
    };
    const initialData = await readData();
    creds = initialData.creds || initialData || initAuthCreds();
    if (!creds || typeof creds !== 'object' || !creds.noiseKey) {
        creds = initAuthCreds();
    }
    keys = initialData.keys || {};
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = keys[type]?.[id];
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        if (!keys[category]) {
                            keys[category] = {};
                        }
                        for (const id in data[category]) {
                            const value = data[category][id];
                            if (value) {
                                keys[category][id] = value;
                            }
                            else {
                                delete keys[category][id];
                            }
                        }
                    }
                    await writeData();
                }
            }
        },
        saveCreds: async () => {
            await writeData();
        }
    };
};
