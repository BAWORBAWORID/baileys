import { Mutex } from 'async-mutex';
import { readFile, writeFile } from 'fs/promises';
import { proto } from '../../WAProto/index.js';
import { initAuthCreds } from './auth-utils.js';
import { BufferJSON } from './generics.js';
const fileMutex = new Mutex();
/**
 * Stores the full authentication state in a single JSON file.
 * Simpler than useMultiFileAuthState but less efficient for large key stores.
 */
export const useSingleFileAuthState = async (filename) => {
    const fixFileName = (file) => file?.replace(/\//g, '__')?.replace(/:/g, '-');
    let stateData = {};
    const loadState = async () => {
        try {
            const data = await readFile(filename, { encoding: 'utf-8' });
            stateData = JSON.parse(data, BufferJSON.reviver) || {};
        }
        catch {
            stateData = {};
        }
    };
    const writeState = async () => {
        await fileMutex.acquire().then(async (release) => {
            try {
                await writeFile(filename, JSON.stringify(stateData, BufferJSON.replacer));
            }
            finally {
                release();
            }
        });
    };
    await loadState();
    const creds = stateData.creds || initAuthCreds();
    if (!stateData.creds) {
        stateData.creds = creds;
        await writeState();
    }
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        const key = fixFileName(`${type}-${id}`);
                        let value = stateData[key];
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value || null;
                    }));
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = fixFileName(`${category}-${id}`);
                            if (value) {
                                stateData[key] = value;
                            }
                            else {
                                delete stateData[key];
                            }
                        }
                    }
                    await writeState();
                }
            }
        },
        saveCreds: async () => {
            stateData.creds = creds;
            await writeState();
        }
    };
};
//# sourceMappingURL=use-single-file-auth-state.js.map
