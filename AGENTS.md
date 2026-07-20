# AGENTS.md — Baileys Node Modules Structure & Modifications

> **Purpose:** This file documents the full structure of `@whiskeysockets/baileys` (v7.0.0-rc13) and all custom modifications made to the `node_modules` directory. It exists so that AI assistants and future developers can understand the codebase without re-reading all source files.

---

## Package Info

- **Package:** `@whiskeysockets/baileys`
- **Version:** `7.0.0-rc13`
- **Entry:** `lib/index.js` (ESM)
- **Modified:** Yes — extensively modified in `node_modules`

---

## Directory Structure

```
@whiskeysockets/baileys/
├── AGENTS.md                          ← THIS FILE
├── README.md                          ← Updated with custom docs
├── package.json                       ← Modified (added cache-manager)
├── lib/
│   ├── index.js                       ← Modified (added Store export)
│   ├── Socket/
│   │   ├── index.js                   ← Socket chain entry
│   │   ├── socket.js                  ← Base layer
│   │   ├── chats.js                   ← Chat ops + detectDevice + getBroadcastListInfo
│   │   ├── groups.js                  ← Groups + groupMetadataCache
│   │   ├── newsletter.js              ← Newsletter (heavily modified)
│   │   ├── messages-send.js           ← Message sending (heavily modified)
│   │   ├── messages-recv.js           ← Message receiving + sendOfferCall
│   │   ├── business.js                ← Business/catalog ops
│   │   ├── communities.js             ← Communities (outermost layer)
│   │   ├── mex.js                     ← MEX/GraphQL helper
│   │   └── Client/                    ← WebSocket client
│   ├── Utils/
│   │   ├── index.js                   ← Re-exports (modified)
│   │   ├── messages.js                ← Message generation (heavily modified)
│   │   ├── messages-media.js          ← Media handling
│   │   ├── use-multi-file-auth-state.js
│   │   ├── use-single-file-auth-state.js  ← NEW FILE
│   │   ├── generics.js
│   │   ├── decode-wa-message.js
│   │   ├── crypto.js
│   │   ├── signal.js
│   │   ├── auth-utils.js
│   │   └── ... (other utils)
│   ├── Store/
│   │   ├── index.js                   ← NEW FILE (re-exports)
│   │   ├── make-in-memory-store.js    ← Converted to ESM
│   │   ├── make-ordered-dictionary.js ← Converted to ESM
│   │   ├── object-repository.js       ← Converted to ESM
│   │   └── make-cache-manager-store.js ← NEW FILE
│   ├── Types/
│   │   ├── Call.js                    ← Updated with JSDoc + WACallUpdateTypes
│   │   ├── Mex.js                     ← Added JOB_MUTATION QueryId
│   │   └── ... (other types)
│   ├── WABinary/
│   ├── WAM/
│   ├── WAUSync/
│   ├── Defaults/
│   └── Signal/
└── WAProto/
    └── index.js                       ← Protobuf definitions
```

---

## Socket Chain (How Layers Compose)

```
makeWASocket(config)
  └→ makeCommunitiesSocket       (communities.js)
      └→ makePrivacySocket       (privacy.js)
          └→ makeGraphQLSocket   (graphql.js)
              └→ makeInteropSocket (interop.js)
                  + imup instance (luxu.js)
                  └→ makeBusinessSocket (business.js)
                      └→ makeMessagesRecvSocket (messages-recv.js)
                          └→ makeMessagesSocket (messages-send.js)
                              └→ makeUsernameSocket (username.js)
                                  └→ makeNewsletterSocket (newsletter.js)
                                      └→ makeGroupsSocket (groups.js)
                                          └→ makeChatsSocket (chats.js)
                                              └→ makeSocket (socket.js) [BASE]
```

Each layer imports the previous via `import { makeXxxSocket } from './xxx.js'` and spreads `...sock` to add its own methods. The final `sock` object has ALL methods from ALL layers.

**Note:** `imup` (luxu.js) is a utility class attached to the socket as `sock.imup`, not a layer in the chain.

---

## Custom Modifications (What We Changed)

### 1. `lib/index.js` — Added Store Export
```diff
+ export * from './Store/index.js';
```
**Why:** `makeInMemoryStore`, `makeCacheManagerAuthState`, `ObjectRepository`, `makeOrderedDictionary` were not importable from the package root.

### 2. `lib/Store/index.js` — NEW FILE
Re-exports all Store modules:
- `makeCacheManagerAuthState` (from `make-cache-manager-store.js`)
- `makeInMemoryStore`, `waChatKey`, `waMessageID`, `waLabelAssociationKey` (from `make-in-memory-store.js`)
- `ObjectRepository` (from `object-repository.js`)
- `makeOrderedDictionary` (from `make-ordered-dictionary.js`)

