import { Bone } from "./Bone";

const regex = /^(?<boneName>.*?)\.(?<property>translation|rotation|scale)?$/;

class AnimationMixer {
    constructor(root) {
        this.root = root;
        console.log('root', root);
        this.animations = new Map();
        this.activeAnimations = new Set();
    }

    addAnimation(clip) {
        this.animations.set(clip.name, clip);
    }

    play(name, options = {}) {
        const clip = this.animations.get(name);
        if (!clip) {
            console.warn(`Animation "${name}" not found`);
            return;
        }

        const animation = {
            clip,
            time: 0,
            timeScale: options.timeScale || 1,
            loop: options.loop !== undefined ? options.loop : true,
        };

        this.activeAnimations.add(animation);
    }

    stop(name) {
        for (const animation of this.activeAnimations) {
            if (animation.clip.name === name) {
                this.activeAnimations.delete(animation);
                break;
            }
        }
    }

    update(deltaTime) {
        for (const animation of this.activeAnimations) {
            animation.time += deltaTime * animation.timeScale;

            if (animation.time > animation.clip.duration) {
                if (animation.loop) {
                    animation.time %= animation.clip.duration;
                } else {
                    animation.time = animation.clip.duration;
                    this.activeAnimations.delete(animation);
                }
            }

            this.applyAnimation(animation);
        }
    }

    applyAnimation(animation) {
        for (const track of animation.clip.tracks) {
            const [,nodeName, property] = track.name.match(regex);
            const node = this.root.findByName(nodeName);

            if (node) {
                const value = track.evaluate(animation.time);
                switch (property) {
                    case 'translation':
                        if (node.position.equalsArray(value)) {
                            continue;
                        }
                        node.position.fromArray(value);
                        break;
                    case 'rotation':
                        if (node.quaternion.equalsArray(value)) {
                            continue;
                        }
                        node.quaternion.fromArray(value);
                        break;
                    case 'scale':
                        if (node.scale.equalsArray(value)) {
                            continue;
                        }
                        node.scale.fromArray(value);
                        break;
                }
            } 
}
    }

}

export { AnimationMixer };