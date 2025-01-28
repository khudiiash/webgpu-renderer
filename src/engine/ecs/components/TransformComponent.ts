import { Component } from '../core/Component';
import { Vector3 } from '@/math/Vector3';

export class TransformComponent extends Component {
    position: Vector3 = new Vector3();
    rotation: Vector3 = new Vector3();
    scale: Vector3 = new Vector3(1, 1, 1);
    instanceCount: number = 1;
    initialized: boolean = false;
    private instancePositions?: Float32Array;
    private instanceRotations?: Float32Array;
    private instanceScales?: Float32Array;

    async deserialize(data: any) {
        if (data.position) {
            this.position.setXYZ(data.position.x || 0, data.position.y || 0, data.position.z || 0);
        }
        if (data.rotation) {
            this.rotation.setXYZ(data.rotation.x || 0, data.rotation.y || 0, data.rotation.z || 0);
        }
        if (data.scale) {
            this.scale.setXYZ(data.scale.x || 1, data.scale.y || 1, data.scale.z || 1);
        }
        if (data.instanceCount) {
            this.instanceCount = data.instanceCount;
        }
    }

    setPositions(positions: number[]) {
        this.instancePositions = new Float32Array(positions);
    }

    setRotations(rotations: number[]) {
        this.instanceRotations = new Float32Array(rotations);
    }

    setScales(scales: number[]) {
        this.instanceScales = new Float32Array(scales);
    }

    translate(translations: number[]) {
        if (this.instancePositions) {
            for (let i = 0; i < translations.length; i++) {
                this.instancePositions[i] += translations[i];
            }
        }
    }

    getInstanceData() {
        return {
            positions: this.instancePositions,
            rotations: this.instanceRotations,
            scales: this.instanceScales
        };
    }
}