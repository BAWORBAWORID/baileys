import { QueryIds, XWAPaths } from '../Types/index.js';
import { generateProfilePicture } from '../Utils/messages-media.js';
import { getBinaryNodeChild, getAllBinaryNodeChildren, getBinaryNodeChildren } from '../WABinary/index.js';
import { makeGroupsSocket } from './groups.js';
import { executeWMexQuery as genericExecuteWMexQuery } from './mex.js';

export const extractNewsletterMetadata = (node, isCreate) => {
    const result = getBinaryNodeChild(node, 'result')?.content?.toString();
    if (!result) return null;
    const parsed = JSON.parse(result);
    const data = parsed.data;
    const metadataPath = isCreate ? data?.[XWAPaths.xwa2_newsletter_create] : data?.[XWAPaths.xwa2_newsletter_metadata];
    if (!metadataPath) return null;
    const thread = metadataPath.thread_metadata;
    const viewer = metadataPath.viewer_metadata;
    return {
        id: metadataPath.id,
        state: metadataPath.state?.type,
        owner: undefined,
        name: thread?.name?.text,
        nameTime: +thread?.name?.update_time,
        description: thread?.description?.text,
        descriptionTime: +thread?.description?.update_time,
        creation_time: +thread?.creation_time,
        invite: thread?.invite,
        handle: thread?.handle,
        picture: thread?.picture?.direct_path || null,
        preview: thread?.preview?.direct_path || null,
        reaction_codes: thread?.settings?.reaction_codes?.value,
        subscribers: +thread?.subscribers_count,
        verification: thread?.verification,
        viewer_metadata: viewer
    };
};

const parseNewsletterCreateResponse = (response) => {
    const { id, thread_metadata: thread, viewer_metadata: viewer } = response;
    return {
        id: id,
        owner: undefined,
        name: thread.name.text,
        creation_time: parseInt(thread.creation_time, 10),
        description: thread.description.text,
        invite: thread.invite,
        subscribers: parseInt(thread.subscribers_count, 10),
        verification: thread.verification,
        picture: {
            id: thread.picture.id,
            directPath: thread.picture.direct_path
        },
        mute_state: viewer?.mute
    };
};

const parseNewsletterMetadata = (result) => {
    if (typeof result !== 'object' || result === null) {
        return null;
    }
    if ('id' in result && typeof result.id === 'string') {
        return result;
    }
    if ('result' in result && typeof result.result === 'object' && result.result !== null && 'id' in result.result) {
        return result.result;
    }
    return null;
};

