/**
 * NIXCODE - Advanced WhatsApp Interactive Message Builder
 * Built for creating buttons, carousels, native flows,
 * and AI rich response payloads using Baileys with
 * fluent chaining, flexible payload customization,
 * and scalable architecture for modern bot development.
 *
 * Created by Nixel
 * wa.me/6282139672290
 *
 * Copyright (c) 2026 Nixel
 *
 * Permission is granted to use and modify this library
 * for personal or commercial projects.
 *
 * Reuploading, reselling, relicensing, or redistributing
 * this library as a standalone product is prohibited.
 *
 * Do not claim this project as your own original work.
 */

export const VERSION = '4.3';

import { generateWAMessageFromContent, prepareWAMessageMedia } from '../Utils/messages.js';
import crypto from 'crypto';
let _sharp = undefined;
let _sharpLoaded = false;
async function getSharp() {
	if (!_sharpLoaded) {
		_sharpLoaded = true;
		const mod = await import('sharp').catch(() => null);
		_sharp = mod?.default || null;
	}
	return _sharp;
}

function extractHyperlink(text) {
	let hyperlink = [],
		stack = [],
		result = '',
		last = 0,
		index = 1,
		entity = 0;
	for (let i = 0; i < text.length; i++) {
		if (text[i] == '[' && text[i - 1] != '\\') {
			stack.push(i);
		} else if (text[i] == ']' && text[i + 1] == '(') {
			let start = stack.pop();
			if (start == null) continue;
			let end = i + 2,
				depth = 1;
			while (end < text.length && depth) {
				if (text[end] == '(' && text[end - 1] != '\\') depth++;
				else if (text[end] == ')' && text[end - 1] != '\\') depth--;
				end++;
			}
			if (depth) continue;
			let txt = text.slice(start + 1, i).trim(),
				url = text.slice(i + 2, end - 1),
				reference_id = txt ? 0 : index++,
				key = `IE_${entity++}`,
				tag = `{{${key}}}${txt || 'Nixel'}{{/${key}}}`;
			result += text.slice(last, start) + tag;
			last = end;
			hyperlink.push({
				reference_id,
				key,
				text: txt,
				url,
			});
			i = end - 1;
		}
	}
	result += text.slice(last);
	return {
		text: result,
		hyperlink,
	};
}

async function fetchBuffer(url, options = {}, config = {}) {
	try {
		let response = await fetch(url, options);
		if (!response.ok) throw Error(`HTTP ${response.status}`);
		return Buffer.from(await response.arrayBuffer());
	} catch (error) {
		if (config.silent) return Buffer.alloc(0);
		throw error;
	}
}

class BaseBuilder {
	constructor() {
		this._title = '';
		this._subtitle = '';
		this._body = '';
		this._footer = '';
		this._contextInfo = {};
		this._extraPayload = {};
	}

	setTitle(title) {
		this._title = title;
		return this;
	}

	setSubtitle(subtitle) {
		this._subtitle = subtitle;
		return this;
	}

	setBody(body) {
		this._body = body;
		return this;
	}

	setFooter(footer) {
		this._footer = footer;
		return this;
	}

	setContextInfo(obj) {
		if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
			throw new TypeError('ContextInfo must be a plain object');
		}

		this._contextInfo = obj;
		return this;
	}

	addPayload(obj) {
		if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
			throw new TypeError('Payload must be a plain object');
		}

		Object.assign(this._extraPayload, obj);

		return this;
	}
}

export class Button extends BaseBuilder {
	#client;

	constructor(client) {
		super();
		if (!client) {
			throw new Error('Socket is required');
		}
		this.#client = client;

		this._buttons = [];
		this._data;
		this._currentSelectionIndex = -1;
		this._currentSectionIndex = -1;
		this._params = {};
	}

	setVideo(path, options = {}) {
		if (!path) throw new Error('Url or buffer needed');
		Buffer.isBuffer(path) ? (this._data = { video: path, ...options }) : (this._data = { video: { url: path }, ...options });
		return this;
	}

