import { Quaternion } from '../math/Quaternion.js';
import { Vector3 } from '../math/Vector3.js';

export class AnimationClip {
    constructor(name, tracks) {
        this.name = name;
        this.tracks = tracks;
        this.duration = this.calculateDuration();
    }

    calculateDuration() {
        let duration = 0;
        for (const track of this.tracks) {
            const lastKeyframeTime = track.times[track.times.length - 1];
            duration = Math.max(duration, lastKeyframeTime);
        }
        return duration;
    }
}

export class KeyframeTrack {
    constructor(name, times, values, interpolation = 'LINEAR') {
        this.name = name;
        this.times = times;
        this.values = values;
        this.interpolation = interpolation;
    }

    evaluate(time) {
        const times = this.times;
        const values = this.values;

        if (time <= times[0]) {
            return values.slice(0, values.length / times.length);
        }

        if (time >= times[times.length - 1]) {
            return values.slice(-values.length / times.length);
        }

        const i1 = this.findNextKeyframeIndex(time);
        const i0 = i1 - 1;

        const t0 = times[i0];
        const t1 = times[i1];

        const alpha = (time - t0) / (t1 - t0);

        return this.interpolate(
            values.slice(i0 * values.length / times.length, (i0 + 1) * values.length / times.length),
            values.slice(i1 * values.length / times.length, (i1 + 1) * values.length / times.length),
            alpha
        );

    }

    findNextKeyframeIndex(time) {
        const times = this.times;
        let i = 1;
        while (i < times.length && time >= times[i]) {
            i++;
        }
        return i;
    }

    interpolate(v0, v1, alpha) {
        switch (this.interpolation) {
            case 'STEP':
                return v0;
            case 'LINEAR':
                return v0.map((x, i) => x + (v1[i] - x) * alpha);
            case 'CUBICSPLINE':
                // Implement cubic spline interpolation if needed
                console.warn('CUBICSPLINE interpolation not implemented');
                return v0;
            default:
                console.warn(`Unknown interpolation ${this.interpolation}`);
                return v0;
        }
    }
}

export class VectorKeyframeTrack extends KeyframeTrack {
    interpolate(v0, v1, alpha) {
        return new Vector3().lerpVectors(new Vector3().fromArray(v0), new Vector3().fromArray(v1), alpha).toArray();
    }
}

export class QuaternionKeyframeTrack extends KeyframeTrack {
    interpolate(v0, v1, alpha) {
        const q0 = new Quaternion().fromArray(v0);
        const q1 = new Quaternion().fromArray(v1);
        return new Quaternion().slerpQuaternions(q0, q1, alpha).toArray();
    }
}