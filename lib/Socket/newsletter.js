import { QueryIds, XWAPaths } from '../Types/index.js';
import { generateProfilePicture } from '../Utils/messages-media.js';
import { getBinaryNodeChild, getBinaryNodeChildren, getAllBinaryNodeChildren, S_WHATSAPP_NET } from '../WABinary/index.js';
import { decryptMessageNode, generateMessageID } from '../Utils/index.js';
import { makeGroupsSocket } from './groups.js';
import { executeWMexQuery as genericExecuteWMexQuery } from './mex.js';
export const extractNewsletterMetadata = (node, isCreate = false) => {
    // executeWMexQuery already returns parsed JSON data (not a binary node)
    // If it's a binary node, parse it; if it's already an object, use directly
    let metadataPath;
    if (node && typeof node === 'object' && node.thread_metadata) {
        // Already extracted by executeWMexQuery
        metadataPath = node;
    } else if (node && typeof node === 'object' && node.content) {
        // Raw binary node - parse it (legacy path)
        const result = getBinaryNodeChild(node, 'result')?.content?.toString();
        const parsed = JSON.parse(result);
        metadataPath = isCreate ? parsed.data.xwa2_newsletter_create : parsed.data.xwa2_newsletter;
    } else {
        return null;
    }
    const tm = metadataPath.thread_metadata || {};
    return {
        id: metadataPath.id,
        state: metadataPath.state?.type,
        creation_time: +(tm.creation_time || 0),
        name: tm.name?.text || null,
        nameTime: +(tm.name?.update_time || 0),
        description: tm.description?.text || null,
        descriptionTime: +(tm.description?.update_time || 0),
        invite: tm.invite || null,
        handle: tm.handle || null,
        picture: tm.picture?.direct_path || null,
        preview: tm.preview?.direct_path || null,
        reaction_codes: tm.settings?.reaction_codes?.value,
        subscribers: +(tm.subscribers_count || 0),
        verification: tm.verification || null,
        viewer_metadata: metadataPath.viewer_metadata || null
    };
};
const parseNewsletterCreateResponse = (response) => {
    if (!response || !response.thread_metadata) return null;
    const { id, thread_metadata: thread, viewer_metadata: viewer } = response;
    return {
        id: id,
        owner: undefined,
        name: thread?.name?.text || null,
        creation_time: parseInt(thread?.creation_time, 10) || 0,
        description: thread?.description?.text || null,
        invite: thread?.invite || null,
        subscribers: parseInt(thread?.subscribers_count, 10) || 0,
        verification: thread?.verification || null,
        picture: {
            id: thread?.picture?.id || null,
            directPath: thread?.picture?.direct_path || null
        },
        mute_state: viewer?.mute || null
    };
};
const parseNewsletterMetadata = (result) => {
    // executeWMexQuery returns the extracted data at xwa2_newsletter path
    // which is the metadata object with thread_metadata
    if (result && typeof result === 'object' && result.thread_metadata) {
        return extractNewsletterMetadata(result, false);
    }
    // Fallback: check nested structures
    if (result && typeof result === 'object' && result.result?.thread_metadata) {
        return extractNewsletterMetadata(result.result, false);
    }
    if (result && typeof result === 'object' && result.id && result.thread_metadata) {
        return extractNewsletterMetadata(result, false);
    }
    return null;
};
export const makeNewsletterSocket = (config) => {
    const sock = makeGroupsSocket(config);
    const { query, generateMessageTag, authState, signalRepository } = sock;
    const executeWMexQuery = (variables, queryId, dataPath) => {
        return genericExecuteWMexQuery(variables, queryId, dataPath, query, generateMessageTag);
    };
    const newsletterUpdate = async (jid, updates) => {
        const variables = {
            newsletter_id: jid,
            updates: {
                ...updates,
                settings: null
            }
        };
        return executeWMexQuery(variables, QueryIds.UPDATE_METADATA, 'xwa2_newsletter_update');
    };
    return {
        ...sock,
        newsletterCreate: async (name, description) => {
            const variables = {
                input: {
                    name,
                    description: description ?? null
                }
            };
            const rawResponse = await executeWMexQuery(variables, QueryIds.CREATE, XWAPaths.xwa2_newsletter_create);
            return parseNewsletterCreateResponse(rawResponse);
        },
        newsletterUpdate,
        newsletterSubscribers: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.SUBSCRIBERS, XWAPaths.xwa2_newsletter_subscribers);
        },
        newsletterMetadata: async (type, key, role) => {
            const variables = {
                fetch_creation_time: true,
                fetch_full_image: true,
                fetch_viewer_metadata: true,
                input: {
                    key,
                    type: type.toUpperCase(),
                    view_role: role || 'GUEST'
                }
            };
            const result = await executeWMexQuery(variables, QueryIds.METADATA, XWAPaths.xwa2_newsletter_metadata);
            return parseNewsletterMetadata(result);
        },
        newsletterFollow: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.FOLLOW, XWAPaths.xwa2_newsletter_join_v2);
        },
        newsletterUnfollow: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.UNFOLLOW, XWAPaths.xwa2_newsletter_leave_v2);
        },
        newsletterMute: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.MUTE, XWAPaths.xwa2_newsletter_mute_v2);
        },
        newsletterUnmute: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.UNMUTE, XWAPaths.xwa2_newsletter_unmute_v2);
        },
        newsletterUpdateName: async (jid, name) => {
            return await newsletterUpdate(jid, { name });
        },
        newsletterUpdateDescription: async (jid, description) => {
            return await newsletterUpdate(jid, { description });
        },
        newsletterUpdatePicture: async (jid, content) => {
            const { img } = await generateProfilePicture(content);
            return await newsletterUpdate(jid, { picture: img.toString('base64') });
        },
        newsletterRemovePicture: async (jid) => {
            return await newsletterUpdate(jid, { picture: '' });
        },
        newsletterReactMessage: async (jid, serverId, reaction) => {
            await query({
                tag: 'message',
                attrs: {
                    to: jid,
                    ...(reaction ? {} : { edit: '7' }),
                    type: 'reaction',
                    server_id: serverId,
                    id: generateMessageTag()
                },
                content: [
                    {
                        tag: 'reaction',
                        attrs: reaction ? { code: reaction } : {}
                    }
                ]
            });
        },
        newsletterFetchMessages: async (jid, count, since, after) => {
            const messageUpdateAttrs = {
                count: count.toString()
            };
            if (typeof since === 'number') {
                messageUpdateAttrs.since = since.toString();
            }
            if (after) {
                messageUpdateAttrs.after = after.toString();
            }
            const result = await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'get',
                    xmlns: 'newsletter',
                    to: jid
                },
                content: [
                    {
                        tag: 'message_updates',
                        attrs: messageUpdateAttrs
                    }
                ]
            });
            return result;
        },
        subscribeNewsletterUpdates: async (jid) => {
            const result = await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'set',
                    xmlns: 'newsletter',
                    to: jid
                },
                content: [{ tag: 'live_updates', attrs: {}, content: [] }]
            });
            const liveUpdatesNode = getBinaryNodeChild(result, 'live_updates');
            const duration = liveUpdatesNode?.attrs?.duration;
            return duration ? { duration: duration } : null;
        },
        newsletterAdminCount: async (jid) => {
            const response = await executeWMexQuery({ newsletter_id: jid }, QueryIds.ADMIN_COUNT, XWAPaths.xwa2_newsletter_admin_count);
            return response.admin_count;
        },
        newsletterChangeOwner: async (jid, newOwnerJid) => {
            await executeWMexQuery({ newsletter_id: jid, user_id: newOwnerJid }, QueryIds.CHANGE_OWNER, XWAPaths.xwa2_newsletter_change_owner);
        },
        newsletterDemote: async (jid, userJid) => {
            await executeWMexQuery({ newsletter_id: jid, user_id: userJid }, QueryIds.DEMOTE, XWAPaths.xwa2_newsletter_demote);
        },
        newsletterDelete: async (jid) => {
            await executeWMexQuery({ newsletter_id: jid }, QueryIds.DELETE, XWAPaths.xwa2_newsletter_delete_v2);
        },
        // --- Ported from local fork ---
        newsletterId: async (url) => {
            const match = url.match(/(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9_-]{10,50})/i);
            const inviteCode = match ? match[1] : (url.trim().match(/^[A-Za-z0-9_-]{10,50}$/) ? url.trim() : null);
            if (!inviteCode) throw new Error('Invalid WhatsApp channel URL or invite code');
            return sock.newsletterMetadata('invite', inviteCode);
        },
        newsletterReactionMode: async (jid, mode) => {
            await executeWMexQuery({
                newsletter_id: jid,
                updates: { settings: { reaction_codes: { value: mode } }, settings: null }
            }, QueryIds.UPDATE_METADATA, 'xwa2_newsletter_update');
        },
        newsletterFetchUpdates: async (jid, count, after, since) => {
            const result = await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'get',
                    xmlns: 'newsletter',
                    to: jid
                },
                content: [{
                    tag: 'message_updates',
                    attrs: {
                        count: count.toString(),
                        after: after?.toString() || '100',
                        since: since?.toString() || '0'
                    }
                }]
            });
            return await parseFetchedUpdates(result, 'updates', { authState, signalRepository, logger: config.logger });
        },
        newsletterSubscribed: async () => {
            const result = await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'get',
                    xmlns: 'newsletter',
                    to: S_WHATSAPP_NET
                },
                content: [{ tag: 'subscribed', attrs: {} }]
            });
            const subscribedNode = getBinaryNodeChild(result, 'subscribed');
            if (!subscribedNode) return [];
            const newsletters = getBinaryNodeChildren(subscribedNode, 'newsletter');
            return newsletters.map(n => {
                const metaNode = getBinaryNodeChild(n, 'newsletter_metadata');
                return {
                    id: n.attrs.id,
                    name: getBinaryNodeChild(metaNode, 'name')?.content || '',
                    description: getBinaryNodeChild(metaNode, 'description')?.content || '',
                    picture: getBinaryNodeChild(metaNode, 'picture')?.attrs?.url || null
                };
            });
        }
    };
};
const parseFetchedUpdates = async (node, type, config) => {
    let child;
    if (type === 'messages') {
        child = getBinaryNodeChild(node, 'messages');
    } else {
        const parent = getBinaryNodeChild(node, 'message_updates');
        child = getBinaryNodeChild(parent, 'messages');
    }
    const { authState, signalRepository } = config;
    return await Promise.all(getAllBinaryNodeChildren(child).map(async (messageNode) => {
        messageNode.attrs.from = child?.attrs.jid;
        const views = parseInt(getBinaryNodeChild(messageNode, 'views_count')?.attrs?.count || '0');
        const reactionNode = getBinaryNodeChild(messageNode, 'reactions');
        const reactions = getBinaryNodeChildren(reactionNode, 'reaction')
            .map(({ attrs }) => ({ count: +attrs.count, code: attrs.code }));
        const data = {
            server_id: messageNode.attrs.server_id,
            views,
            reactions
        };
        if (type === 'messages') {
            const { fullMessage: message, decrypt } = await decryptMessageNode(
                messageNode, authState.creds.me.id, authState.creds.me.lid || '', signalRepository, config.logger
            );
            await decrypt();
            data.message = message;
        }
        return data;
    }));
};
//# sourceMappingURL=newsletter.js.map