### 3. `lib/Store/make-cache-manager-store.js` — NEW FILE
`makeCacheManagerAuthState(store, sessionKey)` — auth state using `cache-manager` for production (Redis, memory, etc.).

### 4. `lib/Store/make-in-memory-store.js` — Converted to ESM
Was CommonJS (`module.exports`), converted to ESM (`export default`).

### 5. `lib/Store/make-ordered-dictionary.js` — Converted to ESM
Was CommonJS, converted to ESM.

### 6. `lib/Store/object-repository.js` — Converted to ESM
Was CommonJS, converted to ESM.

### 7. `lib/Utils/use-single-file-auth-state.js` — NEW FILE
`useSingleFileAuthState(filename)` — stores entire auth state in a single JSON file with Mutex file locking. Simpler than `useMultiFileAuthState` but less efficient for large key stores.

### 8. `lib/Utils/index.js` — Added Export
```diff
+ export { useSingleFileAuthState } from './use-single-file-auth-state.js';
```

### 9. `lib/Utils/messages.js` — Heavily Modified

**Added in `generateWAMessageContent`:**
- `payment` — new message type that generates `interactiveMessage` with `nativeFlowMessage.buttons` for WhatsApp payment/PIX. Supports:
  - Simple: `{ payment: { merchantName, key, keyType, caption } }`
  - Custom: `{ payment: { payment_settings: [...], caption, totalAmount, currency } }`
  - Auto-generates `biz` node in `relayMessage`

**Modified `album` handler:**
- Now supports array format: `{ album: [{ image: ... }, { video: ... }] }`
- Each item can have its own `caption`, `mimetype`
- Supports both `image` and `video` types

### 10. `lib/Socket/messages-send.js` — Heavily Modified

**Auto-detect `additionalNodes` in `relayMessage`:**
- `interactiveMessage` with `name === 'payment_info'` or `'payment_key_info'` → auto-adds `biz` node with `payment_info`
- `interactiveMessage` with other names → auto-adds `biz` node with `mixed`
- `buttonsMessage` → auto-adds `biz` node with `mixed`
- `pollCreationMessage*` → auto-adds `meta` node
- `eventMessage` → auto-adds `meta` node
- `forwardedAiBotMessageInfo` → auto-adds `bot` + `biz` nodes

**Added `options.biz` shorthand in `sendMessage`:**
```js
sock.sendMessage(jid, content, {
    biz: { actual_actors, host_storage, privacy_mode_ts }
})
```
Auto-pushes `biz` additionalNode. Defaults: `actual_actors: '2'`, `host_storage: '2'`, `privacy_mode_ts: now`.

**Added `options.additionalNodes` support:**
```js
sock.sendMessage(jid, content, {
    additionalNodes: [{ tag: 'biz', attrs: {...}, content: [...] }]
})
```

**Added album array handling in `sendMessage`:**
- Detects `Array.isArray(content.album)`
- Sends parent album message first
- Auto-sends each child media with `albumParentKey` pointing to parent
- Returns `{ parent, children }`

### 11. `lib/Socket/messages-recv.js` — Modified

**Added `sendOfferCall(to, options)`:**
Outgoing call function (opposite of `rejectCall`):
```js
const callId = await sock.sendOfferCall('628xxx@s.whatsapp.net', {
    isVideo: false,    // video call
    isGroup: false,    // group call
    groupJid: undefined // group JID for group calls
})
```
Sends raw XMPP `call` → `offer` stanza with `call-id`, `call-creator`, optional `video` tag.

### 12. `lib/Socket/chats.js` — Modified

**Added `detectDevice(id)`:**
```js
const deviceInfo = sock.detectDevice('628xxx@s.whatsapp.net')
// { device: 'android', platform: 'Android', isBot: false }
```

**Added `getBroadcastListInfo(jid)`:**
```js
const info = await sock.getBroadcastListInfo('1234@broadcast')
// { name: 'My List', recipients: ['628xxx@s.whatsapp.net', ...] }
```

**Added `groupMetadataCache`:**
- `Map` with 60-second TTL
- Auto-cached on `groupMetadata()` calls
- Auto-invalidation on `groupFetchAllParticipating`
- `groupMetadataCacheClear(jid?)` — clear specific or all cache

### 13. `lib/Socket/groups.js` — Modified

**Added group metadata cache:**
```js
const groupMetadataCache = new Map() // key: jid, value: { data, timestamp }
```
- Cached on every `groupMetadata()` call
- TTL: 60 seconds
- Auto-invalidated when `groupFetchAllParticipating` is called
- `groupMetadataCacheClear(jid?)` exported on sock object