	setImage(path, options = {}) {
		if (!path) throw new Error('Url or buffer needed');
		Buffer.isBuffer(path) ? (this._data = { image: path, ...options }) : (this._data = { image: { url: path }, ...options });
		return this;
	}

	setDocument(path, options = {}) {
		if (!path) throw new Error('Url or buffer needed');
		Buffer.isBuffer(path) ? (this._data = { document: path, ...options }) : (this._data = { document: { url: path }, ...options });
		return this;
	}

	setMedia(obj) {
		if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
			throw new TypeError('Media must be a plain object');
		}

		this._data = obj;
		return this;
	}

	clearButtons() {
		this._buttons = [];
		return this;
	}

	setParams(obj) {
		this._params = obj;
		return this;
	}

	addButton(name, params) {
		this._buttons.push({
			name,
			buttonParamsJson: typeof params === 'string' ? params : JSON.stringify(params),
		});

		return this;
	}

	makeRow(header = '', title = '', description = '', id = crypto.randomUUID()) {
		if (this._currentSelectionIndex === -1 || this._currentSectionIndex === -1) {
			throw new Error('You need to create a selection and a section first');
		}
		const buttonParams = JSON.parse(this._buttons[this._currentSelectionIndex].buttonParamsJson);
		buttonParams.sections[this._currentSectionIndex].rows.push({ header, title, description, id });
		this._buttons[this._currentSelectionIndex].buttonParamsJson = JSON.stringify(buttonParams);
		return this;
	}

	makeSections(title = '', highlight_label = '') {
		if (this._currentSelectionIndex === -1) {
			throw new Error('You need to create a selection first');
		}
		const buttonParams = JSON.parse(this._buttons[this._currentSelectionIndex].buttonParamsJson);
		buttonParams.sections.push({ title, highlight_label, rows: [] });
		this._currentSectionIndex = buttonParams.sections.length - 1;
		this._buttons[this._currentSelectionIndex].buttonParamsJson = JSON.stringify(buttonParams);
		return this;
	}

	addSelection(title) {
		this._buttons.push({ name: 'single_select', buttonParamsJson: JSON.stringify({ title, sections: [] }) });
		this._currentSelectionIndex = this._buttons.length - 1;
		this._currentSectionIndex = -1;
		return this;
	}

	addReply(display_text = '', id = crypto.randomUUID()) {
		this._buttons.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text, id }) });
		return this;
	}

	addCall(display_text = '', id = crypto.randomUUID()) {
		this._buttons.push({
			name: 'cta_call',
			buttonParamsJson: JSON.stringify({
				display_text,
				id,
			}),
		});
		return this;
	}

	addReminder(display_text = '', id = crypto.randomUUID()) {
		this._buttons.push({
			name: 'cta_reminder',
			buttonParamsJson: JSON.stringify({
				display_text,
				id,
			}),
		});
		return this;
	}

	addCancelReminder(display_text = '', id = crypto.randomUUID()) {
		this._buttons.push({
			name: 'cta_cancel_reminder',
			buttonParamsJson: JSON.stringify({
				display_text,
				id,
			}),
		});
		return this;
	}

	addAddress(display_text = '', id = crypto.randomUUID()) {
		this._buttons.push({
			name: 'address_message',
			buttonParamsJson: JSON.stringify({
				display_text,
				id,
			}),
		});
		return this;
	}

	addLocation() {
		this._buttons.push({
			name: 'send_location',
			buttonParamsJson: '',
		});
		return this;
	}

	addUrl(display_text = '', url = '', webview_interaction = false) {
		this._buttons.push({
			name: 'cta_url',
			buttonParamsJson: JSON.stringify({
				display_text,
				url,
				webview_interaction,
			}),
		});
		return this;
	}

	addCopy(display_text = '', copy_code = '', id = crypto.randomUUID()) {
		this._buttons.push({
			name: 'cta_copy',
			buttonParamsJson: JSON.stringify({
				display_text,
				copy_code,
				id,
			}),
		});
		return this;
	}

	static paramsList = {
		limited_time_offer: {
			text: 'string',
			url: 'string',
			copy_code: 'string',
			expiration_time: 'number',
		},
		bottom_sheet: {
			in_thread_buttons_limit: 'number',
			divider_indices: ['number'],
			list_title: 'string',
			button_title: 'string',
		},
		tap_target_configuration: {
			title: 'string',
			description: 'string',
			canonical_url: 'string',
			domain: 'string',
			buttonIndex: 'number',
		},
	};

	async toCard() {
		return {
			body: {
				text: this._body,
			},
			footer: {
				text: this._footer,
			},
			header: {
				title: this._title,
				subtitle: this._subtitle,
				hasMediaAttachment: !!this._data,
				...(this._data ? await prepareWAMessageMedia(this._data, { upload: this.#client.waUploadToServer }) : {}),
			},
			nativeFlowMessage: {
				messageParamsJson: JSON.stringify(this._params),
				buttons: this._buttons,
			},
		};
	}

	async build(jid, { ...options } = {}) {
		const message = await this.toCard();

		return generateWAMessageFromContent(
			jid,
			{
				...this._extraPayload,
				interactiveMessage: {
					...message,
					contextInfo: this._contextInfo,
				},
			},
			{ ...options }
		);
	}

	async send(jid, { ...options } = {}) {
		const msg = await this.build(jid, options);

		await this.#client.relayMessage(msg.key.remoteJid, msg.message, {
			messageId: msg.key.id,
			additionalNodes: [
				{
					tag: 'biz',
					attrs: {},
					content: [
						{
							tag: 'interactive',
							attrs: { type: 'native_flow', v: '1' },
							content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
						},
					],
				},
			],
			...options,
		});
		return msg;
	}
}

