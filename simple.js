/**
 * Backward-compatible re-export.
 * The builder classes have moved into lib/Builder/index.js
 * and are exported from the main baileys entry point.
 *
 * Usage:
 *   import { Button, ButtonV2, Carousel, AIRich } from '@BAWORBAWORID/baileys'
 */
export { VERSION, Button, ButtonV2, Carousel, AIRich } from './lib/Builder/index.js';
