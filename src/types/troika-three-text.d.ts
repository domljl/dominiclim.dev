declare module 'troika-three-text' {
    import type * as THREE from 'three/src/Three.js';

    export class Text extends THREE.Mesh {
        material: THREE.Material | THREE.Material[];
        text: string;
        font?: string;
        fontSize: number;
        anchorX: 'left' | 'center' | 'right' | number;
        anchorY: 'top' | 'top-baseline' | 'middle' | 'bottom' | number;
        color: THREE.ColorRepresentation;
        fillOpacity: number;
        strokeWidth: number;
        strokeColor: THREE.ColorRepresentation;
        strokeOpacity: number;
        textRenderInfo?: {
            blockBounds: [number, number, number, number];
        };
        sync(callback?: () => void): void;
        dispose(): void;
    }
}
