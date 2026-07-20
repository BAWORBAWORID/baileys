<h1 align='center'><img alt="Baileys logo" src="https://raw.githubusercontent.com/WhiskeySockets/Baileys/refs/heads/master/Media/logo.png" height="75"/></h1>

<div align='center'>Baileys is a WebSockets-based TypeScript library for interacting with the WhatsApp Web API.</div>


> [!CAUTION]
> NOTICE OF BREAKING CHANGE.
>
> As of 7.0.0, multiple breaking changes were introduced into the library.
>
> Please check out https://whiskey.so/migrate-latest for more information.

# Important Note
This is a temporary README.md, the new guide is in development and will this file will be replaced with .github/README.md (already a default on GitHub).

New guide link: https://baileys.wiki

# Get Support

If you'd like business to enterprise-level support from Rajeh, the current maintainer of Baileys, you can book a video chat. Book a 1 hour time slot by contacting him on Discord or pre-ordering [here](https://purpshell.dev/book). The earlier you pre-order the better, as his time slots usually fill up very quickly. He offers immense value per hour and will answer all your questions before the time runs out.

If you are a business, we encourage you to contribute back to the high development costs of the project and to feed the maintainers who dump tens of hours a week on this. You can do so by booking meetings or sponsoring below. All support, even in bona fide / contribution hours, is welcome by businesses of all sizes. This is not condoning or endorsing businesses to use the library. See the Disclaimer below.

# Sponsor
If you'd like to financially support this project, you can do so by supporting the current maintainer [here](https://purpshell.dev/sponsor).

# Disclaimer
This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates.
The official WhatsApp website can be found at whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.

The maintainers of Baileys do not in any way condone the use of this application in practices that violate the Terms of Service of WhatsApp. The maintainers of this application call upon the personal responsibility of its users to use this application in a fair way, as it is intended to be used.
Use at your own discretion. Do not spam people with this. We discourage any stalkerware, bulk or automated messaging usage.

##

