import { Document, Node, Animation, Primitive } from '@gltf-transform/core';
import { WebIO } from '@gltf-transform/core';

export class NewLoader {

    static async load(url: string): Promise<Document> {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const io = new WebIO();
        const document = await io.readBinary(new Uint8Array(arrayBuffer));
        const root = document.getRoot();
          const animations = root.listAnimations();
          const animation = animations[0];
        return document;
    }

}