### 14. `lib/Socket/newsletter.js` — Heavily Modified

**Added functions:**
- `extractNewsletterMetadata(node)` — detailed parser for newsletter metadata
- `newsletterFetchUpdates(jid, count, after, since)` — fetch live updates
- `newsletterReactionMode(jid, mode)` — toggle reaction mode
- `newsletterSubscribers(jid)` — get subscriber count/info

**Modified:**
- `newsletterMetadata(type, key, role)` — added `view_role` parameter support
- `newsletterUpdate` — uses `XWAPaths` instead of hardcoded string

### 15. `lib/Socket/username.js` — NEW FILE

**Socket layer for username management (wraps `makeNewsletterSocket`):**

**Functions:**
- `checkUsername(username, includeSuggestions?, sessionId?)` — check availability
- `checkUsernameMulti(usernames[])` — check multiple usernames at once
- `setUsername(username, opts?)` — set username (opts: `{ source, sessionId, pin }`)
- `deleteUsername()` — delete username
- `getMyUsername()` — get current username
- `setUsernamePin(pin?)` — set or delete PIN protection
- `findUserByUsername(username, pin?)` — lookup contact by @username
- `fetchContactUsernames(...jids)` — fetch usernames by JID
- `getUsernameRecommendations(source?)` — get username suggestions
- `checkAndSetUsername(username)` — check availability and set if available

**Constants:**
- `USERNAME_QUERY_IDS` — MEX query IDs for all operations
- `USERNAME_CHECK_RESULT` — result enum (`SUCCESS`, `INVALID`)
- `USERNAME_SOURCE` — source enum (`FB`, `IG`, `USER_INPUT`, `SUGGESTION`)

### 16. `lib/Socket/mex.js` — Modified (username functions moved to username.js)

### 17. `lib/Socket/privacy.js` — NEW FILE

**Socket layer for privacy, status, account, and misc operations (wrapper, not config-based):**

**Privacy Functions:**
- `getPrivacySettings(jid, features?)` — fetch all privacy settings
- `setPrivacySetting(feature, setting)` — set a privacy setting
- `updatePrivacyContactList(feature, setting, jids)` — update contact list for privacy
- `getPrivacyContactList(feature, setting)` — fetch contact list for privacy

**Status/Profile Functions:**
- `updateTextStatus(text, emoji?)` — update text status (About)
- `getTextStatusList(jids, lastUpdateTime?)` — fetch text statuses for JIDs
- `updateUserStatus(status)` — update user status string
- `fetchUserPictureInfo(jid)` — fetch picture info
- `setProfilePictureMex(imageBase64, type?)` — set profile picture via MEX

**Account/Auth Functions:**
- `accountLogin(phoneNumber)` — mark account as logged-in
- `accountLogout(phoneNumber, enabledBiometric?)` — mark account as logged-out
- `addMultiAccountLink(phoneNumber)` — add multi-account link
- `addTrustedDevice(deviceId, deviceName)` — add trusted device
- `getTrustedDevices()` — fetch trusted devices
- `untrustTrustedDevice(deviceId, reason?)` — untrust a device
- `deleteTrustedDevice(deviceId)` — delete a trusted device
- `revokeMultiAccount(accountJid)` — revoke multi-account link

**Misc Functions:**
- `fetchMobileConfig(apiVersion?, epRefreshId?, flags?)` — fetch mobile config
- `notifyPushName(groupJid, participants)` — notify group of push name
- `contactIntegrityQuery(jids, useCase?)` — contact integrity check
- `bizIntegrityQuery(jids)` — business integrity check
- `linkedProfilesSet(profiles)` — set linked social profiles (FB/IG)
- `linkedProfilesRemove(types)` — remove linked profiles
- `linkedProfilesUpdate(profiles)` — update profile visibility
- `migrateBlocklistLid(jids, dhash?, dirtyAck?)` — migrate blocklist to LID
- `qrCodeScan(qrData)` — scan QR code via MEX

**Constants:**
- `PRIVACY_MEX_IDS` — MEX query IDs for all operations

### 18. `lib/Socket/graphql.js` — NEW FILE

**Socket layer for GraphQL execution (www, facebook, wamo schemas):**

**Token Management:**
- `setAccessToken(token)` — set access token
- `setWamoAuth(auth, host?)` — set wamo auth
- `acquireAccessToken()` — get/refresh access token

**GraphQL Executors:**
- `executeWWWGraphQL(docId, variables, accessToken, dataPath?)` — execute www-schema query
- `executeFacebookGraphQL(docId, variables, accessToken, dataPath?)` — execute facebook-schema query
- `executeWamoGraphQL(docId, variables, wamoAuth, dataPath?, wamoHost?)` — execute wamo-schema query