- Baileys does not require Selenium or any other browser to be interface with WhatsApp Web, it does so directly using a **WebSocket**.
- Not running Selenium or Chromium saves you like **half a gig** of ram :/
- Baileys supports interacting with the multi-device & web versions of WhatsApp.
- Thank you to [@pokearaujo](https://github.com/pokearaujo/multidevice) for writing his observations on the workings of WhatsApp Multi-Device. Also, thank you to [@Sigalor](https://github.com/sigalor/whatsapp-web-reveng) for writing his observations on the workings of WhatsApp Web and thanks to [@Rhymen](https://github.com/Rhymen/go-whatsapp/) for the __go__ implementation.

> [!IMPORTANT]
> The original repository had to be removed by the original author - we now continue development in this repository here.
This is the only official repository and is maintained by the community.
> **Join the Discord [here](https://discord.gg/WeJM5FP9GG)**

## Example

Do check out & run [example.ts](Example/example.ts) to see an example usage of the library.
The script covers most common use cases.
To run the example script, download or clone the repo and then type the following in a terminal:
1. ``` cd path/to/Baileys ```
2. ``` yarn ```
3. ``` yarn example ```

## Install

Use the stable version:
```
yarn add @whiskeysockets/baileys
```

Use the edge version (no guarantee of stability, but latest fixes + features)
```
yarn add github:WhiskeySockets/Baileys
```

Then import your code using:
```ts
import makeWASocket from '@whiskeysockets/baileys'
```

# Links

- [Discord](https://discord.gg/WeJM5FP9GG)
- [Docs](https://baileys.wiki/docs/intro/)

# Index

- [Connecting Account](#connecting-account)
    - [Connect with QR-CODE](#starting-socket-with-qr-code)
    - [Connect with Pairing Code](#starting-socket-with-pairing-code)
    - [Receive Full History](#receive-full-history)
- [Important Notes About Socket Config](#important-notes-about-socket-config)
    - [Caching Group Metadata (Recommended)](#caching-group-metadata-recommended)
    - [Improve Retry System & Decrypt Poll Votes](#improve-retry-system--decrypt-poll-votes)
    - [Receive Notifications in Whatsapp App](#receive-notifications-in-whatsapp-app)

- [Saving & Restoring Sessions](#saving--restoring-sessions)
    - [useMultiFileAuthState (Recommended)](#1-usemultifileauthstate-recommended-for-most-use-cases)
    - [useSingleFileAuthState (Simple)](#2-usesinglefileauthstate-simple-single-json-file)
    - [makeCacheManagerAuthState (Production)](#3-makecachemanagerauthstate-for-production-with-cache-stores)
    - [Auth State Comparison](#all-auth-state-methods-comparison)
- [Handling Events](#handling-events)
    - [Example to Start](#example-to-start)
    - [Decrypt Poll Votes](#decrypt-poll-votes)
    - [Summary of Events on First Connection](#summary-of-events-on-first-connection)
- [Implementing a Data Store](#implementing-a-data-store)
    - [In-Memory Store](#in-memory-store-for-developmenttesting)
    - [Using Store with Auth State](#using-store-with-auth-state)
- [Whatsapp IDs Explain](#whatsapp-ids-explain)
- [Utility Functions](#utility-functions)
- [Sending Messages](#sending-messages)
    - [Non-Media Messages](#non-media-messages)
        - [Text Message](#text-message)
        - [Quote Message](#quote-message-works-with-all-types)
        - [Mention User](#mention-user-works-with-most-types)
        - [Forward Messages](#forward-messages)
        - [Location Message](#location-message)
        - [Contact Message](#contact-message)
        - [Reaction Message](#reaction-message)
        - [Pin Message](#pin-message)
        - [Poll Message](#poll-message)
    - [Sending with Link Preview](#sending-messages-with-link-previews)
    - [Media Messages](#media-messages)
        - [Gif Message](#gif-message)
        - [Video Message](#video-message)
        - [Audio Message](#audio-message)
        - [Image Message](#image-message)
        - [ViewOnce Message](#view-once-message)
- [Modify Messages](#modify-messages)
    - [Delete Messages (for everyone)](#deleting-messages-for-everyone)
    - [Edit Messages](#editing-messages)
- [Manipulating Media Messages](#manipulating-media-messages)
    - [Thumbnail in Media Messages](#thumbnail-in-media-messages)
    - [Downloading Media Messages](#downloading-media-messages)
    - [Re-upload Media Message to Whatsapp](#re-upload-media-message-to-whatsapp)
- [Reject Call](#reject-call)
- [Send Offer Call (Outgoing Call)](#send-offer-call-outgoing-call)
- [Send States in Chat](#send-states-in-chat)
    - [Reading Messages](#reading-messages)
    - [Update Presence](#update-presence)
- [Modifying Chats](#modifying-chats)
    - [Archive a Chat](#archive-a-chat)
    - [Mute/Unmute a Chat](#muteunmute-a-chat)
    - [Mark a Chat Read/Unread](#mark-a-chat-readunread)
    - [Delete a Message for Me](#delete-a-message-for-me)
    - [Delete a Chat](#delete-a-chat)
    - [Star/Unstar a Message](#starunstar-a-message)
    - [Disappearing Messages](#disappearing-messages)
- [User Querys](#user-querys)
    - [Check If ID Exists in Whatsapp](#check-if-id-exists-in-whatsapp)
    - [Query Chat History (groups too)](#query-chat-history-groups-too)
    - [Fetch Status](#fetch-status)
    - [Fetch Profile Picture (groups too)](#fetch-profile-picture-groups-too)
    - [Fetch Bussines Profile (such as description or category)](#fetch-bussines-profile-such-as-description-or-category)
    - [Fetch Someone's Presence (if they're typing or online)](#fetch-someones-presence-if-theyre-typing-or-online)
- [Username Management](#username-management)
    - [Check Username](#check-username)
    - [Set Username](#set-username)
    - [Delete Username](#delete-username)
- [Privacy & Account Management](#privacy--account-management)
    - [Privacy Settings](#privacy-settings)
    - [Status & Profile](#status--profile)
    - [Account & Auth](#account--auth)
    - [Linked Profiles](#linked-profiles)
    - [Misc Operations](#misc-operations)
- [Change Profile](#change-profile)
    - [Change Profile Status](#change-profile-status)
    - [Change Profile Name](#change-profile-name)
    - [Change Display Picture (groups too)](#change-display-picture-groups-too)
    - [Remove display picture (groups too)](#remove-display-picture-groups-too)
- [Groups](#groups)
    - [Create a Group](#create-a-group)
    - [Add/Remove or Demote/Promote](#addremove-or-demotepromote)
    - [Change Subject (name)](#change-subject-name)
    - [Change Description](#change-description)
    - [Change Settings](#change-settings)
    - [Leave a Group](#leave-a-group)
    - [Get Invite Code](#get-invite-code)
    - [Revoke Invite Code](#revoke-invite-code)
    - [Join Using Invitation Code](#join-using-invitation-code)
    - [Get Group Info by Invite Code](#get-group-info-by-invite-code)
    - [Query Metadata (participants, name, description...)](#query-metadata-participants-name-description)
    - [Join using groupInviteMessage](#join-using-groupinvitemessage)
    - [Get Request Join List](#get-request-join-list)
    - [Approve/Reject Request Join](#approvereject-request-join)
    - [Get All Participating Groups Metadata](#get-all-participating-groups-metadata)
    - [Toggle Ephemeral](#toggle-ephemeral)
    - [Change Add Mode](#change-add-mode)
- [Privacy](#privacy)
    - [Block/Unblock User](#blockunblock-user)
    - [Get Privacy Settings](#get-privacy-settings)
    - [Get BlockList](#get-blocklist)
    - [Update LastSeen Privacy](#update-lastseen-privacy)
    - [Update Online Privacy](#update-online-privacy)
    - [Update Profile Picture Privacy](#update-profile-picture-privacy)
    - [Update Status Privacy](#update-status-privacy)
    - [Update Read Receipts Privacy](#update-read-receipts-privacy)
    - [Update Groups Add Privacy](#update-groups-add-privacy)
    - [Update Default Disappearing Mode](#update-default-disappearing-mode)
- [Broadcast Lists & Stories](#broadcast-lists--stories)
    - [Send Broadcast & Stories](#send-broadcast--stories)
    - [Query a Broadcast List's Recipients & Name](#query-a-broadcast-lists-recipients--name)
- [Writing Custom Functionality](#writing-custom-functionality)
    - [Enabling Debug Level in Baileys Logs](#enabling-debug-level-in-baileys-logs)
    - [How Whatsapp Communicate With Us](#how-whatsapp-communicate-with-us)
    - [Register a Callback for Websocket Events](#register-a-callback-for-websocket-events)

## Connecting Account

WhatsApp provides a multi-device API that allows Baileys to be authenticated as a second WhatsApp client by scanning a **QR code** or **Pairing Code** with WhatsApp on your phone.

> [!NOTE]
> **[Here](#example-to-start) is a simple example of event handling**

> [!TIP]
> **You can see all supported socket configs in the [SocketConfig type alias](https://baileys.wiki/docs/api/type-aliases/SocketConfig/) (Recommended)**

### Starting socket with **QR-CODE**

> [!TIP]
> You can customize browser name if you connect with **QR-CODE**, with `Browser` constant, we have some browsers config, **see the [BrowsersMap type alias](https://baileys.wiki/docs/api/type-aliases/BrowsersMap/)**

```ts
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({
    // can provide additional config here
    browser: Browsers.ubuntu('My App'),
    printQRInTerminal: true
})
```

If the connection is successful, you will see a QR code printed on your terminal screen, scan it with WhatsApp on your phone and you'll be logged in!

### Starting socket with **Pairing Code**


> [!IMPORTANT]
> Pairing Code isn't Mobile API, it's a method to connect Whatsapp Web without QR-CODE, you can connect only with one device, see [here](https://faq.whatsapp.com/1324084875126592/?cms_platform=web)

The phone number can't have `+` or `()` or `-`, only numbers, you must provide country code

```ts
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({
    // can provide additional config here
    printQRInTerminal: false //need to be false
})

if (!sock.authState.creds.registered) {
    const number = 'XXXXXXXXXXX'
    const code = await sock.requestPairingCode(number)
    console.log(code)
}
```

### Custom Pairing Code

You can provide a custom 8-character pairing code instead of using a random one:

```ts
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({
    printQRInTerminal: false
})

if (!sock.authState.creds.registered) {
    const number = 'XXXXXXXXXXX'
    // custom code must be exactly 8 characters
    const code = await sock.requestPairingCode(number, 'MYCODE123')
    console.log(code) // MYCODE123
}
```

> [!NOTE]
> Custom pairing code must be exactly 8 characters. If omitted, a random code is generated automatically.

### Receive Full History

1. Set `syncFullHistory` as `true`
2. Baileys, by default, use chrome browser config
    - If you'd like to emulate a desktop connection (and receive more message history), this browser setting to your Socket config:

```ts
const sock = makeWASocket({
    ...otherOpts,
    // can use Windows, Ubuntu here too
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: true
})
```

## Important Notes About Socket Config

### Caching Group Metadata (Recommended)
- If you use baileys for groups, we recommend you to set `cachedGroupMetadata` in socket config, you need to implement a cache like this:

    ```ts
    const groupCache = new NodeCache({stdTTL: 5 * 60, useClones: false})

    const sock = makeWASocket({
        cachedGroupMetadata: async (jid) => groupCache.get(jid)
    })

    sock.ev.on('groups.update', async ([event]) => {
        const metadata = await sock.groupMetadata(event.id)
        groupCache.set(event.id, metadata)
    })

    sock.ev.on('group-participants.update', async (event) => {
        const metadata = await sock.groupMetadata(event.id)
        groupCache.set(event.id, metadata)
    })
    ```

### Improve Retry System & Decrypt Poll Votes
- If you want to improve sending message, retrying when error occurs and decrypt poll votes, you need to have a store and set `getMessage` config in socket like this:
    ```ts
    const sock = makeWASocket({
        getMessage: async (key) => await getMessageFromStore(key)
    })
    ```

### Receive Notifications in Whatsapp App
- If you want to receive notifications in whatsapp app, set `markOnlineOnConnect` to `false`
    ```ts
    const sock = makeWASocket({
        markOnlineOnConnect: false
    })
    ```
## Saving & Restoring Sessions

You obviously don't want to keep scanning the QR code every time you want to connect.

There are 3 methods to save auth state:

### 1. useMultiFileAuthState (Recommended for most use cases)

Saves each key as a separate file in a folder. Best for production — efficient and handles concurrent writes well.

```ts
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)
```

> [!IMPORTANT]
> `useMultiFileAuthState` saves each key as a separate file in the given folder. This is the recommended approach for most use cases.

### 2. useSingleFileAuthState (Simple, single JSON file)

Saves the entire auth state in one JSON file. Simpler but less efficient for large key stores. Good for quick prototyping.

```ts
import makeWASocket from '@whiskeysockets/baileys'
import { useSingleFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useSingleFileAuthState('./auth_state.json')

const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)
```

> [!NOTE]
> `useSingleFileAuthState` stores everything in a single JSON file with file locking (Mutex) for safety. For production, prefer `useMultiFileAuthState`.

### 3. makeCacheManagerAuthState (For production with cache stores)

Uses `cache-manager` for auth state storage. Ideal for production systems with Redis, Memcached, or any cache store supported by cache-manager.

```ts
import makeWASocket, { makeCacheManagerAuthState } from '@whiskeysockets/baileys'
import { createCache } from 'cache-manager'

// Create a cache store (e.g., memory, redis, etc.)
const store = createCache({ store: 'memory', max: 1000, ttl: 600 })

const { state, saveCreds } = await makeCacheManagerAuthState(store, 'session_key')

const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)
```

> [!NOTE]
> `makeCacheManagerAuthState` requires `cache-manager` as a dependency. Install with: `npm install cache-manager`

### All Auth State Methods Comparison

| Method | Storage | Best For |
|--------|---------|----------|
| `useMultiFileAuthState` | Folder with multiple files | Most use cases, recommended |
| `useSingleFileAuthState` | Single JSON file | Quick prototyping, simple setups |
| `makeCacheManagerAuthState` | Cache store (Redis, memory, etc.) | Production with external cache |

> [!NOTE]
> When a message is received/sent, due to signal sessions needing updating, the auth keys (`authState.keys`) will update. Whenever that happens, you must save the updated keys (`authState.keys.set()` is called). Not doing so will prevent your messages from reaching the recipient & cause other unexpected consequences. All three auth state functions above automatically take care of that.

## Handling Events

- Baileys uses the EventEmitter syntax for events.
They're all nicely typed up, so you shouldn't have any issues with an Intellisense editor like VS Code.

> [!IMPORTANT]
> **The events are in the [BaileysEventMap type alias](https://baileys.wiki/docs/api/type-aliases/BaileysEventMap/)**, it's important you see all events

You can listen to these events like this:
```ts
const sock = makeWASocket()
sock.ev.on('messages.upsert', ({ messages }) => {
    console.log('got messages', messages)
})
```

### Example to Start

> [!NOTE]
> This example includes basic auth storage too

> [!NOTE]
> For reliable serialization of the authentication state, especially when storing as JSON, always use the BufferJSON utility.

```ts
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        // can provide additional config here
        auth: state,
        printQRInTerminal: true
    })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    sock.ev.on('messages.upsert', event => {
        for (const m of event.messages) {
            console.log(JSON.stringify(m, undefined, 2))

            console.log('replying to', m.key.remoteJid)
            await sock.sendMessage(m.key.remoteJid!, { text: 'Hello Word' })
        }
    })

    // to storage creds (session info) when it updates
    sock.ev.on('creds.update', saveCreds)
}
// run in main file
connectToWhatsApp()
```

> [!IMPORTANT]
> In `messages.upsert` it's recommended to use a loop like `for (const message of event.messages)` to handle all messages in array

### Decrypt Poll Votes

- By default poll votes are encrypted and handled in `messages.update`
- That's a simple example
```ts
sock.ev.on('messages.update', event => {
    for(const { key, update } of event) {
        if(update.pollUpdates) {
            const pollCreation = await getMessage(key)
            if(pollCreation) {
                console.log(
                    'got poll update, aggregation: ',
                    getAggregateVotesInPollMessage({
                        message: pollCreation,
                        pollUpdates: update.pollUpdates,
                    })
                )
            }
        }
    }
})
```

- `getMessage` is a [store](#implementing-a-data-store) implementation (in your end)

### Summary of Events on First Connection

1. When you connect first time, `connection.update` will be fired requesting you to restart sock
2. Then, history messages will be received in `messaging.history-set`

## Implementing a Data Store

- Baileys does not come with a defacto storage for chats, contacts, or messages. However, a simple in-memory implementation has been provided. The store listens for chat updates, new messages, message updates, etc., to always have an up-to-date version of the data.

> [!IMPORTANT]
> I highly recommend building your own data store, as storing someone's entire chat history in memory is a terrible waste of RAM.

### In-Memory Store (for development/testing)

```ts
import makeWASocket, { makeInMemoryStore } from '@whiskeysockets/baileys'
// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ })
// can be read from a file
store.readFromFile('./baileys_store.json')
// saves the state to a file every 10s
setInterval(() => {
    store.writeToFile('./baileys_store.json')
}, 10_000)

const sock = makeWASocket({ })
// will listen from this socket
// the store can listen from a new socket once the current socket outlives its lifetime
store.bind(sock.ev)

sock.ev.on('chats.upsert', () => {
    // can use 'store.chats' however you want, even after the socket dies out
    // 'chats' => a KeyedDB instance
    console.log('got chats', store.chats.all())
})

sock.ev.on('contacts.upsert', () => {
    console.log('got contacts', Object.values(store.contacts))
})
```

The store also provides some simple functions such as `loadMessages` that utilize the store to speed up data retrieval.

### Using Store with Auth State

You can combine the store with any auth state method. Here's an example using `useSingleFileAuthState`:

```ts
import makeWASocket, { useSingleFileAuthState, makeInMemoryStore } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useSingleFileAuthState('./auth.json')
const store = makeInMemoryStore({ })

const sock = makeWASocket({
    auth: state,
    getMessage: async (key) => {
        return await store.loadMessage(key.remoteJid, key.id)
    }
})

store.bind(sock.ev)
sock.ev.on('creds.update', saveCreds)
```

## Whatsapp IDs Explain

- `id` is the WhatsApp ID, called `jid` too, of the person or group you're sending the message to.
    - It must be in the format ```[country code][phone number]@s.whatsapp.net```
	    - Example for people: ```+19999999999@s.whatsapp.net```.
	    - For groups, it must be in the format ``` 123456789-123345@g.us ```.
    - For broadcast lists, it's `[timestamp of creation]@broadcast`.
    - For stories, the ID is `status@broadcast`.

## Utility Functions

- `getContentType`, returns the content type for any message
- `getDevice`, returns the device from message
- `makeCacheableSignalKeyStore`, make auth store more fast
- `downloadContentFromMessage`, download content from any message

## Sending Messages

- Send all types of messages with a single function
    - **In the [AnyMessageContent type alias](https://baileys.wiki/docs/api/type-aliases/AnyMessageContent/) you can see all message contents supported, like text message**
    - **In the [MiscMessageGenerationOptions type alias](https://baileys.wiki/docs/api/type-aliases/MiscMessageGenerationOptions/) you can see all options supported, like quote message**

    ```ts
    const jid: string
    const content: AnyMessageContent
    const options: MiscMessageGenerationOptions

    sock.sendMessage(jid, content, options)
    ```

### Non-Media Messages

#### Text Message
```ts
await sock.sendMessage(jid, { text: 'hello word' })
```

#### Quote Message (works with all types)
```ts
await sock.sendMessage(jid, { text: 'hello word' }, { quoted: message })
```

#### Mention User (works with most types)
- @number is to mention in text, it's optional
```ts
await sock.sendMessage(
    jid,
    {
        text: '@12345678901',
        mentions: ['12345678901@s.whatsapp.net']
    }
)
```

#### Forward Messages
- You need to have message object, can be retrieved from [store](#implementing-a-data-store) or use a [message](https://baileys.wiki/docs/api/type-aliases/WAMessage/) object
```ts
const msg = getMessageFromStore() // implement this on your end
await sock.sendMessage(jid, { forward: msg }) // WA forward the message!
```

#### Location Message
```ts
await sock.sendMessage(
    jid,
    {
        location: {
            degreesLatitude: 24.121231,
            degreesLongitude: 55.1121221
        }
    }
)
```
#### Contact Message
```ts
const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n'
            + 'FN:Jeff Singh\n' // full name
            + 'ORG:Ashoka Uni;\n' // the organization of the contact
            + 'TEL;type=CELL;type=VOICE;waid=911234567890:+91 12345 67890\n' // WhatsApp ID + phone number
            + 'END:VCARD'

await sock.sendMessage(
    id,
    {
        contacts: {
            displayName: 'Jeff',
            contacts: [{ vcard }]
        }
    }
)
```

#### Reaction Message
- You need to pass the key of message, you can retrieve from [store](#implementing-a-data-store) or use a [key](https://baileys.wiki/docs/api/type-aliases/WAMessageKey/) object
```ts
await sock.sendMessage(
    jid,
    {
        react: {
            text: '💖', // use an empty string to remove the reaction
            key: message.key
        }
    }
)
```

#### Pin Message
- You need to pass the key of message, you can retrieve from [store](#implementing-a-data-store) or use a [key](https://baileys.wiki/docs/api/type-aliases/WAMessageKey/) object

- Time can be:

| Time  | Seconds        |
|-------|----------------|
| 24h    | 86.400        |
| 7d     | 604.800       |
| 30d    | 2.592.000     |

```ts
await sock.sendMessage(
    jid,
    {
        pin: {
            type: 1, // 0 to remove
            time: 86400
            key: message.key
        }
    }
)
```

#### Poll Message
```ts
await sock.sendMessage(
    jid,
    {
        poll: {
            name: 'My Poll',
            values: ['Option 1', 'Option 2', ...],
            selectableCount: 1,
            toAnnouncementGroup: false // or true
        }
    }
)
```

### Sending Messages with Link Previews

1. By default, wa does not have link generation when sent from the web
2. Baileys has a function to generate the content for these link previews
3. To enable this function's usage, add `link-preview-js` as a dependency to your project with `yarn add link-preview-js`
4. Send a link:
```ts
await sock.sendMessage(
    jid,
    {
        text: 'Hi, this was sent using https://github.com/whiskeysockets/baileys'
    }
)
```

### Media Messages

Sending media (video, stickers, images) is easier & more efficient than ever.

> [!NOTE]
> In media messages, you can pass `{ stream: Stream }` or `{ url: Url }` or `Buffer` directly, you can see more in the [WAMediaUpload type alias](https://baileys.wiki/docs/api/type-aliases/WAMediaUpload/)

- When specifying a media url, Baileys never loads the entire buffer into memory; it even encrypts the media as a readable stream.

> [!TIP]
> It's recommended to use Stream or Url to save memory

#### Gif Message
- Whatsapp doesn't support `.gif` files, that's why we send gifs as common `.mp4` video with `gifPlayback` flag
```ts
await sock.sendMessage(
    jid,
    {
        video: fs.readFileSync('Media/ma_gif.mp4'),
        caption: 'hello word',
        gifPlayback: true
    }
)
```

#### Video Message
```ts
await sock.sendMessage(
    id,
    {
        video: {
            url: './Media/ma_gif.mp4'
        },
        caption: 'hello word',
	    ptv: false // if set to true, will send as a `video note`
    }
)
```

#### Audio Message
- To audio message work in all devices you need to convert with some tool like `ffmpeg` with this flags:
    ```bash
        codec: libopus //ogg file
        ac: 1 //one channel
        avoid_negative_ts
        make_zero
    ```
    - Example:
    ```bash
    ffmpeg -i input.mp4 -avoid_negative_ts make_zero -ac 1 output.ogg
    ```
```ts
await sock.sendMessage(
    jid,
    {
        audio: {
            url: './Media/audio.mp3'
        },
        mimetype: 'audio/mp4'
    }
)
```

#### Image Message
```ts
await sock.sendMessage(
    id,
    {
        image: {
            url: './Media/ma_img.png'
        },
        caption: 'hello word'
    }
)
```

#### View Once Message

- You can send all messages above as `viewOnce`, you only need to pass `viewOnce: true` in content object

```ts
await sock.sendMessage(
    id,
    {
        image: {
            url: './Media/ma_img.png'
        },
        viewOnce: true, //works with video, audio too
        caption: 'hello word'
    }
)
```

## Modify Messages

### Deleting Messages (for everyone)

```ts
const msg = await sock.sendMessage(jid, { text: 'hello word' })
await sock.sendMessage(jid, { delete: msg.key })
```

**Note:** deleting for oneself is supported via `chatModify`, see in [this section](#modifying-chats)

### Editing Messages

- You can pass all editable contents here
```ts
await sock.sendMessage(jid, {
      text: 'updated text goes here',
      edit: response.key,
    });
```

## Manipulating Media Messages

### Thumbnail in Media Messages
- For media messages, the thumbnail can be generated automatically for images & stickers provided you add `jimp` or `sharp` as a dependency in your project using `yarn add jimp` or `yarn add sharp`.
- Thumbnails for videos can also be generated automatically, though, you need to have `ffmpeg` installed on your system.

### Downloading Media Messages

If you want to save the media you received
```ts
import { createWriteStream } from 'fs'
import { downloadMediaMessage, getContentType } from '@whiskeysockets/baileys'

sock.ev.on('messages.upsert', async ({ [m] }) => {
    if (!m.message) return // if there is no text or media message
    const messageType = getContentType(m) // get what type of message it is (text, image, video...)

    // if the message is an image
    if (messageType === 'imageMessage') {
        // download the message
        const stream = await downloadMediaMessage(
            m,
            'stream', // can be 'buffer' too
            { },
            {
                logger,
                // pass this so that baileys can request a reupload of media
                // that has been deleted
                reuploadRequest: sock.updateMediaMessage
            }
        )
        // save to file
        const writeStream = createWriteStream('./my-download.jpeg')
        stream.pipe(writeStream)
    }
}
```

### Re-upload Media Message to Whatsapp

- WhatsApp automatically removes old media from their servers. For the device to access said media -- a re-upload is required by another device that has it. This can be accomplished using:
```ts
await sock.updateMediaMessage(msg)
```

## Reject Call

- You can obtain `callId` and `callFrom` from `call` event

```ts
await sock.rejectCall(callId, callFrom)
```

## Send Offer Call (Outgoing Call)

- You can initiate a call to someone using `sendOfferCall`
- Returns a `callId` for tracking

```ts
// Voice call (default)
const callId = await sock.sendOfferCall('628xxx@s.whatsapp.net')
console.log('call sent with id:', callId)
```

### Options

```ts
// Video call
const callId = await sock.sendOfferCall('628xxx@s.whatsapp.net', { isVideo: true })

// Group call
const callId = await sock.sendOfferCall('group@g.us', { isGroup: true, groupJid: 'group@g.us' })

// Voice call (explicit)
const callId = await sock.sendOfferCall('628xxx@s.whatsapp.net', { isVideo: false })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `isVideo` | boolean | `false` | Send as video call |
| `isGroup` | boolean | `false` | Send as group call |
| `groupJid` | string | `undefined` | Group JID for group calls |

## Send States in Chat

### Reading Messages
- A set of message [keys](https://baileys.wiki/docs/api/type-aliases/WAMessageKey/) must be explicitly marked read now.
- You cannot mark an entire 'chat' read as it were with Baileys Web.
This means you have to keep track of unread messages.

```ts
const key: WAMessageKey
// can pass multiple keys to read multiple messages as well
await sock.readMessages([key])
```

The message ID is the unique identifier of the message that you are marking as read.
On a `WAMessage`, the `messageID` can be accessed using ```messageID = message.key.id```.

### Update Presence

- ``` presence ``` can be one of the values in the [WAPresence type alias](https://baileys.wiki/docs/api/type-aliases/WAPresence/)
- The presence expires after about 10 seconds.
- This lets the person/group with `jid` know whether you're online, offline, typing etc.

```ts
await sock.sendPresenceUpdate('available', jid)
```

> [!NOTE]
> If a desktop client is active, WA doesn't send push notifications to the device. If you would like to receive said notifications -- mark your Baileys client offline using `sock.sendPresenceUpdate('unavailable')`

## Modifying Chats

WA uses an encrypted form of communication to send chat/app updates. This has been implemented mostly and you can send the following updates:

> [!IMPORTANT]
> If you mess up one of your updates, WA can log you out of all your devices and you'll have to log in again.

### Archive a Chat
```ts
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
await sock.chatModify({ archive: true, lastMessages: [lastMsgInChat] }, jid)
```
### Mute/Unmute a Chat

- Supported times:

| Time  | Miliseconds     |
|-------|-----------------|
| Remove | null           |
| 8h     | 86.400.000     |
| 7d     | 604.800.000    |

```ts
// mute for 8 hours
await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid)
// unmute
await sock.chatModify({ mute: null }, jid)
```
### Mark a Chat Read/Unread
```ts
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
// mark it unread
await sock.chatModify({ markRead: false, lastMessages: [lastMsgInChat] }, jid)
```

### Delete a Message for Me
```ts
await sock.chatModify(
    {
        clear: {
            messages: [
                {
                    id: 'ATWYHDNNWU81732J',
                    fromMe: true,
                    timestamp: '1654823909'
                }
            ]
        }
    },
    jid
)

```
### Delete a Chat
```ts
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
await sock.chatModify({
        delete: true,
        lastMessages: [
            {
                key: lastMsgInChat.key,
                messageTimestamp: lastMsgInChat.messageTimestamp
            }
        ]
    },
    jid
)
```
### Pin/Unpin a Chat
```ts
await sock.chatModify({
        pin: true // or `false` to unpin
    },
    jid
)
```
### Star/Unstar a Message
```ts
await sock.chatModify({
        star: {
            messages: [
                {
                    id: 'messageID',
                    fromMe: true // or `false`
                }
            ],
            star: true // - true: Star Message; false: Unstar Message
        }
    },
    jid
)
```

### Disappearing Messages

- Ephemeral can be:

| Time  | Seconds        |
|-------|----------------|
| Remove | 0          |
| 24h    | 86.400     |
| 7d     | 604.800    |
| 90d    | 7.776.000  |

- You need to pass in **Seconds**, default is 7 days

```ts
// turn on disappearing messages
await sock.sendMessage(
    jid,
    // this is 1 week in seconds -- how long you want messages to appear for
    { disappearingMessagesInChat: WA_DEFAULT_EPHEMERAL }
)

// will send as a disappearing message
await sock.sendMessage(jid, { text: 'hello' }, { ephemeralExpiration: WA_DEFAULT_EPHEMERAL })

// turn off disappearing messages
await sock.sendMessage(
    jid,
    { disappearingMessagesInChat: false }
)
```

## User Querys

### Check If ID Exists in Whatsapp
```ts
const [result] = await sock.onWhatsApp(jid)
if (result.exists) console.log (`${jid} exists on WhatsApp, as jid: ${result.jid}`)
```

### Query Chat History (groups too)

- You need to have oldest message in chat
```ts
const msg = await getOldestMessageInChat(jid) // implement this on your end
await sock.fetchMessageHistory(
    50, //quantity (max: 50 per query)
    msg.key,
    msg.messageTimestamp
)
```
- Messages will be received in `messaging.history-set` event

### Fetch Status
```ts
const status = await sock.fetchStatus(jid)
console.log('status: ' + status)
```

### Fetch Profile Picture (groups too)
- To get the display picture of some person/group
```ts
// for low res picture
const ppUrl = await sock.profilePictureUrl(jid)
console.log(ppUrl)

// for high res picture
const ppUrl = await sock.profilePictureUrl(jid, 'image')
```

### Fetch Bussines Profile (such as description or category)
```ts
const profile = await sock.getBusinessProfile(jid)
console.log('business description: ' + profile.description + ', category: ' + profile.category)
```

### Fetch Someone's Presence (if they're typing or online)
```ts
// the presence update is fetched and called here
sock.ev.on('presence.update', console.log)

// request updates for a chat
await sock.presenceSubscribe(jid)
```

## Username Management

Manage your WhatsApp username using the MEX (GraphQL) protocol.

### Check Username

Check if a username is available and get suggestions if taken:

```ts
const result = await sock.checkUsername('myname')
console.log(result)
// { available: true, username: 'myname', session_id: '...' }
// or
// { available: false, username: 'myname', session_id: '...', suggestions: ['myname123', 'myname_'], rejectionReasons: [], suggestionsEligible: true }
```

**Options:**
```ts
const result = await sock.checkUsername('myname', true, 'custom-session-id')
```

### Set Username

Set or reserve a username for your WhatsApp account:

```ts
const result = await sock.setUsername('myname')
console.log(result)
```

**Options:**
```ts
const result = await sock.setUsername('myname', {
    pin: '123456',                    // optional PIN for username reservation
    sessionId: 'custom-session-id',   // optional, auto-generated if omitted
    source: 'USER_INPUT'              // 'USER_INPUT' | 'IG' | 'FB' | 'SUGGESTION'
})
```

### Delete Username

Delete your current username:

```ts
const result = await sock.deleteUsername()
console.log(result)
```

### Get My Username

Get your current username:

```ts
const username = await sock.getMyUsername()
console.log(username) // 'myname' or null
```

### Set Username PIN

Protect your username with a PIN:

```ts
// Set PIN
await sock.setUsernamePin('123456')

// Delete PIN
await sock.setUsernamePin(null)
```

### Find User by Username

Look up a contact by their @username:

```ts
const user = await sock.findUserByUsername('myname')
console.log(user) // { jid: '123456@s.whatsapp.net', contact: true } or null

// With PIN-protected username
const user = await sock.findUserByUsername('myname', '123456')
```

### Fetch Contact Usernames

Get usernames for one or more JIDs:

```ts
const usernames = await sock.fetchContactUsernames('123456@s.whatsapp.net', '789012@s.whatsapp.net')
console.log(usernames) // [{ id: '123456@s.whatsapp.net', username: 'myname' }, ...]
```

### Check Multiple Usernames

Check availability for multiple usernames at once:

```ts
const results = await sock.checkUsernameMulti(['name1', 'name2', 'name3'])
console.log(results)
```

### Get Username Recommendations

Get suggested usernames:

```ts
const suggestions = await sock.getUsernameRecommendations('FB')
console.log(suggestions)
```

### Check and Set Username

Convenience function to check availability and set if available:

```ts
const result = await sock.checkAndSetUsername('myname')
if (result.available) {
    console.log('Username set successfully!')
} else {
    console.log('Username taken, suggestions:', result.suggestions)
}
```

| Method | Parameters | Returns |
|--------|------------|---------|
| `checkUsername(username, includeSuggestions?, sessionId?)` | `username`: string, `includeSuggestions`: boolean (default true), `sessionId`: string (optional) | `{ available, username, session_id, suggestions?, rejectionReasons?, suggestionsEligible? }` |
| `setUsername(username, opts?)` | `username`: string, `opts`: `{ source?, sessionId?, pin? }` | MEX response data |
| `deleteUsername()` | none | MEX response data |
| `getMyUsername()` | none | `string` or `null` |
| `setUsernamePin(pin?)` | `pin`: string or null | MEX response data |
| `findUserByUsername(username, pin?)` | `username`: string, `pin`: string (optional) | `{ jid, contact }` or `null` |
| `fetchContactUsernames(...jids)` | `...jids`: string[] | `Array<{ id, username }>` |
| `checkUsernameMulti(usernames[])` | `usernames`: string[] | MEX response data |
| `getUsernameRecommendations(source?)` | `source`: string (optional) | MEX response data |
| `checkAndSetUsername(username)` | `username`: string | `{ available, ... }` or MEX response data |

## Privacy & Account Management

Manage privacy settings, status, account, and linked profiles via MEX (GraphQL) protocol.

### Privacy Settings

```ts
// Fetch all privacy settings
const settings = await sock.getPrivacySettings('your_jid@s.whatsapp.net')
console.log(settings)

// Set a privacy setting
// Features: "LAST_SEEN", "ONLINE", "PROFILE_PHOTO", "STATUS", "READ_RECEIPTS", "GROUPS", "CALLS", "SCREENSHOT", "LIVE_LOCATION"
// Settings: "ALL", "CONTACTS", "CONTACT_BLACKLIST", "NONE"
await sock.setPrivacySetting('LAST_SEEN', 'CONTACTS')

// Update contact list for a privacy setting
await sock.updatePrivacyContactList('PROFILE_PHOTO', 'CONTACTS', ['123456@s.whatsapp.net'])

// Fetch contact list for a privacy setting
const contacts = await sock.getPrivacyContactList('PROFILE_PHOTO', 'CONTACTS')
```

### Status & Profile

```ts
// Update text status (About)
await sock.updateTextStatus('Hello World! 🌍')
await sock.updateTextStatus('Hello', '😊') // with emoji

// Fetch text statuses for JIDs
const statuses = await sock.getTextStatusList(['123456@s.whatsapp.net'])

// Update user status string
await sock.updateUserStatus('Available')

// Fetch picture info
const picInfo = await sock.fetchUserPictureInfo('123456@s.whatsapp.net')

// Set profile picture via MEX
await sock.setProfilePictureMex(imageBase64, 'image')
```

### Account & Auth

```ts
// Mark account as logged-in
await sock.accountLogin('6281234567890')

// Mark account as logged-out
await sock.accountLogout('6281234567890', false)

// Add multi-account link
await sock.addMultiAccountLink('6281234567890')

// Add trusted device
await sock.addTrustedDevice('device-id-123', 'My Phone')

// Fetch trusted devices
const devices = await sock.getTrustedDevices()

// Untrust a device
await sock.untrustTrustedDevice('device-id-123')

// Delete a trusted device
await sock.deleteTrustedDevice('device-id-123')

// Revoke multi-account link
await sock.revokeMultiAccount('account_jid@s.whatsapp.net')
```

### Linked Profiles

```ts
// Set linked social profiles (FB/IG)
await sock.linkedProfilesSet([
    { type: 'facebook', username: 'myfb' },
    { type: 'instagram', username: 'myig' }
])

// Remove linked profiles
await sock.linkedProfilesRemove(['facebook', 'instagram'])

// Update profile visibility
await sock.linkedProfilesUpdate([
    { type: 'facebook', showOnProfile: true },
    { type: 'instagram', showOnProfile: false }
])
```

### Misc Operations

```ts
// Fetch mobile config
const config = await sock.fetchMobileConfig()

// Notify group of push name
await sock.notifyPushName('group@g.us', [
    { jid: '123456@s.whatsapp.net', pushName: 'John' }
])

// Contact integrity check
const integrity = await sock.contactIntegrityQuery(['123456@s.whatsapp.net'])

// Business integrity check
const bizIntegrity = await sock.bizIntegrityQuery(['123456@s.whatsapp.net'])

// Migrate blocklist to LID
await sock.migrateBlocklistLid(['123456@s.whatsapp.net'])

// Scan QR code
await sock.qrCodeScan(qrData)
```

## GraphQL Execution

Execute GraphQL queries across www, facebook, and wamo schemas.

```ts
import { makeWASocket, makeGraphQLSocket } from '@whiskeysockets/baileys'

const sock = makeWASocket({ auth: state })
const graphqlSock = makeGraphQLSocket(sock)

// Set access token
graphqlSock.setAccessToken('your-access-token')

// Execute www-schema GraphQL
const result = await graphqlSock.executeWWWGraphQL('DOC_ID', { variables }, 'access-token', 'data.path')

// Execute facebook-schema GraphQL
const fbResult = await graphqlSock.executeFacebookGraphQL('DOC_ID', { variables }, 'access-token')

// Execute wamo-schema GraphQL
graphqlSock.setWamoAuth({ auth: 'token', host: 'wamo-host' })
const wamoResult = await graphqlSock.executeWamoGraphQL('DOC_ID', { variables }, { auth: 'token' })
```

### Meta AI Functions

```ts
// AI Studio memory
const memory = await graphqlSock.aiStudioMemoryQuery()
await graphqlSock.aiStudioMemoryDeleteAll()

// Meta AI memory
const aiMemory = await graphqlSock.metaAiMemoryQuery()
await graphqlSock.metaAiMemoryDeleteAll()

// Meta AI unified memory
const unified = await graphqlSock.metaAiUnifiedMemoryQuery()

// Meta AI memory opt-out
const status = await graphqlSock.metaAiMemoryOptOutStatus()
await graphqlSock.metaAiMemoryOptOutUpdate(true)

// Meta AI command
const command = await graphqlSock.metaAiCommandGet('chat@jid', 'command')

// Voice options
const voices = await graphqlSock.metaAiVoiceOptionsFetch()
const defaultVoices = await graphqlSock.metaAiVoiceOptionsWithDefaultFetch()

// Subscription
const subscription = await graphqlSock.aiSubscriptionState()
const usage = await graphqlSock.aiUsageData()
```

### Imagine/GenAI

```ts
// Onboarding
await graphqlSock.imagineMeIsOnboarded()
await graphqlSock.imagineOnboarding({ ... })
await graphqlSock.imagineOnboardingWithValidation({ ... })
await graphqlSock.imagineDeleteOnboarding()

// Image generation
const result = await graphqlSock.imagineEdit({ ... })
const expanded = await graphqlSock.imagineExpand({ ... })
const animated = await graphqlSock.imagineGenerateAnimate({ ... })
const intents = await graphqlSock.imagineIntents({ ... })
const spotlight = await graphqlSock.imagineSpotlight({ ... })
await graphqlSock.imagineReport({ ... })

// Bot personas
const bot = await graphqlSock.aiCreationFetchCreatedBot()
await graphqlSock.aiCreationUpdatePersona({ ... })
await graphqlSock.aiCreationDeletePersona()
await graphqlSock.aiCreationUploadImage()

// Persona management
const personas = await graphqlSock.aiHomeFetchUserCreatedPersonas()
const search = await graphqlSock.aiHomeSearch({ ... })
```

### Events

```ts
// Event CRUD
const event = await graphqlSock.createEvent({ ... })
const fetched = await graphqlSock.getEvent()
await graphqlSock.updateEvent({ ... })
await graphqlSock.deleteEvent()
const events = await graphqlSock.listEvents()

// Event invitations
await graphqlSock.updateEventRsvp({ ... })
await graphqlSock.addEventInvitations({ ... })
await graphqlSock.removeEventInvitations({ ... })

// Event invite links
const link = await graphqlSock.getOrCreateEventInviteLink()
const rotated = await graphqlSock.rotateEventInviteLink()
```

### Payments (Brazil PIX)

```ts
// PIX enrollment
const options = await graphqlSock.brGetAuthOptions()
await graphqlSock.brSaveCpf({ ... })
const enrollment = await graphqlSock.brCreateEnrollment()
await graphqlSock.brCompleteEnrollmentRegistration()

// PIX authorization
await graphqlSock.brAuthorizePayment({ ... })

// PIX transactions
const banks = await graphqlSock.getPixBankList()
const merchant = await graphqlSock.getMerchantPixInfo()
await graphqlSock.completePixTransaction({ ... })
await graphqlSock.payWithPixPrecheck({ ... })

// Payment keys
const key = await graphqlSock.genCreatePaymentKey({ ... })
await graphqlSock.updatePaymentKey({ ... })
await graphqlSock.deletePaymentKey()
```

### Payments (UPI India)

```ts
// UPI info
const accounts = await graphqlSock.getUpiAccounts()
const details = await graphqlSock.getUpiLiteDetails()
const token = await graphqlSock.getUpiToken()
const purposeKey = await graphqlSock.getUpiPurposeLimitingKey()

// UPI mandates
await graphqlSock.upiCreateMandate({ ... })
await graphqlSock.upiAcceptMandate({ ... })
await graphqlSock.upiRejectMandate({ ... })
await graphqlSock.upiExecuteMandate({ ... })
await graphqlSock.upiPauseMandate({ ... })
await graphqlSock.upiResumeMandate({ ... })
await graphqlSock.upiRevokeMandate({ ... })
```

### Wamo Commerce

```ts
// Subscriptions
const status = await graphqlSock.wamoSubQueryStatus()
await graphqlSock.wamoCancelSubscription()
await graphqlSock.wamoOverrideStatus()

// Promos
const promo = await graphqlSock.wamoPromoIdQuery()
await graphqlSock.wamoPromoSet({ ... })
await graphqlSock.wamoPromoDelete()
```

### User/Account

```ts
// Account names
const fbName = await graphqlSock.facebookAccountName()
const igName = await graphqlSock.instagramAccountName()

// Registration
const meta = await graphqlSock.getSignupMetadata()
await graphqlSock.registerInit({ ... })
await graphqlSock.registerAllAccounts()

// Device registration
const registered = await graphqlSock.checkDeviceRegistration()
```

---

## Interop Groups & Privacy

Interop allows cross-platform messaging with third-party integrators.

```ts
import { makeWASocket, makeInteropSocket } from '@whiskeysockets/baileys'

const sock = makeWASocket({ auth: state })
const interopSock = makeInteropSocket(sock)

// Fetch integrators
const integrators = await interopSock.fetchIntegrators()

// Accept TOS
await interopSock.acceptInteropTOS()

// Opt in/out
await interopSock.optInIntegrators()
await interopSock.optOutIntegrators([12, 13])

// Resolve users
const user = await interopSock.resolveInteropUser('external-id', 12)
const users = await interopSock.resolveInteropUsers([
    { externalId: 'id1', integratorId: 12 },
    { externalId: 'id2', integratorId: 13 }
])

// Reachability
const settings = await interopSock.getReachabilitySettings()
await interopSock.setReachabilitySettings(users, true)

// Block/Spam
await interopSock.blockInteropUser('jid')
await interopSock.unblockInteropUser('jid')
await interopSock.reportInteropSpam('jid')

// Trust
await interopSock.trustInteropContact('jid')

// Initialize (full setup sequence)
await interopSock.initInterop()

// Session reset
await interopSock.resetInteropSession('jid')
```

### Interop Groups

```ts
// Create interop group
const group = await interopSock.createInteropGroup(['participant1@interop', 'participant2@interop'])

// Leave interop group(s)
await interopSock.leaveInteropGroup(['group1@g.us', 'group2@g.us'])

// Add participants
await interopSock.addParticipantsToInteropGroup('group@g.us', ['user@interop'])

// Query group info
const info = await interopSock.queryInteropGroupInfo('group@g.us')
```

### Interop Privacy

```ts
// Update privacy setting
await interopSock.updateInteropPrivacySetting('LAST_SEEN', 'CONTACTS')

// Update with contact list
await interopSock.updateInteropPrivacySettingWithContactList(
    'PROFILE_PHOTO',
    'CONTACT_BLACKLIST',
    [{ jid: '123456@s.whatsapp.net' }],
    'PHONE',
    'dhash'
)

// Check group add privacy
const privacy = await interopSock.getInteropGroupAddPrivacy('jid@interop', 12)
```

### Constants

```ts
import { INTEGRATOR_BIRDYCHAT, INTEGRATOR_HAIKET } from '@whiskeysockets/baileys'

console.log(INTEGRATOR_BIRDYCHAT) // 12
console.log(INTEGRATOR_HAIKET)    // 13
```

---

## Advanced Message Handling (imup)

The `imup` class provides utilities for handling complex message types.

```ts
import { makeWASocket, imup } from '@whiskeysockets/baileys'

const sock = makeWASocket({ auth: state })

// The imup instance is attached to the socket as sock.imup
```

### Detect Message Type

```ts
const type = sock.imup.detectType(content)
// Returns: 'PAYMENT', 'PRODUCT', 'ALBUM', 'EVENT', 'POLL_RESULT', 'ORDER', 'GROUP_STATUS', 'GROUP_LABEL', or null
```

### Handle Payment Message

```ts
const paymentContent = sock.imup.handlePayment(content, quoted)
await sock.sendMessage(jid, paymentContent)
```

### Handle Product Message

```ts
const productContent = sock.imup.handleProduct({
    title: 'Product Name',
    description: 'Product description',
    thumbnail: thumbnailBuffer,
    productId: 'product-id',
    retailerId: 'retailer-id',
    url: 'https://example.com',
    body: 'Product body',
    footer: 'Product footer',
    buttons: [],
    priceAmount1000: 100000,
    currencyCode: 'IDR'
}, jid, quoted)
await sock.sendMessage(jid, productContent)
```

### Handle Album Message

```ts
const albumContent = sock.imup.handleAlbum([
    { image: thumbnailBuffer },
    { video: videoBuffer, caption: 'Video caption' }
], jid, quoted)
// Sends album with parent + child messages
```

### Handle Event Message

```ts
const eventContent = sock.imup.handleEvent({
    name: 'Event Name',
    description: 'Event description',
    startTime: Date.now(),
    endTime: Date.now() + 3600000,
    location: { name: 'Location', degreesLatitude: 0, degreesLongitude: 0 }
}, jid, quoted)
await sock.sendMessage(jid, eventContent)
```

### Handle Poll Result

```ts
const pollResult = sock.imup.handlePollResult({
    name: 'Poll Name',
    pollVotes: [
        { optionName: 'Option 1', optionVoteCount: 5 },
        { optionName: 'Option 2', optionVoteCount: 3 }
    ],
    newsletter: {
        newsletterName: 'Newsletter Name',
        newsletterJid: '120363xxxx@newsletter'
    }
}, jid, quoted)
await sock.sendMessage(jid, pollResult)
```

### Handle Order Message

```ts
const orderContent = sock.imup.handleOrderMessage({
    orderTitle: 'Order Title',
    message: 'Order message',
    itemCount: 1,
    totalAmount1000: 50000,
    totalCurrencyCode: 'IDR',
    thumbnail: thumbnailBuffer
}, jid, quoted)
await sock.sendMessage(jid, orderContent)
```

### Handle Group Story

```ts
const storyContent = sock.imup.handleGroupStory({
    message: 'Story message'
}, jid, quoted)
```

### Handle Group Label

```ts
const labelContent = sock.imup.handleGbLabel({
    labelText: 'Label text'
}, 'group@g.us')
```

## Change Profile

### Change Profile Status
```ts
await sock.updateProfileStatus('Hello World!')
```
### Change Profile Name
```ts
await sock.updateProfileName('My name')
```
### Change Display Picture (groups too)
- To change your display picture or a group's

> [!NOTE]
> Like media messages, you can pass `{ stream: Stream }` or `{ url: Url }` or `Buffer` directly, you can see more in the [WAMediaUpload type alias](https://baileys.wiki/docs/api/type-aliases/WAMediaUpload/)

```ts
await sock.updateProfilePicture(jid, { url: './new-profile-picture.jpeg' })
```
### Remove display picture (groups too)
```ts
await sock.removeProfilePicture(jid)
```

## Newsletter Management

Manage WhatsApp Newsletter channels — create, update, follow, post, and more.

### Create Newsletter
```ts
const newsletter = await sock.newsletterCreate('My Newsletter', 'Description')
console.log(newsletter.id, newsletter.name)
```

### Create Verified Newsletter
```ts
const verified = await sock.newsletterCreateVerified('My Verified Newsletter', 'Description')
```

### Get Newsletter Metadata
```ts
const metadata = await sock.newsletterMetadata('JID', 'newsletter@g.us')
// or with role
const metadata = await sock.newsletterMetadata('JID', 'newsletter@g.us', 'ADMIN')
```

### Follow/Unfollow/Leave Newsletter
```ts
await sock.newsletterFollow('newsletter@g.us')
await sock.newsletterUnfollow('newsletter@g.us')
await sock.newsletterLeave('newsletter@g.us')
```

### Mute/Unmute Newsletter
```ts
await sock.newsletterMute('newsletter@g.us')
await sock.newsletterUnmute('newsletter@g.us')
```

### Send Post to Newsletter
```ts
// Text post
await sock.newsletterSendPost('newsletter@g.us', { text: 'Hello from newsletter!' })

// Image post
await sock.newsletterSendPost('newsletter@g.us', {
    image: { url: './image.png' },
    caption: 'Check this out!'
})

// Video post
await sock.newsletterSendPost('newsletter@g.us', {
    video: { url: './video.mp4' },
    caption: 'Video post'
})

// Reply to a message
await sock.newsletterSendPost('newsletter@g.us', {
    text: 'This is a reply'
}, { quoted: message })
```

### Send Post via IQ (Alternative)
```ts
await sock.newsletterSendPostIQ('newsletter@g.us', [{ tag: 'text', attrs: {}, content: 'Hello!' }])
```

### Send Message (Generic)
```ts
const msg = await sock.newsletterSendMessage('newsletter@g.us', { text: 'Hello!' })
// With options
const msg = await sock.newsletterSendMessage('newsletter@g.us', {
    image: { url: './image.png' },
    caption: 'Image'
}, { quoted: message })
```

### Delete/Edit/Forward Newsletter Message
```ts
await sock.newsletterDeleteMessage('newsletter@g.us', message.key)
await sock.newsletterEditMessage('newsletter@g.us', message.key, { text: 'Updated text' })
await sock.newsletterForwardMessage('newsletter@g.us', originalMessage)
```

### Pin/Unpin Newsletter Message
```ts
// Via sendMessage
await sock.newsletterPinMessage('newsletter@g.us', message.key, 86400)
await sock.newsletterUnpinMessage('newsletter@g.us', message.key)

// Via IQ (server_id based)
await sock.newsletterPinMessageIQ('newsletter@g.us', serverId, 86400)
await sock.newsletterUnpinMessageIQ('newsletter@g.us', serverId)
```

### Star/Unstar Newsletter Message
```ts
await sock.newsletterStarMessage('newsletter@g.us', message.key, true)
await sock.newsletterStarMessage('newsletter@g.us', message.key, false)
```

### Mark Newsletter Message as Read/Unread
```ts
await sock.newsletterMarkAsRead('newsletter@g.us', message.key)
await sock.newsletterMarkAsUnread('newsletter@g.us', message.key)
```

### Send View Receipt
```ts
await sock.newsletterSendViewReceipt('newsletter@g.us', serverMessageIds)
```

### Update Newsletter
```ts
await sock.newsletterUpdateName('newsletter@g.us', 'New Name')
await sock.newsletterUpdateDescription('newsletter@g.us', 'New Description')
await sock.newsletterUpdatePicture('newsletter@g.us', imageBuffer)
await sock.newsletterRemovePicture('newsletter@g.us')
await sock.newsletterUpdateCategory('newsletter@g.us', 'news')
await sock.newsletterUpdateSettings('newsletter@g.us', { reaction_codes: { value: 'ENABLED' } })
await sock.newsletterUpdateVerification('newsletter@g.us', 'verified')
await sock.newsletterUpdateUserSetting('newsletter@g.us', { muted: true })
```

### React to Newsletter Message
```ts
await sock.newsletterReactMessage('newsletter@g.us', 'server_id', '👍')
await sock.newsletterReactMessage('newsletter@g.us', 'server_id', null) // remove
```

### Fetch Newsletter Messages/Updates
```ts
const messages = await sock.newsletterFetchMessages('newsletter@g.us', 50)
const updates = await sock.newsletterFetchUpdates('newsletter@g.us', 20)
```

### Subscribe to Live Updates
```ts
const result = await sock.subscribeNewsletterUpdates('newsletter@g.us')
console.log(result?.duration)
```

### Fetch All Subscribed Newsletters
```ts
const subscribed = await sock.newsletterFetchAllSubscribe()
```

### Newsletter Admin Operations
```ts
const count = await sock.newsletterAdminCount('newsletter@g.us')
await sock.newsletterChangeOwner('newsletter@g.us', 'newowner@s.whatsapp.net')
await sock.newsletterDemote('newsletter@g.us', 'user@s.whatsapp.net')
await sock.newsletterPromoteAdmin('newsletter@g.us', 'user@s.whatsapp.net')
await sock.newsletterDelete('newsletter@g.us')
```

### Newsletter Admin Metadata & Profile
```ts
const adminMeta = await sock.newsletterAdminMetadata('newsletter@g.us', {
    fetchPendingAdmins: true,
    fetchAdminCount: true,
    fetchCapabilities: false,
    fetchAdminProfile: false,
    includeAdminSettings: false,
    includeJarvisConfig: false
})
await sock.newsletterAdminProfileUpdate('newsletter@g.us', { profile: 'updates' })
```

### Newsletter Admin Invites
```ts
await sock.newsletterInviteAdmin('newsletter@g.us', 'user@s.whatsapp.net')
await sock.newsletterRevokeAdminInvite('newsletter@g.us', 'user@s.whatsapp.net')
await sock.newsletterAcceptAdminInvite('newsletter@g.us')
```

### Newsletter Reaction Mode
```ts
await sock.newsletterReactionMode('newsletter@g.us', 'on')   // ENABLED
await sock.newsletterReactionMode('newsletter@g.us', true)   // ENABLED
await sock.newsletterReactionMode('newsletter@g.us', 'off')  // DISABLED
await sock.newsletterReactionMode('newsletter@g.us', false)  // DISABLED
```

### Newsletter Statistics & Insights
```ts
const stats = await sock.newsletterViewStats('newsletter@g.us', serverId)
const insights = await sock.newsletterInsights('newsletter@g.us', '30d')
```

### Newsletter Directory & Search
```ts
const list = await sock.newsletterDirectoryList({ limit: 20, sortField: 'SUBSCRIBER_COUNT' })
const search = await sock.newsletterDirectorySearch('news', { limit: 20 })
const preview = await sock.newsletterDirectoryCategoryPreview(5)
const results = await sock.newsletterSearch('tech', 20)
const recommended = await sock.newsletterRecommended(10)
const similar = await sock.newsletterSimilar('newsletter@g.us', 10)
const following = await sock.newsletterFollowingList()
```

### Newsletter Poll & Reactions
```ts
const voters = await sock.newsletterPollVoterList('newsletter@g.us', serverId, 'Option 1')
const senders = await sock.newsletterReactionSenders('newsletter@g.us', serverId)
```

### Newsletter Block & Report
```ts
await sock.newsletterBlockUser('newsletter@g.us', 'user@s.whatsapp.net')
const reports = await sock.newsletterUserReports('newsletter@g.us')
await sock.newsletterCreateReportAppeal('newsletter@g.us', 'reason')
await sock.newsletterLabelPaidPartnership('newsletter@g.us', serverId, true)
```

### Newsletter Enforcement & Verification
```ts
const enforcements = await sock.newsletterEnforcements('newsletter@g.us')
const preview = await sock.newsletterLinkPreviewCheck('https://example.com')
```

### Newsletter Analytics
```ts
await sock.newsletterLogExposures(events)
const features = await sock.newsletterRankingFeatures('newsletter@g.us')
```

### Newsletter Wamo (Paid Subscription)
```ts
await sock.newsletterEnableWamo('newsletter@g.us')
await sock.newsletterDisableWamo('newsletter@g.us')
await sock.newsletterChangeWamo('newsletter@g.us', { tier: 'premium' })
const ageCollection = await sock.wamoAfsAgeCollection('newsletter@g.us')
const assets = await sock.wamoAssetCollection('newsletter@g.us')
const notice = await sock.wamoFetchAdhocNotice('notice-id')
const token = await sock.wamoFetchIdentityToken('newsletter@g.us')
const compliance = await sock.wamoSubComplianceInfo('newsletter@g.us')
const version = await sock.wamoUserIdVersion('newsletter@g.us')
await sock.wamoSetUserIdVersion('newsletter@g.us', 2)
```

## Groups

- To change group properties you need to be admin

### Create a Group
```ts
// title & participants
const group = await sock.groupCreate('My Fab Group', ['1234@s.whatsapp.net', '4564@s.whatsapp.net'])
console.log('created group with id: ' + group.gid)
await sock.sendMessage(group.id, { text: 'hello there' }) // say hello to everyone on the group
```
### Add/Remove or Demote/Promote
```ts
// id & people to add to the group (will throw error if it fails)
await sock.groupParticipantsUpdate(
    jid,
    ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
    'add' // replace this parameter with 'remove' or 'demote' or 'promote'
)
```
### Change Subject (name)
```ts
await sock.groupUpdateSubject(jid, 'New Subject!')
```
### Change Description
```ts
await sock.groupUpdateDescription(jid, 'New Description!')
```
### Change Settings
```ts
// only allow admins to send messages
await sock.groupSettingUpdate(jid, 'announcement')
// allow everyone to send messages
await sock.groupSettingUpdate(jid, 'not_announcement')
// allow everyone to modify the group's settings -- like display picture etc.
await sock.groupSettingUpdate(jid, 'unlocked')
// only allow admins to modify the group's settings
await sock.groupSettingUpdate(jid, 'locked')
```
### Leave a Group
```ts
// will throw error if it fails
await sock.groupLeave(jid)
```
### Get Invite Code
- To create link with code use `'https://chat.whatsapp.com/' + code`
```ts
const code = await sock.groupInviteCode(jid)
console.log('group code: ' + code)
```
### Revoke Invite Code
```ts
const code = await sock.groupRevokeInvite(jid)
console.log('New group code: ' + code)
```
### Join Using Invitation Code
- Code can't have `https://chat.whatsapp.com/`, only code
```ts
const response = await sock.groupAcceptInvite(code)
console.log('joined to: ' + response)
```
### Get Group Info by Invite Code
```ts
const response = await sock.groupGetInviteInfo(code)
console.log('group information: ' + response)
```
### Query Metadata (participants, name, description...)
```ts
const metadata = await sock.groupMetadata(jid)
console.log(metadata.id + ', title: ' + metadata.subject + ', description: ' + metadata.desc)
```
### Join using `groupInviteMessage`
```ts
const response = await sock.groupAcceptInviteV4(jid, groupInviteMessage)
console.log('joined to: ' + response)
```
### Get Request Join List
```ts
const response = await sock.groupRequestParticipantsList(jid)
console.log(response)
```
### Approve/Reject Request Join
```ts
const response = await sock.groupRequestParticipantsUpdate(
    jid, // group id
    ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
    'approve' // or 'reject'
)
console.log(response)
```
### Get All Participating Groups Metadata
```ts
const response = await sock.groupFetchAllParticipating()
console.log(response)
```
### Toggle Ephemeral

- Ephemeral can be:

| Time  | Seconds        |
|-------|----------------|
| Remove | 0          |
| 24h    | 86.400     |
| 7d     | 604.800    |
| 90d    | 7.776.000  |

```ts
await sock.groupToggleEphemeral(jid, 86400)
```

### Change Add Mode
```ts
await sock.groupMemberAddMode(
    jid,
    'all_member_add' // or 'admin_add'
)
```

## Privacy

### Block/Unblock User
```ts
await sock.updateBlockStatus(jid, 'block') // Block user
await sock.updateBlockStatus(jid, 'unblock') // Unblock user
```
### Get Privacy Settings
```ts
const privacySettings = await sock.fetchPrivacySettings(true)
console.log('privacy settings: ' + privacySettings)
```
### Get BlockList
```ts
const response = await sock.fetchBlocklist()
console.log(response)
```
### Update LastSeen Privacy
```ts
const value = 'all' // 'contacts' | 'contact_blacklist' | 'none'
await sock.updateLastSeenPrivacy(value)
```
### Update Online Privacy
```ts
const value = 'all' // 'match_last_seen'
await sock.updateOnlinePrivacy(value)
```
### Update Profile Picture Privacy
```ts
const value = 'all' // 'contacts' | 'contact_blacklist' | 'none'
await sock.updateProfilePicturePrivacy(value)
```
### Update Status Privacy
```ts
const value = 'all' // 'contacts' | 'contact_blacklist' | 'none'
await sock.updateStatusPrivacy(value)
```
### Update Read Receipts Privacy
```ts
const value = 'all' // 'none'
await sock.updateReadReceiptsPrivacy(value)
```
### Update Groups Add Privacy
```ts
const value = 'all' // 'contacts' | 'contact_blacklist'
await sock.updateGroupsAddPrivacy(value)
```
### Update Default Disappearing Mode

- Like [this](#disappearing-messages), ephemeral can be:

| Time  | Seconds        |
|-------|----------------|
| Remove | 0          |
| 24h    | 86.400     |
| 7d     | 604.800    |
| 90d    | 7.776.000  |

```ts
const ephemeral = 86400
await sock.updateDefaultDisappearingMode(ephemeral)
```

## Broadcast Lists & Stories

### Send Broadcast & Stories
- Messages can be sent to broadcasts & stories. You need to add the following message options in sendMessage, like this:
```ts
await sock.sendMessage(
    jid,
    {
        image: {
            url: url
        },
        caption: caption
    },
    {
        backgroundColor: backgroundColor,
        font: font,
        statusJidList: statusJidList,
        broadcast: true
    }
)
```
- Message body can be a `extendedTextMessage` or `imageMessage` or `videoMessage` or `voiceMessage`, see the [AnyRegularMessageContent type alias](https://baileys.wiki/docs/api/type-aliases/AnyRegularMessageContent/)
- You can add `backgroundColor` and other options in the message options, see the [MiscMessageGenerationOptions type alias](https://baileys.wiki/docs/api/type-aliases/MiscMessageGenerationOptions/)
- `broadcast: true` enables broadcast mode
- `statusJidList`: a list of people that you can get which you need to provide, which are the people who will get this status message.

- You can send messages to broadcast lists the same way you send messages to groups & individual chats.
- Right now, WA Web does not support creating broadcast lists, but you can still delete them.
- Broadcast IDs are in the format `12345678@broadcast`
### Query a Broadcast List's Recipients & Name
```ts
const bList = await sock.getBroadcastListInfo('1234@broadcast')
console.log (`list name: ${bList.name}, recps: ${bList.recipients}`)
```

## Writing Custom Functionality
Baileys is written with custom functionality in mind. Instead of forking the project & re-writing the internals, you can simply write your own extensions.

### Enabling Debug Level in Baileys Logs
First, enable the logging of unhandled messages from WhatsApp by setting:
```ts
const sock = makeWASocket({
    logger: P({ level: 'debug' }),
})
```
This will enable you to see all sorts of messages WhatsApp sends in the console.

### How Whatsapp Communicate With Us

> [!TIP]
> If you want to learn whatsapp protocol, we recommend to study about Libsignal Protocol and Noise Protocol

- **Example:** Functionality to track the battery percentage of your phone. You enable logging and you'll see a message about your battery pop up in the console:
    ```
    {
        "level": 10,
        "fromMe": false,
        "frame": {
            "tag": "ib",
            "attrs": {
                "from": "@s.whatsapp.net"
            },
            "content": [
                {
                    "tag": "edge_routing",
                    "attrs": {},
                    "content": [
                        {
                            "tag": "routing_info",
                            "attrs": {},
                            "content": {
                                "type": "Buffer",
                                "data": [8,2,8,5]
                            }
                        }
                    ]
                }
            ]
        },
        "msg":"communication"
    }
    ```

The `'frame'` is what the message received is, it has three components:
- `tag` -- what this frame is about (eg. message will have 'message')
- `attrs` -- a string key-value pair with some metadata (contains ID of the message usually)
- `content` -- the actual data (eg. a message node will have the actual message content in it)
- read more about this format [here](/src/WABinary/readme.md)

### Register a Callback for Websocket Events

> [!TIP]
> Recommended to see `onMessageReceived` function in `socket.ts` file to understand how websockets events are fired

```ts
// for any message with tag 'edge_routing'
sock.ws.on('CB:edge_routing', (node: BinaryNode) => { })

// for any message with tag 'edge_routing' and id attribute = abcd
sock.ws.on('CB:edge_routing,id:abcd', (node: BinaryNode) => { })

// for any message with tag 'edge_routing', id attribute = abcd & first content node routing_info
sock.ws.on('CB:edge_routing,id:abcd,routing_info', (node: BinaryNode) => { })
```

# License
Copyright (c) 2025 Rajeh Taher/WhiskeySockets

Licensed under the MIT License:
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Thus, the maintainers of the project can't be held liable for any potential misuse of this project.
