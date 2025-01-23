import { Texture } from './Texture';
import { TextureLoader } from '@/util/loaders/TextureLoader';
import { Engine } from '@/engine/Engine';

export class Texture2D extends Texture {
    private static default: Texture2D;

    static get DEFAULT() {
        return new Texture2D(Engine.device);
    } 

    static from(url: string) {
        const texture = new Texture2D(Engine.device);
        const resolvePath = (url: string) => {
            if (url.startsWith('http')) return url;
            return `${window.location.origin}/${url}`;
        }
        const path = resolvePath(url); 
        TextureLoader.load(path).then(res => {
            texture.setTexture(res); 
        }).catch(err => {
            console.error(err, url);
        });
        return texture;
    }

}