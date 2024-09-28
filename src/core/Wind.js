import { Events } from './Events';
import { Vector3 } from '../math/Vector3';

class Wind extends Events {
    static struct = {
        speed: 'f32',
        strength: 'f32',
        noise: 'f32',
        frequency: 'f32',
        direction: 'vec3f',
    }

    constructor(params) {
        super();
        params = {
            speed: 0.4,
            strength: 10,
            noise: 0,
            frequency: 1,
            direction: new Vector3(0.7, 0, 0.7),

        }
        this._speed = params.speed;
        this._strength =  params.strength;
        this._noise = params.noise; 
        this._frequency = params.frequency;
        this._direction = params.direction;

        this._data = new Float32Array([
            this._speed,
            this._strength,
            this._noise,
            this._frequency,
            this._direction.x,
            this._direction.y,
            this._direction.z,
        ]);
    }
    
    get data() {
        return this._data;
    }
    
    get direction() {
        return this._direction;
    }
    
    get speed() {
        return this._speed;
    }
    
    get strength() {
        return this._strength;
    }
    
    get noise() {
        return this._noise;
    }
    
    get frequency() {
        return this._frequency;
    }
}

export { Wind };