"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSingleAuthState = void 0;
const fs_1 = require("fs");
const async_mutex_1 = require("async-mutex");
const WAProto_1 = require("../../WAProto");
const auth_utils_1 = require("./auth-utils");
const generics_1 = require("./generics");
/**
 * Single JSON file auth storage — all keys stored in one file instead of multiple files.
 * Simpler and more efficient for basic use cases.
 */
const useSingleAuthState = async (filePath) => {
    const mutex = new async_mutex_1.Mutex();
    const readData = () => {
        try {
            const raw = (0, fs_1.readFileSync)(filePath, 'utf-8');
            if (!raw || raw.trim() === '') {
                return null;
            }
            return JSON.parse(raw, generics_1.BufferJSON.reviver);
        }
        catch (_a) {
            return null;
        }
    };
    const writeData = (data) => {
        const json = JSON.stringify(data, generics_1.BufferJSON.replacer);
        (0, fs_1.writeFileSync)(filePath, json, 'utf-8');
    };
    const allData = readData() || {};
    const creds = allData.creds || (0, auth_utils_1.initAuthCreds)();
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    const localData = readData() || {};
                    ids.forEach(id => {
                        const key = `${type}-${id}`;
                        let value = localData[key];
                        if (type === 'app-state-sync-key' && value) {
                            value = WAProto_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    });
                    return data;
                },
                set: async (data) => {
                    await mutex.runExclusive(async () => {
                        const localData = readData() || {};
                        for (const category in data) {
                            for (const id in data[category]) {
                                const key = `${category}-${id}`;
                                const value = data[category][id];
                                if (value) {
                                    localData[key] = value;
                                }
                                else {
                                    delete localData[key];
                                }
                            }
                        }
                        localData.creds = creds;
                        writeData(localData);
                    });
                }
            }
        },
        saveCreds: async () => {
            await mutex.runExclusive(async () => {
                const localData = readData() || {};
                localData.creds = creds;
                writeData(localData);
            });
        }
    };
};
exports.useSingleAuthState = useSingleAuthState;