export class ButtonV2 extends BaseBuilder {
	#client;

	constructor(client) {
		super();
		if (!client) {
			throw new Error('Socket is required');
		}

		this.#client = client;
		this._image;
		this._data;
		this._buttons = [];
	}

	addButton(displayText = '', buttonId = crypto.randomUUID()) {
		this._buttons.push({ buttonId, buttonText: { displayText }, type: 1 });
		return this;
	}

	addRawButton(obj) {
		if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
			throw new TypeError('Buttons must be a plain object');
		}

		this._buttons.push(obj);
		return this;
	}

	setThumbnail(path) {
		if (!path) throw new Error('Url or buffer needed');
		this._image = path;
		return this;
	}

	setMedia(obj) {
		if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
			throw new TypeError('Media must be a plain object');
		}

		this._data = obj;
		return this;
	}

	async build(jid, { ...options } = {}) {
		const sharp = await getSharp();
		let _thumbnail = this._image && sharp
			? await sharp(Buffer.isBuffer(this._image) ? this._image : await fetchBuffer(this._image, {}, { silent: true }))
					.resize(300, 300)
					.png()
					.toBuffer()
			: null;
		const msg = generateWAMessageFromContent(
			jid,
			{
				...this._extraPayload,
				buttonsMessage: {
					contentText: this._body,
					footerText: this._footer,
					...(this._data
						? this._data
						: {
								headerType: 6,
								locationMessage: {
									jpegThumbnail: _thumbnail,
								},
							}),
					viewOnce: true,
					contextInfo: this._contextInfo,
					buttons: [...this._buttons],
				},
			},
			{ ...options }
		);
		return msg;
	}

	async send(jid, { ...options } = {}) {
		const msg = await this.build(jid, options);

		await this.#client.relayMessage(msg.key.remoteJid, msg.message, {
			messageId: msg.key.id,
			additionalNodes: [
				{
					tag: 'biz',
					attrs: {},
					content: [
						{
							tag: 'interactive',
							attrs: { type: 'native_flow', v: '1' },
							content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
						},
					],
				},
			],
			...options,
		});
		return msg;
	}
}

