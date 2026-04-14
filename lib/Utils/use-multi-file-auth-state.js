"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMultiFileAuthState = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const WAProto_1 = require("../../WAProto");
const auth_utils_1 = require("./auth-utils");
const generics_1 = require("./generics");
/**
 * Local filesystem auth (JSON files).
 */
const useMultiFileAuthState = async (folder) => {
    const folderInfo = await (0, promises_1.stat)(folder).catch(() => { });
    if (folderInfo) {
        if (!folderInfo.isDirectory()) {
            throw new Error(`found something that is not a directory at ${folder}, either delete it or specify a different location`);
        }
    }
    else {
        await (0, promises_1.mkdir)(folder, { recursive: true });
    }
    const fixPath = (file) => { var _a; return (_a = file === null || file === void 0 ? void 0 : file.replace(/\//g, '__')) === null || _a === void 0 ? void 0 : _a.replace(/:/g, '-'); };
    const readData = async (file) => {
        try {
            const filePath = (0, path_1.join)(folder, fixPath(file));
            const raw = await (0, promises_1.readFile)(filePath, { encoding: 'utf-8' });
            return JSON.parse(raw, generics_1.BufferJSON.reviver);
        }
        catch (_a) {
            return null;
        }
    };
    const writeData = async (data, file) => {
        const filePath = (0, path_1.join)(folder, fixPath(file));
        const json = JSON.stringify(data, generics_1.BufferJSON.replacer);
        await (0, promises_1.writeFile)(filePath, json, 'utf-8');
    };
    const removeData = async (file) => {
        try {
            await (0, promises_1.unlink)((0, path_1.join)(folder, fixPath(file)));
        }
        catch (_a) {
        }
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
exports.useMultiFileAuthState = useMultiFileAuthState;
