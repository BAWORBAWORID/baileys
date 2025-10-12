"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSingleFileAuthState = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const WAProto_1 = require("../../WAProto");
const auth_utils_1 = require("./auth-utils");
const generics_1 = require("./generics");

/**
 * Stores the full authentication state in a single JSON file.
 * More convenient for simple bots but less efficient than multi-file approach.
 * */
const useSingleFileAuthState = async (sessionPath) => {
    // Pisahkan directory dan filename
    const dir = (0, path_1.dirname)(sessionPath);
    const fileName = (0, path_1.basename)(sessionPath);
    
    // Pastikan file berakhiran .json
    const filePath = fileName.endsWith('.json') 
        ? sessionPath 
        : (0, path_1.join)(sessionPath, 'creds.json');
    
    // Buat directory jika belum ada
    const folderPath = (0, path_1.dirname)(filePath);
    try {
        await (0, promises_1.mkdir)(folderPath, { recursive: true });
    } catch (error) {
        // Directory sudah ada atau error lain
    }

    // Fungsi untuk membaca semua data dari file
    const readAuthState = async () => {
        try {
            const data = await (0, promises_1.readFile)(filePath, { encoding: 'utf-8' });
            return JSON.parse(data, generics_1.BufferJSON.reviver);
        } catch (error) {
            // File tidak ada atau error, return struktur kosong
            return { creds: (0, auth_utils_1.initAuthCreds)(), keys: {} };
        }
    };

    // Fungsi untuk menulis semua data ke file
    const writeAuthState = async (authState) => {
        await (0, promises_1.writeFile)(
            filePath, 
            JSON.stringify(authState, generics_1.BufferJSON.replacer, 2)
        );
    };

    // Baca auth state yang ada atau buat baru
    let authState = await readAuthState();

    return {
        state: {
            creds: authState.creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    for (const id of ids) {
                        const key = `${type}-${id}`;
                        let value = authState.keys[key];
                        
                        if (type === 'app-state-sync-key' && value) {
                            value = WAProto_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        
                        data[id] = value;
                    }
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const key = `${category}-${id}`;
                            const value = data[category][id];
                            
                            if (value) {
                                authState.keys[key] = value;
                            } else {
                                delete authState.keys[key];
                            }
                        }
                    }
                    
                    await writeAuthState(authState);
                }
            }
        },
        saveCreds: async () => {
            authState.creds = authState.creds;
            await writeAuthState(authState);
        }
    };
};

exports.useSingleFileAuthState = useSingleFileAuthState;