export class Carousel extends BaseBuilder {
	#client;
	constructor(client) {
		super();
		if (!client) {
			throw new Error('Socket is required');
		}

		this.#client = client;
		this._cards = [];
	}

	addCard(card) {
		if (Array.isArray(card)) {
			this._cards.push(...card);
		} else {
			this._cards.push(card);
		}

		return this;
	}

	build(jid, { ...options } = {}) {
		return generateWAMessageFromContent(
			jid,
			{
				...this._extraPayload,
				interactiveMessage: {
					header: {
						hasMediaAttachment: false,
					},
					body: { text: this._body },
					footer: { text: this._footer },
					contextInfo: this._contextInfo,
					carouselMessage: {
						cards: this._cards,
					},
				},
			},
			{ ...options }
		);
	}

	async send(jid, { ...options } = {}) {
		const msg = this.build(jid, options);

		await this.#client.relayMessage(msg.key.remoteJid, msg.message, {
			messageId: msg.key.id,
			additionalNodes: [
				{
					tag: 'biz',
					attrs: {},
					content: [
						{
							tag: 'interactive',
							attrs: { type: 'native_flow', v: '1' },
							content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
						},
					],
				},
			],
			...options,
		});
		return msg;
	}
}

export class AIRich {
	#client;
	constructor(client) {
		if (!client) {
			throw new Error('Socket is required');
		}

		this.#client = client;
		this._submessages = [];
		this._sections = [];
		this._richResponseSources = [];
	}

	addText(text, { hyperlink = true } = {}) {
		const extractedHyperlink = hyperlink
			? extractHyperlink(text)
			: {
					text,
					hyperlink: [],
				};

		this._submessages.push({
			messageType: 2,
			messageText: hyperlink ? extractedHyperlink.text : text,
		});

		if (extractedHyperlink.hyperlink.length && hyperlink) {
			this._sections.push({
				view_model: {
					primitive: {
						text: extractedHyperlink.text,
						inline_entities: extractedHyperlink.hyperlink.map(({ reference_id, key, text, url }) => ({
							key,
							metadata: text?.trim()
								? {
										display_name: text,
										is_trusted: true,
										url,
										__typename: 'GenAIInlineLinkItem',
									}
								: {
										reference_id,
										reference_url: url,
										reference_title: url,
										reference_display_name: url,
										sources: [],
										__typename: 'GenAISearchCitationItem',
									},
						})),
						__typename: 'GenAIMarkdownTextUXPrimitive',
					},
					__typename: 'GenAISingleLayoutViewModel',
				},
			});
		} else {
			this._sections.push({
				view_model: {
					primitive: {
						text,
						__typename: 'GenAIMarkdownTextUXPrimitive',
					},

					__typename: 'GenAISingleLayoutViewModel',
				},
			});
		}

		return this;
	}

	addCode(language, code) {
		const meta = AIRich.tokenizer(code, language);

		this._submessages.push({
			messageType: 5,
			codeMetadata: {
				codeLanguage: language,
				codeBlocks: meta.codeBlock,
			},
		});

		this._sections.push({
			view_model: {
				primitive: {
					language,
					code_blocks: meta.unified_codeBlock,
					__typename: 'GenAICodeUXPrimitive',
				},
				__typename: 'GenAISingleLayoutViewModel',
			},
		});

		return this;
	}

	addTable(table) {
		const meta = AIRich.toTableMetadata(table);

		this._submessages.push({
			messageType: 4,
			tableMetadata: {
				title: meta.title,
				rows: meta.rows,
			},
		});

		this._sections.push({
			view_model: {
				primitive: {
					rows: meta.unified_rows,
					__typename: 'GenATableUXPrimitive',
				},
				__typename: 'GenAISingleLayoutViewModel',
			},
		});

		return this;
	}