**Meta AI Functions:**
- `aiStudioMemoryQuery/Delete/DeleteAll()` — manage AI studio memory
- `metaAiMemoryQuery/Delete/DeleteAll()` — manage Meta AI memory
- `metaAiUnifiedMemoryQuery()` — query unified memory
- `metaAiMemoryOptOutStatus/Update()` — manage memory opt-out
- `metaAiCommandGet(chatJid, command)` — get AI command
- `metaAiVoiceOptionsFetch/WithDefaultFetch()` — fetch voice options
- `aiSubscriptionState/UsageData()` — subscription info

**Imagine/GenAI:**
- `imagineEdit/Expand/GenerateAnimate/Intents/Spotlight/Report()` — image generation
- `imagineMeIsOnboarded/Onboarding/OnboardingWithValidation/DeleteOnboarding()` — onboarding
- `aiCreationFetchCreatedBot/UpdatePersona/DeletePersona/UploadImage()` — bot personas
- `aiHomeFetchUserCreatedPersonas/Search()` — persona management

**Events:**
- `createEvent/GetEvent/UpdateEvent/DeleteEvent/ListEvents()` — event CRUD
- `updateEventRsvp/AddEventInvitations/RemoveEventInvitations()` — event invitations
- `getOrCreateEventInviteLink/RotateEventInviteLink()` — invite links

**Payments (Brazil PIX):**
- `brGetAuthOptions/SaveCpf/CreateEnrollment/CompleteEnrollmentRegistration()` — PIX enrollment
- `brAuthorizePayment()` — authorize payment
- `getPixBankList/MerchantPixInfo/CompletePixTransaction/PayWithPixPrecheck()` — PIX transactions
- `genCreatePaymentKey/UpdatePaymentKey/DeletePaymentKey()` — payment keys

**Payments (UPI India):**
- `getUpiAccounts/LiteDetails/Token/PurposeLimitingKey()` — UPI info
- `upiCreateMandate/AcceptMandate/RejectMandate/ExecuteMandate/PauseMandate/ResumeMandate/RevokeMandate()` — UPI mandates

**Wamo Commerce:**
- `wamoSubQueryStatus/CancelSubscription/OverrideStatus()` — subscription management
- `wamoPromoIdQuery/Set/Delete()` — promo management

**User/Account:**
- `facebookAccountName/InstagramAccountName()` — account names
- `getSignupMetadata/RegisterInit/RegisterAllAccounts()` — registration
- `checkDeviceRegistration()` — device registration

**Constants:**
- `WWW_GQL_IDS` — WWW schema query IDs
- `FACEBOOK_GQL_IDS` — Facebook schema query IDs
- `WAMO_GQL_IDS` — Wamo schema query IDs
- `CLIENT_PERSIST_GQL_IDS` — Client persist query IDs
- `ENDPOINTS` — GraphQL endpoints

### 19. `lib/Socket/interop.js` — NEW FILE

**Socket layer for interop group and privacy operations:**

**Functions:**
- `fetchIntegrators()` — fetch all available interop integrators
- `acceptInteropTOS()` — accept interop TOS
- `optInIntegrators(ids?)` — opt in to integrators
- `optOutIntegrators(ids?)` — opt out of integrators
- `resolveInteropUser(externalId, integratorId)` — resolve single interop user
- `resolveInteropUsers(users[])` — resolve multiple interop users
- `getReachabilitySettings()` — get reachability settings
- `setReachabilitySettings(users, enabled?)` — set reachability settings
- `blockInteropUser(jid)` — block interop user
- `unblockInteropUser(jid)` — unblock interop user
- `reportInteropSpam(jid, spamFlow?)` — report spam
- `trustInteropContact(jid)` — trust contact
- `initInterop()` — full initialization sequence
- `resetInteropSession(jid)` — reset Signal session
- `createInteropGroup(participants[])` — create interop group
- `leaveInteropGroup(jids)` — leave interop group(s)
- `addParticipantsToInteropGroup(groupJid, participants[])` — add participants
- `queryInteropGroupInfo(groupJid)` — query group info
- `updateInteropPrivacySetting(feature, setting)` — update privacy setting
- `updateInteropPrivacySettingWithContactList(feature, setting, contacts, type, dhash?)` — update with contact list
- `getInteropGroupAddPrivacy(jid, integratorId)` — check group add privacy

**Constants:**
- `INTEGRATOR_BIRDYCHAT` — BirdyChat integrator ID (12)
- `INTEGRATOR_HAIKET` — Haiket integrator ID (13)
- `INTEROP_MEX_QUERY_IDS` — MEX query IDs

