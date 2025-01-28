import { Component } from '../core/Component';

export class ParticleComponent extends Component {
    count: number = 1;
    properties: any = {};
    initialized: boolean = false;

    async deserialize(data: any) {
        this.count = data.count || 1;
        this.properties = data.properties || {};
    }
}