	addSource(sources = []) {
		const source = sources.map(([profile_url, url, text]) => ({
			source_type: 'THIRD_PARTY',
			source_display_name: text,
			source_subtitle: 'AI',
			source_url: url,
			favicon: {
				url: profile_url,
				mime_type: 'image/jpeg',
				width: 16,
				height: 16,
			},
		}));

		this._sections.push({
			view_model: {
				primitive: {
					sources: source,
					__typename: 'GenAISearchResultPrimitive',
				},
				__typename: 'GenAISingleLayoutViewModel',
			},
		});

		return this;
	}

	addReels(reelsItems = []) {
		this._submessages.push({
			messageType: 9,
			contentItemsMetadata: {
				contentType: 1,
				itemsMetadata: reelsItems.map((item) => ({
					reelItem: {
						title: item.title,
						profileIconUrl: item.profileIconUrl,
						thumbnailUrl: item.thumbnailUrl,
						videoUrl: item.videoUrl,
					},
				})),
			},
		});

		reelsItems.forEach((item, idx) => {
			this._richResponseSources.push({
				provider: 'UNKNOWN',
				thumbnailCDNURL: item.thumbnailUrl,
				sourceProviderURL: item.videoUrl,
				sourceQuery: '',
				faviconCDNURL: item.profileIconUrl,
				citationNumber: idx + 1,
				sourceTitle: item.title,
			});
		});

		this._sections.push({
			view_model: {
				primitives: reelsItems.map((item) => ({
					reels_url: item.videoUrl,
					thumbnail_url: item.thumbnailUrl,
					creator: item.title,
					avatar_url: item.profileIconUrl,
					reels_title: item.reels_title,
					likes_count: 0,
					shares_count: 0,
					view_count: 0,
					reel_source: 'IG',
					is_verified: item.is_verified,
					__typename: 'GenAIReelPrimitive',
				})),
				__typename: 'GenAIHScrollLayoutViewModel',
			},
		});

		return this;
	}

	addImage(imageUrl) {
		const imageUrls = Array.isArray(imageUrl)
			? imageUrl.map((url) => ({
					imagePreviewUrl: url,
					imageHighResUrl: url,
					sourceUrl: 'https://google.com',
				}))
			: [
					{
						imagePreviewUrl: imageUrl,
						imageHighResUrl: imageUrl,
						sourceUrl: 'https://google.com',
					},
				];

		this._submessages.push({
			messageType: 1,
			gridImageMetadata: {
				gridImageUrl: {
					imagePreviewUrl: Array.isArray(imageUrl) ? imageUrl[0] : imageUrl,
				},
				imageUrls,
			},
		});

		imageUrls.forEach(({ imagePreviewUrl }) => {
			this._sections.push({
				view_model: {
					primitive: {
						media: {
							url: imagePreviewUrl,
							mime_type: 'image/jpeg',
						},
						imagine_type: 3,
						status: {
							status: 'READY',
						},
						__typename: 'GenAIImaginePrimitive',
					},
					__typename: 'GenAISingleLayoutViewModel',
				},
			});
		});

		return this;
	}

	build({ forwarded = true, includesUnifiedResponse = true, ...options } = {}) {
		const contextInfo = forwarded
			? {
					forwardingScore: 1,
					isForwarded: true,
					forwardedAiBotMessageInfo: { botJid: '0@bot' },
					forwardOrigin: 4,
				}
			: {};

		return {
			messageContextInfo: {
				deviceListMetadata: {},
				deviceListMetadataVersion: 2,
				botMetadata: {
					pluginMetadata: {},
					richResponseSourcesMetadata: { sources: this._richResponseSources },
				},
			},
			botForwardedMessage: {
				message: {
					richResponseMessage: {
						messageType: 1,
						submessages: this._submessages,
						unifiedResponse: {
							data: includesUnifiedResponse ? Buffer.from(JSON.stringify({ response_id: crypto.randomUUID(), sections: this._sections })).toString('base64') : '',
						},
						contextInfo,
					},
				},
			},
		};
	}

