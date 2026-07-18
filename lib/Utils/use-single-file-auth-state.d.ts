import type { AuthenticationState } from '../Types/index.js';
/**
 * stores the full authentication state in a single JSON file.
 * Useful for single session bots or quick deployments.
 * */
export declare const useSingleFileAuthState: (filename?: string) => Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}>;
