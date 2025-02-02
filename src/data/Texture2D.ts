import { Texture } from './Texture';
import { TextureLoader } from '@/util/loaders/TextureLoader';
import { Engine } from '@/engine/Engine';

export class Texture2D extends Texture {
    static get DEFAULT() {
        return new Texture2D(Engine.device);
    } 

    static from(url: string) {
        const texture = new Texture2D(Engine.device);
        TextureLoader.load(url).then(res => {
            texture.setTexture(res); 
        }).catch(err => {
            console.error(err, url);
        });
        return texture;
    }

}