	async send(jid, { forwarded, includesUnifiedResponse, ...options } = {}) {
		const msg = this.build({ forwarded, includesUnifiedResponse, ...options });

		return await this.#client.relayMessage(jid, msg, { ...options });
	}

	static tokenizer(code, lang = 'javascript') {
		const keywordsMap = {
			javascript: new Set([
				'break',
				'case',
				'catch',
				'continue',
				'debugger',
				'delete',
				'do',
				'else',
				'finally',
				'for',
				'function',
				'if',
				'in',
				'instanceof',
				'new',
				'return',
				'switch',
				'this',
				'throw',
				'try',
				'typeof',
				'var',
				'void',
				'while',
				'with',
				'true',
				'false',
				'null',
				'undefined',
				'class',
				'const',
				'let',
				'super',
				'extends',
				'export',
				'import',
				'yield',
				'static',
				'constructor',
				'async',
				'await',
				'get',
				'set',
			]),
		};

		const TYPE_MAP = {
			0: 'DEFAULT',
			1: 'KEYWORD',
			2: 'METHOD',
			3: 'STR',
			4: 'NUMBER',
			5: 'COMMENT',
		};

		const keywords = keywordsMap[lang] || new Set();
		const tokens = [];

		let i = 0;

		const push = (content, type) => {
			if (!content) return;
			const last = tokens[tokens.length - 1];
			if (last && last.highlightType === type) last.codeContent += content;
			else tokens.push({ codeContent: content, highlightType: type });
		};

		while (i < code.length) {
			const c = code[i];

			if (/\s/.test(c)) {
				let s = i;
				while (i < code.length && /\s/.test(code[i])) i++;
				push(code.slice(s, i), 0);
				continue;
			}

			if (c === '/' && code[i + 1] === '/') {
				let s = i;
				i += 2;
				while (i < code.length && code[i] !== '\n') i++;
				push(code.slice(s, i), 5);
				continue;
			}

			if (c === '"' || c === "'" || c === '`') {
				let s = i;
				const q = c;
				i++;
				while (i < code.length) {
					if (code[i] === '\\' && i + 1 < code.length) i += 2;
					else if (code[i] === q) {
						i++;
						break;
					} else i++;
				}
				push(code.slice(s, i), 3);
				continue;
			}

			if (/[0-9]/.test(c)) {
				let s = i;
				while (i < code.length && /[0-9.]/.test(code[i])) i++;
				push(code.slice(s, i), 4);
				continue;
			}

			if (/[a-zA-Z_$]/.test(c)) {
				let s = i;
				while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
				const word = code.slice(s, i);

				let type = 0;
				if (keywords.has(word)) type = 1;
				else {
					let j = i;
					while (j < code.length && /\s/.test(code[j])) j++;
					if (code[j] === '(') type = 2;
				}

				push(word, type);
				continue;
			}

			push(c, 0);
			i++;
		}

		return {
			codeBlock: tokens,
			unified_codeBlock: tokens.map((t) => ({
				content: t.codeContent,
				type: TYPE_MAP[t.highlightType],
			})),
		};
	}

	static toTableMetadata(arr) {
		if (!Array.isArray(arr) || arr.length < 2) throw new Error('Format tabel ngawur');

		const [header, ...rows] = arr;

		const maxLen = Math.max(header.length, ...rows.map((r) => r.length));

		const normalize = (r) => [...r, ...Array(maxLen - r.length).fill('')];

		const unified_rows = [
			{
				is_header: true,
				cells: normalize(header),
			},
			...rows.map((r) => ({
				is_header: false,
				cells: normalize(r),
			})),
		];

		const rowsMeta = unified_rows.map((r) => ({
			items: r.cells,
			...(r.is_header ? { isHeading: true } : {}),
		}));

		return {
			title: '',
			rows: rowsMeta,
			unified_rows,
		};
	}
}
