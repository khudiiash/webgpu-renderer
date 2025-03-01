import { Texture } from "./Texture";
import { TextureLoader } from "@/util/loaders/TextureLoader";

export class Texture2D extends Texture {
    static get DEFAULT() {
        return new Texture2D();
    }

    static from(url: string) {
        const texture = new Texture2D();
        TextureLoader.load(url)
            .then((res) => {
                texture.setTexture(res);
            })
            .catch((err) => {
                console.error(err, url);
            });
        return texture;
    }
}
