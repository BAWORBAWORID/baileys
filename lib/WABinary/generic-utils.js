import { Boom } from '@hapi/boom';
import { proto } from '../../WAProto/index.js';
import {} from './types.js';
// some extra useful utilities
const indexCache = new WeakMap();
export const getBinaryNodeChildren = (node, childTag) => {
    if (!node || !Array.isArray(node.content))
        return [];
    let index = indexCache.get(node);
    // Build the index once per node
    if (!index) {
        index = new Map();
        for (const child of node.content) {
            let arr = index.get(child.tag);
            if (!arr)
                index.set(child.tag, (arr = []));
            arr.push(child);
        }
        indexCache.set(node, index);
    }
    // Return first matching child
    return index.get(childTag) || [];
};
export const getBinaryNodeChild = (node, childTag) => {
    return getBinaryNodeChildren(node, childTag)[0];
};
export const getAllBinaryNodeChildren = ({ content }) => {
    if (Array.isArray(content)) {
        return content;
    }
    return [];
};
export const getBinaryNodeChildBuffer = (node, childTag) => {
    const child = getBinaryNodeChild(node, childTag)?.content;
    if (Buffer.isBuffer(child) || child instanceof Uint8Array) {
        return child;
    }
};
export const getBinaryNodeChildString = (node, childTag) => {
    const child = getBinaryNodeChild(node, childTag)?.content;
    if (Buffer.isBuffer(child) || child instanceof Uint8Array) {
        return Buffer.from(child).toString('utf-8');
    }
    else if (typeof child === 'string') {
        return child;
    }
};
export const getBinaryNodeChildUInt = (node, childTag, length) => {
    const buff = getBinaryNodeChildBuffer(node, childTag);
    if (buff) {
        return bufferToUInt(buff, length);
    }
};
export const assertNodeErrorFree = (node) => {
    const errNode = getBinaryNodeChild(node, 'error');
    if (errNode) {
        throw new Boom(errNode.attrs.text || 'Unknown error', { data: +errNode.attrs.code });
    }
};
export const reduceBinaryNodeToDictionary = (node, tag) => {
    const nodes = getBinaryNodeChildren(node, tag);
    const dict = nodes.reduce((dict, { attrs }) => {
        if (typeof attrs.name === 'string') {
            dict[attrs.name] = attrs.value || attrs.config_value;
        }
        else {
            dict[attrs.config_code] = attrs.value || attrs.config_value;
        }
        return dict;
    }, {});
    return dict;
};
export const getBinaryNodeMessages = ({ content }) => {
    const msgs = [];
    if (Array.isArray(content)) {
        for (const item of content) {
            if (item.tag === 'message') {
                msgs.push(proto.WebMessageInfo.decode(item.content).toJSON());
            }
        }
    }
    return msgs;
};
function bufferToUInt(e, t) {
    let a = 0;
    for (let i = 0; i < t; i++) {
        a = 256 * a + e[i];
    }
    return a;
}
const tabs = (n) => '\t'.repeat(n);
export const getBinaryNodeFilter = (node) => {
    if (!Array.isArray(node))
        return false;
    return node.some(item => {
        var _a, _b, _c, _d, _e, _f;
        return ['native_flow'].includes((_d = (_c = (_b = (_a = item === null || item === void 0 ? void 0 : item.content) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.tag) ||
            ['interactive', 'buttons', 'list'].includes((_f = (_e = item === null || item === void 0 ? void 0 : item.content) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.tag) ||
            ['hsm', 'biz'].includes(item === null || item === void 0 ? void 0 : item.tag) ||
            (['bot'].includes(item === null || item === void 0 ? void 0 : item.tag) && (item === null || item === void 0 ? void 0 : item.attrs.biz_bot) === '1');
    });
};
export const getAdditionalNode = (name) => {
    if (name)
        name = name.toLowerCase();
    const PRIVACY_TS_OFFSET = 77980457;
    const ts = Math.floor(Date.now() / 1000) - PRIVACY_TS_OFFSET;
    const orderResponseName = {
        review_and_pay: 'order_details',
        review_order: 'order_status',
        payment_info: 'payment_info',
        payment_status: 'payment_status',
        payment_method: 'payment_method',
        pix: 'pix',
        pay: 'pay',
    };
    const flowName = {
        cta_catalog: 'cta_catalog',
        mpm: 'mpm',
        call_request: 'call_permission_request',
        view_catalog: 'automated_greeting_message_view_catalog',
        wa_pay_detail: 'wa_payment_transaction_details',
        send_location: 'send_location',
    };
    if (orderResponseName[name]) {
        return [{
                tag: 'biz',
                attrs: { native_flow_name: orderResponseName[name] },
                content: []
            }];
    }
    else if (flowName[name] || name === 'interactive' || name === 'buttons') {
        return [{
                tag: 'biz',
                attrs: {
                    actual_actors: '2',
                    host_storage: '2',
                    privacy_mode_ts: `${ts}`
                },
                content: [
                    {
                        tag: 'engagement',
                        attrs: {
                            customer_service_state: 'open',
                            conversation_state: 'open'
                        }
                    },
                    {
                        tag: 'interactive',
                        attrs: {
                            type: 'native_flow',
                            v: '1'
                        },
                        content: [{
                                tag: 'native_flow',
                                attrs: {
                                    v: '9',
                                    name: flowName[name] !== null && flowName[name] !== void 0 ? flowName[name] : 'mixed',
                                },
                                content: []
                            }]
                    }
                ]
            }];
    }
    else {
        return [{
                tag: 'biz',
                attrs: {
                    actual_actors: '2',
                    host_storage: '2',
                    privacy_mode_ts: `${ts}`
                },
                content: [{
                        tag: 'engagement',
                        attrs: {
                            customer_service_state: 'open',
                            conversation_state: 'open'
                        }
                    }]
            }];
    }
};

export function binaryNodeToString(node, i = 0) {
    if (!node) {
        return node;
    }
    if (typeof node === 'string') {
        return tabs(i) + node;
    }
    if (node instanceof Uint8Array) {
        return tabs(i) + Buffer.from(node).toString('hex');
    }
    if (Array.isArray(node)) {
        return node.map(x => tabs(i + 1) + binaryNodeToString(x, i + 1)).join('\n');
    }
    const children = binaryNodeToString(node.content, i + 1);
    const tag = `<${node.tag} ${Object.entries(node.attrs || {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}='${v}'`)
        .join(' ')}`;
    const content = children ? `>\n${children}\n${tabs(i)}</${node.tag}>` : '/>';
    return tag + content;
}
//# sourceMappingURL=generic-utils.js.map