export const makeNewsletterSocket = (config) => {
    const sock = makeGroupsSocket(config);
    const { query, generateMessageTag } = sock;
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
        return executeWMexQuery(variables, QueryIds.UPDATE_METADATA, XWAPaths.xwa2_newsletter_metadata);
    };
    return {
        ...sock,
        extractNewsletterMetadata,
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
        newsletterUnmute: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.UNMUTE, XWAPaths.xwa2_newsletter_unmute_v2);
        },
        newsletterReactionMode: async (jid, mode) => {
            const val = String(mode).toLowerCase().trim();
            const enabled = ['true', 'enable', 'ENABLE', 'on', 'ON', '1'].includes(val) || mode === true;
            const disabled = ['false', 'disable', 'DISABLE', 'desable', 'DESABLE', 'off', 'OFF', '0'].includes(val) || mode === false;
            return executeWMexQuery({
                newsletter_id: jid,
                updates: { settings: { reaction_codes: { value: enabled ? 'ENABLED' : disabled ? 'DISABLED' : val.toUpperCase() } } }
            }, QueryIds.JOB_MUTATION, XWAPaths.xwa2_newsletter_metadata);
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
        newsletterFetchUpdates: async (jid, count, after, since) => {
            const attrs = {
                count: count.toString()
            };
            if (after) {
                attrs.after = after.toString();
            }
            if (since) {
                attrs.since = since.toString();
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
                        attrs
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
        newsletterSendPost: async (jid, content) => {
            const { generateWAMessageFromContent } = await import('../Utils/index.js');
            const msg = await generateWAMessageFromContent(jid, content, {});
            await query({
                tag: 'message',
                attrs: {
                    to: jid,
                    id: generateMessageTag(),
                    type: 'text',
                    ...(content.contextInfo?.stanzaId ? { edit: '7' } : {})
                },
                content: [
                    {
                        tag: 'newsletter',
                        attrs: { to: jid },
                        content: undefined
                    }
                ]
            });
            await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
            return msg;
        },
        newsletterSendMessage: async (jid, content, options = {}) => {
            const { generateWAMessage } = await import('../Utils/index.js');
            const msg = await generateWAMessage(jid, content, { ...options, userJid: sock.user?.id });
            await sock.relayMessage(jid, msg.message, { messageId: msg.key.id, ...options });
            return msg;
        },
        newsletterDeleteMessage: async (jid, key) => {
            await sock.sendMessage(jid, { delete: key });
        },
        newsletterEditMessage: async (jid, key, content) => {
            await sock.sendMessage(jid, { ...content, edit: key });
        },
        newsletterForwardMessage: async (jid, msg) => {
            await sock.sendMessage(jid, { forward: msg });
        },
        newsletterPinMessage: async (jid, key, time = 86400) => {
            await sock.sendMessage(jid, { pin: { key, type: 1, time } });
        },
        newsletterUnpinMessage: async (jid, key) => {
            await sock.sendMessage(jid, { pin: { key, type: 0, time: 0 } });
        },
        newsletterStarMessage: async (jid, key, star = true) => {
            await sock.chatModify({ star: { messages: [key], star } }, jid);
        },
        newsletterMarkAsRead: async (jid, key) => {
            await sock.readMessages([key]);
        },
        newsletterMarkAsUnread: async (jid, key) => {
            await sock.chatModify({ markRead: false, lastMessages: [key] }, jid);
        },
        newsletterFetchAllSubscribe: async () => {
            return await executeWMexQuery({}, QueryIds.FETCH_SUBSCRIBE, XWAPaths.xwa2_newsletter_subscribed);
        },
        newsletterUpdateCategory: async (jid, category) => {
            return await newsletterUpdate(jid, { topic: category });
        },
        newsletterUpdateSettings: async (jid, settings) => {
            const variables = { newsletter_id: jid, updates: { settings } };
            return executeWMexQuery(variables, QueryIds.UPDATE_METADATA, XWAPaths.xwa2_newsletter_update);
        },
        newsletterPromoteAdmin: async (jid, userJid) => {
            await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'set',
                    xmlns: 'newsletter',
                    to: jid
                },
                content: [
                    {
                        tag: 'admin_promote',
                        attrs: {},
                        content: [{ tag: 'participant', attrs: { jid: userJid } }]
                    }
                ]
            });
        },
        newsletterViewStats: async (jid, serverId) => {
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
                        attrs: { count: '1', server_id: String(serverId) }
                    }
                ]
            });
            return result;
        },
        newsletterSendPostIQ: async (jid, content) => {
            const result = await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'set',
                    xmlns: 'newsletter',
                    to: jid
                },
                content: [
                    {
                        tag: 'publish',
                        attrs: {},
                        content: Array.isArray(content) ? content : [content]
                    }
                ]
            });
            return result;
        },
        newsletterPinMessageIQ: async (jid, serverId, durationSecs = 86400) => {
            await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'set',
                    xmlns: 'newsletter',
                    to: jid
                },
                content: [
                    {
                        tag: 'pin',
                        attrs: { server_id: String(serverId), duration: String(durationSecs) }
                    }
                ]
            });
        },
        newsletterUnpinMessageIQ: async (jid, serverId) => {
            await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'set',
                    xmlns: 'newsletter',
                    to: jid
                },
                content: [
                    {
                        tag: 'unpin',
                        attrs: { server_id: String(serverId) }
                    }
                ]
            });
        },
        newsletterInviteAdmin: async (jid, userJid) => {
            return executeWMexQuery({ newsletter_id: jid, user_id: userJid }, QueryIds.ADMIN_INVITE, XWAPaths.xwa2_newsletter_admin_invite_create);
        },
        newsletterRevokeAdminInvite: async (jid, userJid) => {
            return executeWMexQuery({ newsletter_id: jid, user_id: userJid }, QueryIds.ADMIN_INVITE_REVOKE, XWAPaths.xwa2_newsletter_admin_invite_revoke);
        },
        newsletterAcceptAdminInvite: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.ADMIN_INVITE_ACCEPT, XWAPaths.xwa2_newsletter_admin_invite_accept);
        },
        newsletterAdminMetadata: async (jid, options = {}) => {
            const {
                fetchPendingAdmins = true,
                fetchAdminCount = true,
                fetchCapabilities = false,
                fetchAdminProfile = false,
                includeAdminSettings = false,
                includeJarvisConfig = false
            } = options;
            return executeWMexQuery(
                {
                    jid,
                    include_thread_metadata: false,
                    include_messages: false,
                    fetch_pending_admin_invites: fetchPendingAdmins,
                    fetch_admin_count: fetchAdminCount,
                    fetch_capabilities: fetchCapabilities,
                    fetch_admin_profile: fetchAdminProfile,
                    include_admin_settings: includeAdminSettings,
                    include_jarvis_config: includeJarvisConfig
                },
                QueryIds.ADMIN_METADATA,
                XWAPaths.xwa2_newsletter_admin
            );
        },
        newsletterAdminProfileUpdate: async (jid, updates) => {
            return executeWMexQuery({ newsletter_id: jid, updates }, QueryIds.ADMIN_PROFILE_UPDATE, XWAPaths.xwa2_newsletter_admin_profile_update);
        },
        newsletterDirectoryList: async (options = {}) => {
            const { limit = 20, interests = null, sortField = 'SUBSCRIBER_COUNT', sortOrder = 'DESC' } = options;
            const variables = { limit, sort_field: sortField, sort_order: sortOrder };
            if (interests?.length) variables.interests = interests;
            return executeWMexQuery(variables, QueryIds.DIRECTORY_LIST, XWAPaths.xwa2_newsletters_directory_list);
        },
        newsletterDirectorySearch: async (searchText, options = {}) => {
            const { limit = 20, startCursor = null, categories = null } = options;
            const variables = { search_text: searchText, limit };
            if (startCursor) variables.start_cursor = startCursor;
            if (categories?.length) variables.categories = categories;
            return executeWMexQuery(variables, QueryIds.DIRECTORY_SEARCH, XWAPaths.xwa2_newsletters_directory_search);
        },
        newsletterDirectoryCategoryPreview: async (limit = 5) => {
            return executeWMexQuery({ limit }, QueryIds.DIRECTORY_CATEGORY_PREVIEW, XWAPaths.xwa2_newsletters_directory_category_preview);
        },
        newsletterSearch: async (searchQuery, limit = 20, startCursor = null) => {
            const variables = { query: searchQuery, limit };
            if (startCursor) variables.start_cursor = startCursor;
            return executeWMexQuery(variables, QueryIds.SEARCH, XWAPaths.xwa2_newsletters_search);
        },
        newsletterRecommended: async (limit = 10, numFollowed = null) => {
            const variables = { limit };
            if (numFollowed != null) variables.num_newsletters_followed = numFollowed;
            return executeWMexQuery(variables, QueryIds.RECOMMENDED, XWAPaths.xwa2_newsletters_recommended);
        },
        newsletterSimilar: async (jid, limit = 10) => {
            return executeWMexQuery({ newsletter_id: jid, limit }, QueryIds.SIMILAR, XWAPaths.xwa2_newsletters_similar);
        },
        newsletterFollowingList: async (startCursor = null, limit = 20) => {
            const variables = { limit };
            if (startCursor) variables.start_cursor = startCursor;
            return executeWMexQuery(variables, QueryIds.FOLLOWING_LIST, XWAPaths.xwa2_newsletter_following);
        },
        newsletterInsights: async (jid, period = null) => {
            const variables = { newsletter_id: jid };
            if (period) variables.period = period;
            return executeWMexQuery(variables, QueryIds.INSIGHTS, XWAPaths.xwa2_newsletter_admin_insights);
        },
        newsletterPollVoterList: async (jid, serverId, option = null, startCursor = null) => {
            const variables = { id: jid, server_id: serverId };
            if (option != null) variables.option = option;
            if (startCursor) variables.start_cursor = startCursor;
            return executeWMexQuery(variables, QueryIds.POLL_VOTER_LIST, XWAPaths.xwa2_newsletters_poll_voter_list);
        },
        newsletterReactionSenders: async (jid, serverId, startCursor = null) => {
            const variables = { id: jid, server_id: serverId };
            if (startCursor) variables.start_cursor = startCursor;
            return executeWMexQuery(variables, QueryIds.REACTION_SENDERS_LIST, XWAPaths.xwa2_newsletters_reaction_sender_list);
        },
        newsletterBlockUser: async (jid, userJid) => {
            return executeWMexQuery({ newsletter_id: jid, user_id: userJid }, QueryIds.BLOCK_USER, 'xwa2_newsletter_block_user');
        },
        newsletterEnableWamo: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.WAMO_ENABLE_SUB, 'xwa2_newsletter_wamo_enable_sub');
        },
        newsletterDisableWamo: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.WAMO_DISABLE_SUB, 'xwa2_newsletter_wamo_disable_sub');
        },
        newsletterChangeWamo: async (jid, subConfig) => {
            return executeWMexQuery({ newsletter_id: jid, ...subConfig }, QueryIds.WAMO_CHANGE_SUB, 'xwa2_newsletter_wamo_change_sub');
        },
        wamoAfsAgeCollection: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.WAMO_AFS_AGE_COLLECTION, XWAPaths.xwa2_wamo_afs_age_collection);
        },
        wamoAssetCollection: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.WAMO_ASSET_COLLECTION, XWAPaths.xwa2_wamo_asset_collection);
        },
        wamoFetchAdhocNotice: async (noticeId) => {
            return executeWMexQuery({ notice_id: noticeId }, QueryIds.WAMO_FETCH_ADHOC_NOTICE, XWAPaths.xwa2_wamo_fetch_adhoc_notice_by_id);
        },
        wamoFetchIdentityToken: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.WAMO_FETCH_IDENTITY_TOKEN, XWAPaths.xwa2_wamo_fetch_identity_token);
        },
        wamoSubComplianceInfo: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.WAMO_SUB_COMPLIANCE_INFO, XWAPaths.xwa2_wamo_sub_get_compliance_info);
        },
        wamoUserIdVersion: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.WAMO_USER_ID_VERSION, XWAPaths.xwa2_wamo_user_id_version);
        },
        wamoSetUserIdVersion: async (jid, version) => {
            return executeWMexQuery({ newsletter_id: jid, version }, QueryIds.WAMO_SET_USER_ID_VERSION, XWAPaths.xwa2_wamo_set_user_id_version);
        },
        newsletterLeave: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.LEAVE, XWAPaths.xwa2_newsletter_leave_v2);
        },
        newsletterCreateVerified: async (name, description = null) => {
            return executeWMexQuery({ input: { name, description } }, QueryIds.CREATE_VERIFIED, XWAPaths.xwa2_newsletter_create_verified);
        },
        newsletterEnforcements: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.ENFORCEMENTS, XWAPaths.xwa2_newsletter_enforcements);
        },
        newsletterUserReports: async (jid, cursor = null) => {
            const variables = { newsletter_id: jid };
            if (cursor) variables.cursor = cursor;
            return executeWMexQuery(variables, QueryIds.USER_REPORTS, XWAPaths.xwa2_newsletter_user_reports);
        },
        newsletterCreateReportAppeal: async (jid, reason) => {
            return executeWMexQuery({ newsletter_id: jid, reason }, QueryIds.CREATE_REPORT_APPEAL, XWAPaths.xwa2_newsletter_create_report_appeal);
        },
        newsletterLinkPreviewCheck: async (url) => {
            return executeWMexQuery({ url }, QueryIds.LINK_PREVIEW_CHECK, XWAPaths.xwa2_newsletter_link_preview_check);
        },
        newsletterUpdateVerification: async (jid, verification) => {
            return executeWMexQuery({ newsletter_id: jid, verification }, QueryIds.UPDATE_VERIFICATION, XWAPaths.xwa2_newsletter_update_verification);
        },
        newsletterLabelPaidPartnership: async (jid, serverId, isPaidPartnership) => {
            return executeWMexQuery({ newsletter_id: jid, server_id: serverId, is_paid_partnership: isPaidPartnership }, QueryIds.LABEL_PAID_PARTNERSHIP, XWAPaths.xwa2_newsletter_label_paid_partnership);
        },
        newsletterLogExposures: async (events) => {
            return executeWMexQuery({ events }, QueryIds.LOG_EXPOSURES, XWAPaths.xwa2_newsletter_log_exposures);
        },
        newsletterUpdateUserSetting: async (jid, setting) => {
            return executeWMexQuery({ newsletter_id: jid, ...setting }, QueryIds.UPDATE_USER_SETTING, XWAPaths.xwa2_newsletter_update_user_setting);
        },
        newsletterRankingFeatures: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.RANKING_FEATURES, XWAPaths.xwa2_newsletter_ranking_features);
        },
        newsletterSendViewReceipt: async (jid, serverMessageIds) => {
            const ids = Array.isArray(serverMessageIds) ? serverMessageIds : [serverMessageIds];
            const receiptId = generateMessageTag();
            await query({
                tag: 'receipt',
                attrs: {
                    to: jid,
                    id: receiptId,
                    type: 'view'
                },
                content: [
                    {
                        tag: 'list',
                        attrs: {},
                        content: ids.map(id => ({ tag: 'item', attrs: { server_id: String(id) } }))
                    }
                ]
            });
        }
    };
};
//# sourceMappingURL=newsletter.js.map