### 20. `lib/Socket/luxu.js` — NEW FILE

**Utility class for advanced message handling (imup):**

**Methods:**
- `detectType(content)` — detect message type (PAYMENT, PRODUCT, ALBUM, EVENT, POLL_RESULT, ORDER, GROUP_STATUS, GROUP_LABEL)
- `handlePayment(content, quoted)` — handle payment message
- `handleProduct(content, jid, quoted)` — handle product message
- `handleAlbum(content, jid, quoted)` — handle album message
- `handleEvent(content, jid, quoted)` — handle event message
- `handlePollResult(content, jid, quoted)` — handle poll result message
- `handleOrderMessage(content, jid, quoted)` — handle order message
- `handleGroupStory(content, jid, quoted)` — handle group story
- `handleGbLabel(content, jid)` — handle group label

**Usage:**
```js
const result = await sock.imup.handleAlbum(content, jid, quoted)
```

### 21. `lib/Types/Call.js` — Updated

**Added JSDoc typedefs:**
```js
/**
 * @typedef {Object} WACallEvent
 * @property {string} chatId
 * @property {string} from
 * @property {string} callerPn
 * @property {string} id
 * @property {Date} date
 * @property {boolean} offline
 * @property {'offer'|'reject'|'accept'|'timeout'|'terminate'|'relaylatency'} status
 * @property {boolean} [isVideo]
 * @property {boolean} [isGroup]
 * @property {string} [groupJid]
 */

/**
 * @enum {string}
 */
export const WACallUpdateTypes = { ... }
```

### 16. `lib/Types/Mex.js` — Updated

**Added QueryId:**
```diff
+ JOB_MUTATION: '74126'
```

### 17. `package.json` — Modified

**Added dependency:**
```diff
+ "cache-manager": "^7.2.8"
```

### 18. `README.md` — Updated

- Added **Custom Pairing Code** section
- Added **Saving & Restoring Sessions** with 3 auth methods
- Added **Implementing a Data Store** with examples
- Added **Send Offer Call (Outgoing Call)** section
- Updated Index/Table of Contents

---

## Package-Level Exports (What's Importable)

```js
import makeWASocket, {
    // Auth State
    useMultiFileAuthState,
    useSingleFileAuthState,     // ← NEW
    makeCacheManagerAuthState,  // ← NEW (via Store)
    makeCacheableSignalKeyStore,

    // Store
    makeInMemoryStore,          // ← NEW (via Store)
    makeOrderedDictionary,      // ← NEW (via Store)
    ObjectRepository,           // ← NEW (via Store)
    waChatKey, waMessageID,     // ← NEW (via Store)

    // Types
    DisconnectReason,
    WAMessageStubType,
    WAMessageStatus,

    // Utils
    downloadMediaMessage,
    getContentType,
    getAggregateVotesInPollMessage,
    Browsers,
    BufferJSON,
    generateWAMessage,
    generateWAMessageFromContent,

    // WABinary
    isJidGroup,
    isPnUser,
    isLidUser,
    jidDecode,
    jidEncode,
    jidNormalizedUser,

    // Defaults
    WA_DEFAULT_EPHEMERAL,
    DEFAULT_CONNECTION_CONFIG
} from '@whiskeysockets/baileys'
```

---

## Socket Instance Methods (All Layers)

### Base (`sock.`)
`type`, `ws`, `ev`, `authState`, `signalRepository`, `user`, `generateMessageTag`, `query`, `waitForMessage`, `waitForSocketOpen`, `sendRawMessage`, `sendNode`, `logout`, `end`, `registerSocketEndHandler`, `onUnexpectedError`, `uploadPreKeys`, `requestPairingCode`, `executeUSyncQuery`, `onWhatsApp`, `fetchAccountReachoutTimelock`, `fetchNewChatMessageCap`, `sendUnifiedSession`, `wamBuffer`, `sendWAMBuffer`

### Username Layer (NEW)
**`checkUsername`**, **`checkUsernameMulti`**, **`setUsername`**, **`deleteUsername`**, **`getMyUsername`**, **`getUsernameRecommendations`**, **`setUsernamePin`**, **`findUserByUsername`**, **`fetchContactUsernames`**, **`checkAndSetUsername`**, `USERNAME_QUERY_IDS`, `USERNAME_CHECK_RESULT`, `USERNAME_SOURCE`

