import { Texture } from './Texture';
import { TextureLoader } from '@/util/loaders/TextureLoader';
import { Engine } from '@/engine/Engine';

export class Texture2D extends Texture {
    private static default: Texture2D;

    static get DEFAULT() {
        if (!Texture2D.default) {
            Texture2D.default = new Texture2D(Engine.device);
        } 

        return Texture2D.default;
    } 

    static from(url: string) {
        const texture = new Texture2D(Engine.device);
        TextureLoader.load(url).then(res => {
            texture.setTexture(res); 
        });
        return texture;
    }

}