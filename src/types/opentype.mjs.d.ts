declare module 'opentype.js/dist/opentype.mjs' {
    import type { Font } from 'opentype.js';

    export function parse(buffer: ArrayBuffer): Font;
}