### Privacy Layer (NEW)
**`getPrivacySettings`**, **`setPrivacySetting`**, **`updatePrivacyContactList`**, **`getPrivacyContactList`**, **`updateTextStatus`**, **`getTextStatusList`**, **`updateUserStatus`**, **`fetchUserPictureInfo`**, **`setProfilePictureMex`**, **`accountLogin`**, **`accountLogout`**, **`addMultiAccountLink`**, **`addTrustedDevice`**, **`getTrustedDevices`**, **`untrustTrustedDevice`**, **`deleteTrustedDevice`**, **`revokeMultiAccount`**, **`fetchMobileConfig`**, **`notifyPushName`**, **`contactIntegrityQuery`**, **`bizIntegrityQuery`**, **`linkedProfilesSet`**, **`linkedProfilesRemove`**, **`linkedProfilesUpdate`**, **`migrateBlocklistLid`**, **`qrCodeScan`**, `PRIVACY_MEX_IDS`

### Chat Layer
`fetchPrivacySettings`, `upsertMessage`, `appPatch`, `sendPresenceUpdate`, `presenceSubscribe`, `profilePictureUrl`, `fetchBlocklist`, `fetchStatus`, `fetchDisappearingDuration`, `updateProfilePicture`, `removeProfilePicture`, `updateProfileStatus`, `updateProfileName`, `updateBlockStatus`, `updateLastSeenPrivacy`, `updateOnlinePrivacy`, `updateProfilePicturePrivacy`, `updateStatusPrivacy`, `updateReadReceiptsPrivacy`, `updateGroupsAddPrivacy`, `updateDefaultDisappearingMode`, `getBusinessProfile`, **`getBroadcastListInfo`** ← NEW, `chatModify`, `cleanDirtyBits`, `addOrEditContact`, `removeContact`, `addLabel`, `addChatLabel`, `removeChatLabel`, `addMessageLabel`, `removeMessageLabel`, `star`, `addOrEditQuickReply`, `removeQuickReply`, **`detectDevice`** ← NEW, `createCallLink`, `getBotListV2`

### Group Layer
`groupMetadata`, **`groupMetadataCacheClear`** ← NEW, `groupCreate`, `groupLeave`, `groupUpdateSubject`, `groupRequestParticipantsList`, `groupRequestParticipantsUpdate`, `groupParticipantsUpdate`, `groupUpdateDescription`, `groupInviteCode`, `groupRevokeInvite`, `groupAcceptInvite`, `groupAcceptInviteV4`, `groupGetInviteInfo`, `groupToggleEphemeral`, `groupSettingUpdate`, `groupMemberAddMode`, `groupJoinApprovalMode`, `groupFetchAllParticipating`

### Newsletter Layer
**`extractNewsletterMetadata`** ← NEW, `newsletterCreate`, `newsletterUpdate`, `newsletterSubscribers` ← NEW, `newsletterMetadata`, `newsletterFollow`, `newsletterUnfollow`, `newsletterMute`, `newsletterUnmute`, **`newsletterReactionMode`** ← NEW, `newsletterUpdateName`, `newsletterUpdateDescription`, `newsletterUpdatePicture`, `newsletterRemovePicture`, `newsletterReactMessage`, `newsletterFetchMessages`, **`newsletterFetchUpdates`** ← NEW, `subscribeNewsletterUpdates`, `newsletterAdminCount`, `newsletterChangeOwner`, `newsletterDemote`, `newsletterDelete`, **`newsletterSendPost`** ← NEW, **`newsletterSendMessage`** ← NEW, **`newsletterDeleteMessage`** ← NEW, **`newsletterEditMessage`** ← NEW, **`newsletterForwardMessage`** ← NEW, **`newsletterPinMessage`** ← NEW, **`newsletterUnpinMessage`** ← NEW, **`newsletterStarMessage`** ← NEW, **`newsletterMarkAsRead`** ← NEW, **`newsletterMarkAsUnread`** ← NEW, **`newsletterFetchAllSubscribe`** ← NEW, **`newsletterUpdateCategory`** ← NEW, **`newsletterUpdateSettings`** ← NEW, **`newsletterPromoteAdmin`** ← NEW, **`newsletterViewStats`** ← NEW, **`newsletterSendPostIQ`** ← NEW, **`newsletterPinMessageIQ`** ← NEW, **`newsletterUnpinMessageIQ`** ← NEW, **`newsletterInviteAdmin`** ← NEW, **`newsletterRevokeAdminInvite`** ← NEW, **`newsletterAcceptAdminInvite`** ← NEW, **`newsletterAdminMetadata`** ← NEW, **`newsletterAdminProfileUpdate`** ← NEW, **`newsletterDirectoryList`** ← NEW, **`newsletterDirectorySearch`** ← NEW, **`newsletterDirectoryCategoryPreview`** ← NEW, **`newsletterSearch`** ← NEW, **`newsletterRecommended`** ← NEW, **`newsletterSimilar`** ← NEW, **`newsletterFollowingList`** ← NEW, **`newsletterInsights`** ← NEW, **`newsletterPollVoterList`** ← NEW, **`newsletterReactionSenders`** ← NEW, **`newsletterBlockUser`** ← NEW, **`newsletterEnableWamo`** ← NEW, **`newsletterDisableWamo`** ← NEW, **`newsletterChangeWamo`** ← NEW, **`wamoAfsAgeCollection`** ← NEW, **`wamoAssetCollection`** ← NEW, **`wamoFetchAdhocNotice`** ← NEW, **`wamoFetchIdentityToken`** ← NEW, **`wamoSubComplianceInfo`** ← NEW, **`wamoUserIdVersion`** ← NEW, **`wamoSetUserIdVersion`** ← NEW, **`newsletterLeave`** ← NEW, **`newsletterCreateVerified`** ← NEW, **`newsletterEnforcements`** ← NEW, **`newsletterUserReports`** ← NEW, **`newsletterCreateReportAppeal`** ← NEW, **`newsletterLinkPreviewCheck`** ← NEW, **`newsletterUpdateVerification`** ← NEW, **`newsletterLabelPaidPartnership`** ← NEW, **`newsletterLogExposures`** ← NEW, **`newsletterUpdateUserSetting`** ← NEW, **`newsletterRankingFeatures`** ← NEW, **`newsletterSendViewReceipt`** ← NEW

