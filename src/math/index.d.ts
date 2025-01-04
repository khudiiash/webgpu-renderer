declare namespace Math {
    interface VectorBase {
        toArray(array?: number[], offset?: number): number[];
        fromArray(array: number[], offset?: number): this;
        set(v: ArrayLike<number>, offset?: number): this;
        clone(): this;
        copy(v: this): this;
        equals(v: this): boolean;
        magnitude(): number;
    }

    // Vector2 declarations
    interface Vector2 extends BufferData, VectorBase {
        readonly isVector2: boolean;
        x: number;
        y: number;
        add(v: Vector2): this;
        sub(v: Vector2): this;
        divide(v: Vector2): this;
        multiply(v: Vector2): this;
        dot(v: Vector2): number;
        setX(x: number): this;
        setY(y: number): this;
    }

    // Vector3 declarations
    interface Vector3 extends BufferData, VectorBase {
        readonly isVector3: boolean;
        x: number;
        y: number;
        z: number;
        add(v: Vector3): this;
        sub(v: Vector3): this;
        divide(v: Vector3): this;
        multiply(v: Vector3): this;
        dot(v: Vector3): number;
        cross(v: Vector3): this;
        applyMatrix4(m: Matrix4): this;
        setX(x: number): this;
        setY(y: number): this;
        setZ(z: number): this;
    }

    interface Vector4 extends BufferData {
        readonly isVector4: boolean;
        x: number;
        y: number;
        z: number;
        w: number;
        add(v: Vector4): this;
        sub(v: Vector4): this;
        divide(v: Vector4): this;
        multiply(v: Vector4): this;
        dot(v: Vector4): number;
        applyMatrix4(m: Matrix4): this;
        setX(x: number): this;
        setY(y: number): this;
        setZ(z: number): this;
        setW(w: number): this;
    }

    // Matrix4 declarations
    interface Matrix4 extends BufferData {
        readonly isMatrix4: boolean;
        identity(): this;
        multiply(m: Matrix4): this;
        determinant(): number;
        invert(): this;
        transpose(): this;
    }

    // We can also declare utility types that will be used across different classes
    type Vec2Tuple = [number, number];
    type Vec3Tuple = [number, number, number];
    type Vec4Tuple = [number, number, number, number];
    type Mat4Tuple = [
        number, number, number, number,
        number, number, number, number,
        number, number, number, number,
        number, number, number, number
    ];
}

// Declare the constructors for our classes
declare class Vector2 extends Float32Array implements Math.Vector2 {
    constructor(x?: number, y?: number);
    static readonly ZERO: Vector2;
    static readonly ONE: Vector2;
    static readonly UP: Vector2;
    static readonly DOWN: Vector2;
    static readonly LEFT: Vector2;
    static readonly RIGHT: Vector2;
}

declare class Vector3 extends Float32Array implements Math.Vector3 {
    constructor(x?: number, y?: number, z?: number);
    static readonly ZERO: Vector3;
    static readonly ONE: Vector3;
    static readonly UP: Vector3;
    static readonly DOWN: Vector3;
    static readonly LEFT: Vector3;
    static readonly RIGHT: Vector3;
    static readonly FORWARD: Vector3;
    static readonly BACKWARD: Vector3;
}

declare class Matrix4 extends Float32Array implements Math.Matrix4 {
    constructor();
    static readonly IDENTITY: Matrix4;
}