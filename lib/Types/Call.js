/**
 * @typedef {'offer' | 'ringing' | 'timeout' | 'reject' | 'accept'} WACallUpdateType
 */

/**
 * @typedef {Object} WACallEvent
 * @property {string} chatId
 * @property {string} from
 * @property {boolean} [isGroup]
 * @property {string} [groupJid]
 * @property {string} id
 * @property {Date} date
 * @property {boolean} [isVideo]
 * @property {WACallUpdateType} status
 * @property {boolean} offline
 * @property {number} [latencyMs]
 */

export const WACallUpdateTypes = {
    OFFER: 'offer',
    RINGING: 'ringing',
    TIMEOUT: 'timeout',
    REJECT: 'reject',
    ACCEPT: 'accept'
};