### Message Send Layer
`readMessages`, `relayMessage`, `sendReceipt`, `sendReceipts`, `refreshMediaConn`, `getMediaHost`, `waUploadToServer`, `sendPeerDataOperationMessage`, `getUSyncDevices`, `messageRetryManager`, `updateMediaMessage`, **`sendMessage`** (primary user-facing method with `options.biz`, `options.additionalNodes`, album array support)

### Message Recv Layer
`sendMessageAck`, `sendRetryRequest`, `rejectCall`, **`sendOfferCall`** ← NEW, `fetchMessageHistory`, `requestPlaceholderResend`

### Business Layer
`getOrderDetails`, `getCatalog`, `getCollections`, `productCreate`, `productDelete`, `productUpdate`, `updateBussinesProfile`, `updateCoverPhoto`, `removeCoverPhoto`

### Community Layer (outermost)
`communityMetadata`, `communityCreate`, `communityCreateGroup`, `communityLeave`, `communityUpdateSubject`, `communityLinkGroup`, `communityUnlinkGroup`, `communityFetchLinkedGroups`, `communityRequestParticipantsList`, `communityRequestParticipantsUpdate`, `communityParticipantsUpdate`, `communityUpdateDescription`, `communityInviteCode`, `communityRevokeInvite`, `communityAcceptInvite`, `communityAcceptInviteV4`, `communityGetInviteInfo`, `communityToggleEphemeral`, `communitySettingUpdate`, `communityMemberAddMode`, `communityJoinApprovalMode`, `communityFetchAllParticipating`

### Privacy Layer (NEW)
**`getPrivacySettings`**, **`setPrivacySetting`**, **`updatePrivacyContactList`**, **`getPrivacyContactList`**, **`updateTextStatus`**, **`getTextStatusList`**, **`updateUserStatus`**, **`fetchUserPictureInfo`**, **`setProfilePictureMex`**, **`accountLogin`**, **`accountLogout`**, **`addMultiAccountLink`**, **`addTrustedDevice`**, **`getTrustedDevices`**, **`untrustTrustedDevice`**, **`deleteTrustedDevice`**, **`revokeMultiAccount`**, **`fetchMobileConfig`**, **`notifyPushName`**, **`contactIntegrityQuery`**, **`bizIntegrityQuery`**, **`linkedProfilesSet`**, **`linkedProfilesRemove`**, **`linkedProfilesUpdate`**, **`migrateBlocklistLid`**, **`qrCodeScan`**, `PRIVACY_MEX_IDS`

