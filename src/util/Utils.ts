export class Utils {
    static ID(key: string = ''): string {
        return key + '_' + Math.random().toString(36).substring(2, 9);
    }

    static arraysEqual<T>(a: T[] | Float32Array, b: T[] | Float32Array): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;

        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}