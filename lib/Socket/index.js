import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
import { makeUsernameSocket } from './username.js';
import { makePrivacySocket } from './privacy.js';
import { makeGraphQLSocket } from './graphql.js';
import { makeInteropSocket } from './interop.js';
import imup from './luxu.js';
import { generateWAMessageContent, generateWAMessageFromContent } from '../Utils/index.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const sock = makeCommunitiesSocket(newConfig);
    const finalSock = makePrivacySocket(sock);
    const graphqlSock = makeGraphQLSocket(finalSock);
    const interopSock = makeInteropSocket(graphqlSock);
    interopSock.imup = new imup(
        { generateWAMessageContent, generateWAMessageFromContent, generateMessageID: interopSock.generateMessageTag },
        interopSock.waUploadToServer,
        interopSock.relayMessage
    );
    return interopSock;
};
export default makeWASocket;
export { makeUsernameSocket, makePrivacySocket, makeGraphQLSocket, makeInteropSocket, imup };
//# sourceMappingURL=index.js.map