### GraphQL Layer (NEW)
**`setAccessToken`**, **`setWamoAuth`**, **`acquireAccessToken`**, **`executeWWWGraphQL`**, **`executeFacebookGraphQL`**, **`executeWamoGraphQL`**, **`aiStudioMemoryQuery/Delete/DeleteAll`**, **`metaAiMemoryQuery/Delete/DeleteAll`**, **`metaAiUnifiedMemoryQuery`**, **`metaAiMemoryOptOutStatus/Update`**, **`metaAiCommandGet`**, **`metaAiVoiceOptionsFetch/WithDefaultFetch`**, **`aiSubscriptionState`**, **`aiUsageData`**, **`imagineEdit/Expand/GenerateAnimate/Intents/Spotlight/Report`**, **`imagineMeIsOnboarded/Onboarding/OnboardingWithValidation/DeleteOnboarding`**, **`aiCreationFetchCreatedBot/UpdatePersona/DeletePersona/UploadImage`**, **`aiHomeFetchUserCreatedPersonas/Search`**, **`createEvent/GetEvent/UpdateEvent/DeleteEvent/ListEvents`**, **`updateEventRsvp/AddEventInvitations/RemoveEventInvitations`**, **`getOrCreateEventInviteLink/RotateEventInviteLink`**, **`brGetAuthOptions/SaveCpf/CreateEnrollment/CompleteEnrollmentRegistration`**, **`brAuthorizePayment`**, **`getPixBankList/MerchantPixInfo/CompletePixTransaction/PayWithPixPrecheck`**, **`genCreatePaymentKey/UpdatePaymentKey/DeletePaymentKey`**, **`getUpiAccounts/LiteDetails/Token/PurposeLimitingKey`**, **`upiCreateMandate/AcceptMandate/RejectMandate/ExecuteMandate/PauseMandate/ResumeMandate/RevokeMandate`**, **`wamoSubQueryStatus/CancelSubscription/OverrideStatus`**, **`wamoPromoIdQuery/Set/Delete`**, **`facebookAccountName/InstagramAccountName`**, **`getSignupMetadata/RegisterInit/RegisterAllAccounts`**, **`checkDeviceRegistration`**, `WWW_GQL_IDS`, `FACEBOOK_GQL_IDS`, `WAMO_GQL_IDS`, `CLIENT_PERSIST_GQL_IDS`, `ENDPOINTS`

### Interop Layer (NEW)
**`fetchIntegrators`**, **`acceptInteropTOS`**, **`optInIntegrators`**, **`optOutIntegrators`**, **`resolveInteropUser`**, **`resolveInteropUsers`**, **`getReachabilitySettings`**, **`setReachabilitySettings`**, **`blockInteropUser`**, **`unblockInteropUser`**, **`reportInteropSpam`**, **`trustInteropContact`**, **`initInterop`**, **`resetInteropSession`**, **`createInteropGroup`**, **`leaveInteropGroup`**, **`addParticipantsToInteropGroup`**, **`queryInteropGroupInfo`**, **`updateInteropPrivacySetting`**, **`updateInteropPrivacySettingWithContactList`**, **`getInteropGroupAddPrivacy`**, `INTEGRATOR_BIRDYCHAT`, `INTEGRATOR_HAIKET`, `INTEROP_MEX_QUERY_IDS`

### Luxu Utility (NEW, attached as `sock.imup`)
**`imup.detectType`**, **`imup.handlePayment`**, **`imup.handleProduct`**, **`imup.handleAlbum`**, **`imup.handleEvent`**, **`imup.handlePollResult`**, **`imup.handleOrderMessage`**, **`imup.handleGroupStory`**, **`imup.handleGbLabel`**

---

## Key Files to Read Before Modifying

| Task | Files to Read |
|------|---------------|
| Add new message type | `Utils/messages.js` (generateWAMessageContent), `Socket/messages-send.js` (relayMessage, sendMessage) |
| Add new socket method | `Socket/<layer>.js` — add function, add to return object |
| Modify call handling | `Socket/messages-recv.js` (handleCall, rejectCall, sendOfferCall) |
| Modify group behavior | `Socket/groups.js` (groupMetadata, groupFetchAllParticipating) |
| Add auth state method | `Utils/use-xxx-auth-state.js`, `Utils/index.js` (re-export), `lib/index.js` (if package-level export needed) |
| Add store module | `Store/xxx.js`, `Store/index.js` (re-export), `lib/index.js` (package-level export) |
| Modify newsletter | `Socket/newsletter.js` |
| Add biz/node metadata | `Socket/messages-send.js` (relayMessage auto-detect, sendMessage options.biz) |

---

## Conventions

- **ESM only** — all files use `import`/`export`, no CommonJS
- **Socket layers** — each file exports a `makeXxxSocket(config)` function that takes config and returns an object with methods
- **Spread pattern** — each layer does `const sock = makePrevLayer(config); return { ...sock, newMethod1, newMethod2 }`
- **Events** — use `ev.emit()` for events, `ev.on()` to listen
- **Query pattern** — `query({ tag: 'iq', attrs: {...}, content: [...] })` for XMPP IQ stanzas
- **Proto usage** — `WAProto.Message.Type.create(obj)` for building protobuf messages

---

## Last Updated

2026-07-21 — Initial AGENTS.md created with all modifications documented.
