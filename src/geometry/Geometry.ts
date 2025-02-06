import { BufferAttribute, Float32BufferAttribute, Uint16BufferAttribute, Uint32BufferAttribute } from './BufferAttribute';
import { Vector3 } from '@/math/Vector3';
import { BoundingBox } from '@/math/BoundingBox';
import { BoundingSphere } from '@/math/BoundingSphere';
import { autobind, uuid } from '@/util/general';
import { arrayNeedsUint32 } from '@/util/webgpu';
import { BufferData } from '@/data';
import { Matrix3, Matrix4, Vector2 } from '@/math';
import { ShaderAttribute, ShaderVarying } from '@/materials/shaders';

const _tempVec3 = new Vector3();

type GPUIndexFormat = 'uint32' | 'uint16' | 'uint8';

export class Geometry {
    id: string = uuid('geometry');
    attributes: Record<string, BufferAttribute | undefined>;
    boundingBox!: BoundingBox;
    boundingSphere!: BoundingSphere;
    isIndexed: boolean;
    indexFormat?: GPUIndexFormat;
    packed!: BufferData;
    indices!: Uint16BufferAttribute | Uint32BufferAttribute;
    groups: { start: number, count: number, materialIndex: number }[] = [];
    parameters: any;

    constructor() {
        autobind(this);
        this.attributes = {
            position: new Float32BufferAttribute([], 3),
            normal: undefined,
            tangent: undefined,
            uv: undefined,
        }
        this.isIndexed = false;
    }

    computeVertexNormals() {
        const index = this.indices;
        const positionAttribute = this.getAttribute('position');

        if (positionAttribute !== undefined) {
            let normalAttribute = this.getAttribute('normal');

            if (normalAttribute === undefined) {
                normalAttribute = new Float32BufferAttribute(new Float32Array(positionAttribute.count * 3), 3);
                this.setAttribute('normal', normalAttribute as Float32BufferAttribute);
            } else {
                for (let i = 0, il = normalAttribute.count; i < il; i++) {
                    normalAttribute.setXYZ(i, 0, 0, 0);
                }
            }

            const pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
            const nA = new Vector3(), nB = new Vector3(), nC = new Vector3();
            const cb = new Vector3(), ab = new Vector3();

            if (index) {
                for (let i = 0, il = index.count; i < il; i += 3) {
                    const vA = index.getX(i + 0);
                    const vB = index.getX(i + 1);
                    const vC = index.getX(i + 2);

                    pA.setFromBufferAttribute(positionAttribute, vA);
                    pB.setFromBufferAttribute(positionAttribute, vB);
                    pC.setFromBufferAttribute(positionAttribute, vC);

                    cb.subVectors(pC, pB);
                    ab.subVectors(pA, pB);
                    cb.cross(ab);

                    nA.setFromBufferAttribute(normalAttribute, vA);
                    nB.setFromBufferAttribute(normalAttribute, vB);
                    nC.setFromBufferAttribute(normalAttribute, vC);

                    nA.add(cb);
                    nB.add(cb);
                    nC.add(cb);

                    normalAttribute.setXYZ(vA, nA.x, nA.y, nA.z);
                    normalAttribute.setXYZ(vB, nB.x, nB.y, nB.z);
                    normalAttribute.setXYZ(vC, nC.x, nC.y, nC.z);
                }
            } else {
                for (let i = 0, il = positionAttribute.count; i < il; i += 3) {
                    pA.setFromBufferAttribute(positionAttribute, i + 0);
                    pB.setFromBufferAttribute(positionAttribute, i + 1);
                    pC.setFromBufferAttribute(positionAttribute, i + 2);

                    cb.subVectors(pC, pB);
                    ab.subVectors(pA, pB);
                    cb.cross(ab);

                    normalAttribute.setXYZ(i + 0, cb.x, cb.y, cb.z);
                    normalAttribute.setXYZ(i + 1, cb.x, cb.y, cb.z);
                    normalAttribute.setXYZ(i + 2, cb.x, cb.y, cb.z);
                }
            }

            this.normalizeNormals();
        } else {
            console.error('Geometry.computeVertexNormals(): Missing required attribute \'position\'');
        }
    }

    normalizeNormals() {
        const normals = this.attributes.normal as Float32BufferAttribute;

        for (let i = 0, il = normals.count; i < il; i++) {
            _tempVec3.setFromBufferAttribute(normals, i);
            _tempVec3.normalize();
            normals.setXYZ(i, _tempVec3.x, _tempVec3.y, _tempVec3.z);
        }
    }

    hasAttribute(name: string) {
        return this.attributes[name] !== undefined;
    }
    computeTangents() {
        const index = this.indices;
		const attributes = this.attributes;
		// based on http://www.terathon.com/code/tangent.html
		// (per vertex tangents)
		if (index === null ||
			attributes.position === undefined ||
			attributes.normal === undefined ||
			attributes.uv === undefined) {
			console.error( 'computeTangents() failed. Missing required attributes (index, position, normal or uv)' );
			return;

		}

		const positionAttribute = attributes.position;
		const normalAttribute = attributes.normal;
		const uvAttribute = attributes.uv;

		if (this.hasAttribute('tangent') === false) {
			this.setAttribute('tangent', new Float32BufferAttribute(new Array(positionAttribute.count * 4).fill(0), 4));
		}
        if (!positionAttribute || !normalAttribute || !uvAttribute || !index) {
            return;
        }

		const tangentAttribute = this.getAttribute('tangent') as BufferAttribute;

		const tan1: Vector3[] = [], tan2: Vector3[] = [];

		for ( let i = 0; i < positionAttribute.count; i ++ ) {
			tan1[ i ] = new Vector3();
			tan2[ i ] = new Vector3();
		}

		const vA = new Vector3(),
			vB = new Vector3(),
			vC = new Vector3(),

			uvA = new Vector2(),
			uvB = new Vector2(),
			uvC = new Vector2(),

			sdir = new Vector3(),
			tdir = new Vector3();

		function handleTriangle( a: number, b: number, c: number ) {

			vA.setFromBufferAttribute( positionAttribute, a );
			vB.setFromBufferAttribute( positionAttribute, b );
			vC.setFromBufferAttribute( positionAttribute, c );

			uvA.setFromBufferAttribute( uvAttribute, a );
			uvB.setFromBufferAttribute( uvAttribute, b );
			uvC.setFromBufferAttribute( uvAttribute, c );

			vB.sub( vA );
			vC.sub( vA );

			uvB.sub( uvA );
			uvC.sub( uvA );

			const r = 1.0 / ( uvB.x * uvC.y - uvC.x * uvB.y );

			// silently ignore degenerate uv triangles having coincident or colinear vertices
			if (!isFinite( r ) ) return;

			sdir.copy( vB ).scale( uvC.y ).add( vC.scale(- uvB.y) ).scale( r );
			tdir.copy( vC ).scale( uvB.x ).add( vB.scale(- uvC.x) ).scale( r );

			tan1[ a ].add( sdir );
			tan1[ b ].add( sdir );
			tan1[ c ].add( sdir );

			tan2[ a ].add( tdir );
			tan2[ b ].add( tdir );
			tan2[ c ].add( tdir );

		}

		let groups = this.groups;

		if (groups.length === 0 ) {
			groups = [{
				start: 0,
                materialIndex: 0,
				count: index.count,
			}];
		}

		for (let i = 0, il = groups.length; i < il; ++ i) {
			const group = groups[ i ];
			const start = group.start;
			const count = group.count;

			for ( let j = start, jl = start + count; j < jl; j += 3 ) {
				handleTriangle(
					index.getX( j + 0 ),
					index.getX( j + 1 ),
					index.getX( j + 2 )
				);
			}

		}

		const tmp = new Vector3(), tmp2 = new Vector3();
		const n = new Vector3(), n2 = new Vector3();

		function handleVertex( v: number ) {

			n.setFromBufferAttribute( normalAttribute, v );
            if (!n2 || isNaN(n2[0])) {
                return;
            }
			n2.copy( n );

			const t = tan1[ v ];

            if (!t || isNaN(t[0])) {
                return;
            }
			// Gram-Schmidt orthogonalize
			tmp.copy( t );
			tmp.sub( n.scale(n.dot( t ))).normalize();
			// Calculate handedness
			tmp2.crossVectors( n2, t );
			const test = tmp2.dot( tan2[ v ] );
			const w = ( test < 0.0 ) ? - 1.0 : 1.0;

			tangentAttribute.setXYZW( v, tmp.x, tmp.y, tmp.z, w );
		}

		for ( let i = 0, il = groups.length; i < il; ++ i ) {
			const group = groups[ i ];
			const start = group.start;
			const count = group.count;

			for ( let j = start, jl = start + count; j < jl; j += 3 ) {
				handleVertex(index.getX( j + 0 ));
				handleVertex(index.getX( j + 1 ));
				handleVertex(index.getX( j + 2 ));
			}

		}
    }
    setAttribute(name: string, attribute: Float32BufferAttribute) {
        this.attributes[name] = attribute;
        return this;
    }

    getAttribute(name: string) {
        return this.attributes[name];
    }

    setIndices(indices: ArrayLike<number> | Uint32BufferAttribute | Uint16BufferAttribute) {
        if (Array.isArray(indices)) {
			this.indices = new (arrayNeedsUint32(indices) ? Uint32BufferAttribute : Uint16BufferAttribute )(indices, 1);
		} else if (indices instanceof Uint32BufferAttribute || indices instanceof Uint16BufferAttribute) {
			this.indices = indices as Uint32BufferAttribute | Uint16BufferAttribute;
		} else if (indices instanceof Uint32Array || indices instanceof Uint16Array) {
            this.indices = new (arrayNeedsUint32(indices) ? Uint32BufferAttribute : Uint16BufferAttribute )(indices, 1);
        }

        this.isIndexed = true;
        return this;
    }

    getIndices(): Uint16Array | Uint32Array {
        return this.indices.data as Uint16Array | Uint32Array;
    }

    applyMatrix4(matrix: Matrix4) {
		const position = this.attributes.position;
		if (position !== undefined) {
			position.applyMatrix4(matrix);
			position.needsUpdate = true;
		}

		const normal = this.attributes.normal;
		if (normal !== undefined) {
			const normalMatrix = new Matrix3().getNormalMatrix(matrix);
			normal.applyNormalMatrix( normalMatrix );
			normal.needsUpdate = true;
		}

		const tangent = this.attributes.tangent;
		if (tangent !== undefined) {
			tangent.transformDirection( matrix );
			tangent.needsUpdate = true;
		}

		if (this.boundingBox !== null) {
			this.computeBoundingBox();
		}

		if ( this.boundingSphere !== null ) {
			this.computeBoundingSphere();
		}

        this.pack();

		return this;

	}

    rotateX(angle: number) {
        const _m1 = Matrix4.instance.setRotationX(angle);
        this.applyMatrix4(_m1);
        return this;
    }

    rotateY(angle: number) {
        const _m1 = Matrix4.instance.setRotationY(angle);
        this.applyMatrix4(_m1);
        return this;
    }

    rotateZ(angle: number) {
        const _m1 = Matrix4.instance.setRotationZ(angle);
        this.applyMatrix4(_m1);
        return this;
    }

    translate(x: number, y: number, z: number) {
        const _m1 = Matrix4.instance.setTranslation(x, y, z);
        this.applyMatrix4(_m1);
        return this;
    }

    scale(x: number, y: number, z: number) {
        const _m1 = new Matrix4().setScale(x, y, z);
        this.applyMatrix4(_m1);
        return this;
    }

    lookAt(vector: Vector3) {
        const _obj = { matrix: new Matrix4(), lookAt: (_: Vector3) => { /* mock implementation */ }, updateMatrix: () => { /* mock implementation */ } };
        _obj.lookAt(vector);
        _obj.updateMatrix();
        this.applyMatrix4(_obj.matrix);
        return this;
    }

    center() {
        this.computeBoundingBox();
        const _offset = new Vector3();
        this.boundingBox.getCenter(_offset).negate();
        this.translate(_offset.x, _offset.y, _offset.z);
        return this;
    }

    setFromPoints(points: Vector3[]) {
        const positionAttribute = this.getAttribute('position') as Float32BufferAttribute;
        if (positionAttribute === undefined) {
            const position = [];
            for (let i = 0, l = points.length; i < l; i++) {
                const point = points[i];
                position.push(point.x, point.y, point.z || 0);
            }
            this.setAttribute('position', new Float32BufferAttribute(position, 3));
        } else {
            const l = Math.min(points.length, positionAttribute.count);
            for (let i = 0; i < l; i++) {
                const point = points[i];
                positionAttribute.setXYZ(i, point.x, point.y, point.z || 0);
            }
            if (points.length > positionAttribute.count) {
                console.warn('Buffer size too small for points data. Use .dispose() and create a new geometry.');
            }
            positionAttribute.needsUpdate = true;
        }
        return this;
    }

    get vertexCount() {
        const position = this.attributes.position;
        return position ? position.count : 0;
    }


    addGroup(start: number, count: number, materialIndex = 0 ) {
		this.groups.push( {
			start: start,
			count: count,
			materialIndex: materialIndex
		});
	}

    getAttributes() {
        return Object.values(this.attributes);
    }

    getVertexAttributesLayout() {
        const layouts = [];
        let location = 0;
        for (const name in this.attributes) {
            const attr = this.attributes[name];
            if (attr === undefined) continue;
            layouts.push({
                arrayStride: attr.itemSize * attr.data.BYTES_PER_ELEMENT,
                attributes: [
                    {
                        shaderLocation: location++,
                        offset: 0,
                        format: attr.format,
                    }
                ]
            });
        }
        return layouts as GPUVertexBufferLayout[]
    }

    computeBoundingBox() {
        if (!this.boundingBox) this.boundingBox = new BoundingBox();
        const position = this.attributes.position;
        if (position) this.boundingBox.setFromAttribute(position);
        return this;
    }

    computeBoundingSphere() {
        if (!this.boundingSphere) this.boundingSphere = new BoundingSphere();
        const position = this.attributes.position;
        if (!position) return this;
        this.computeBoundingBox();
        this.boundingBox?.getCenter(_tempVec3);
        let maxDistSq = 0;
        const posArray = position.data;
        for (let i = 0; i < posArray.length; i += 3) {
            const dx = posArray[i] - _tempVec3.x;
            const dy = posArray[i + 1] - _tempVec3.y;
            const dz = posArray[i + 2] - _tempVec3.z;
            maxDistSq = Math.max(maxDistSq, dx * dx + dy * dy + dz * dz);
        }
        this.boundingSphere.center.copy(_tempVec3);
        this.boundingSphere.radius = Math.sqrt(maxDistSq);
        return this;
    }

    // pack() {
    //     // Define static offsets for each attribute
    //     const positions = this.attributes.position?.data;
    //     const normals = this.attributes.normal?.data;
    //     const uvs = this.attributes.uv?.data;
    //     const tangents = this.attributes.tangent?.data;

    //     let positionOffset = 0;
    //     let tangentOffset = 0;
    //     let normalOffset = 0;
    //     let uvOffset = 0;
    //     let vertexSize = 0; 

    //     let offset = 0;
    //     for (const attr of this.getAttributes()) {
    //         if (!attr) continue;
    //         if (attr === this.attributes.position) {
    //             positionOffset = offset;
    //         } else if (attr === this.attributes.normal) {
    //             normalOffset = vertexSize;
    //         } else if (attr === this.attributes.tangent) {
    //             tangentOffset = vertexSize;
    //         } else if (attr === this.attributes.uv) {
    //             uvOffset = vertexSize;
    //         }
    //         offset += attr.itemSize;
    //         vertexSize += attr.itemSize;
    //     }

    //     if (this.packed) {
    //         this.packed.offChange();
    //     }
    //     this.packed = new BufferData(this.vertexCount, vertexSize).onChange(() => this.pack());
    
    //     for (let i = 0; i < this.vertexCount; i++) {
    //         const i2 = i * 2; // Index for UVs
    //         const i3 = i * 3; // Index for positions, normals;
    //         const i4 = i * 4; // Index for tangents
    //         const offset = i * vertexSize; // Base offset in the buffer
    
    //         // Positions
    //         if (positions) {
    //             this.packed[offset + positionOffset + 0] = positions[i3 + 0];
    //             this.packed[offset + positionOffset + 1] = positions[i3 + 1];
    //             this.packed[offset + positionOffset + 2] = positions[i3 + 2];
    //         } 
    
    //         // Tangents
    //         if (tangents) {
    //             this.packed[offset + tangentOffset + 0] = tangents[i4 + 0];
    //             this.packed[offset + tangentOffset + 1] = tangents[i4 + 1];
    //             this.packed[offset + tangentOffset + 2] = tangents[i4 + 2];
    //             this.packed[offset + tangentOffset + 3] = tangents[i4 + 3];
    //         }
    //         // Normals
    //         if (normals) {
    //             this.packed[offset + normalOffset + 0] = normals[i3 + 0];
    //             this.packed[offset + normalOffset + 1] = normals[i3 + 1];
    //             this.packed[offset + normalOffset + 2] = normals[i3 + 2];
    //         }
    //         // UVs
    //         if (uvs) {
    //             this.packed[offset + uvOffset + 0] = uvs[i2 + 0];
    //             this.packed[offset + uvOffset + 1] = uvs[i2 + 1];
    //         }
    //     } 

    //     return this;
    // }
            
    
    // getPacked() {
    //     if (!this.packed) {
    //         this.pack();
    //     }
    //     return this.packed;
    // }

    calculateUVs() {
        const positions = this.attributes.position?.data;
        if (!positions) return;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < positions.length; i += 3) {
            minX = Math.min(minX, positions[i]);
            maxX = Math.max(maxX, positions[i]);
            minY = Math.min(minY, positions[i + 1]);
            maxY = Math.max(maxY, positions[i + 1]);
        }
        const width = maxX - minX;
        const height = maxY - minY;
        const uvs = [];
        for (let i = 0; i < positions.length; i += 3) {
            const u = (positions[i] - minX) / width;
            const v = (positions[i + 1] - minY) / height;
            uvs.push(u, v);
        }
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    }

    setFromArrays({
        positions, 
        indices, 
        normals, 
        uvs, 
        tangents, 
    }: {
        positions: ArrayLike<number>, 
        indices?: Uint16BufferAttribute | Uint32BufferAttribute | Uint16Array | Uint32Array | ArrayLike<number>,
        normals?: ArrayLike<number>, 
        uvs?: ArrayLike<number>, 
        joints?: ArrayLike<number>, 
        weights?: ArrayLike<number>, 
        tangents?: ArrayLike<number>, 
    }) {
        if (positions) this.setAttribute('position', new Float32BufferAttribute(positions, 3));
        if (tangents) this.setAttribute('tangent', new Float32BufferAttribute(tangents, 4));
        if (normals) this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        if (uvs) this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        if (indices) this.setIndices(indices);

        this.computeBoundingBox();
        this.computeBoundingSphere();

        if (!normals) {
            this.computeVertexNormals();
        }
        if (!uvs) {
            this.calculateUVs();
        }
        if (!tangents) {
            this.computeTangents();
        }

        //this.pack();
        return this;
    }

    getShaderAttributes() {
        let loc = 0;
        const attributes: ShaderAttribute[] = [];
        for (const name in this.attributes) {
            const attr = this.attributes[name];
            if (attr === undefined) continue;
            attributes.push({
                name,
                location: loc++,
                type: attr.type,
            });
        }
        return attributes
    }

    getShaderVaryings() {
        let loc = 0;
        const varyings: ShaderVarying[] = [];
        for (const name in this.attributes) {
            const attr = this.attributes[name];
            if (attr === undefined) continue;
            const isTangent = name === 'tangent';
            const isPosition = name === 'position';
            const varying = {
                name,
                location: loc++,
                type: attr.type,
            }
            isTangent && (varying.type = 'vec3f');
            varyings.push(varying);
            isTangent && varyings.push({
                name: 'bitangent',
                location: loc++,
                type: 'vec3f',
            });
            isPosition && varyings.push({
                name: 'local_position',
                location: loc++,
                type: 'vec3f',
            });
        }
        return varyings;
    }
    subdivide(steps: number = 1, mode: 'simple' | 'catmull-clark' = 'simple'): this {
        if (steps < 1) return this;
        
        const positions = this.attributes.position?.data as Float32Array;
        const indices = this.indices?.data as (Uint16Array | Uint32Array);
        
        if (!positions || !indices) {
            console.error('Geometry.subdivide(): Geometry must have positions and be indexed');
            return this;
        }
    
        for (let step = 0; step < steps; step++) {
            if (mode === 'simple') {
                this._simpleSubdivide();
            } else {
                this._catmullClarkSubdivide();
            }
        }
    
        // Recompute all attributes
        if (this.attributes.normals) this.computeVertexNormals();
        if (this.attributes.uv) this.calculateUVs();
        if (this.attributes.tangent) this.computeTangents();
        
        this.computeBoundingBox();
        this.computeBoundingSphere();
        //this.pack();
        
        return this;
    }

    private _simpleSubdivide(): void {
        const positions = this.attributes.position?.data as Float32Array;
        const indices = this.indices?.data as Uint16Array | Uint32Array;
    
        if (!positions || !indices) {
            console.error('Geometry._simpleSubdivide(): Geometry must have positions and be indexed');
            return;
        }
    
        const newPositions: number[] = [];
        const newIndices: number[] = [];
        const midpointCache = new Map<string, number>();
        const getKey = (a: number, b: number) => a < b ? `${a}_${b}` : `${b}_${a}`;
    
        const getMidpoint = (i0: number, i1: number): number => {
            const key = getKey(i0, i1);
            if (midpointCache.has(key)) {
                return midpointCache.get(key)!;
            }
    
            const v0 = positions.slice(i0 * 3, i0 * 3 + 3);
            const v1 = positions.slice(i1 * 3, i1 * 3 + 3);
            const midpoint = [
                (v0[0] + v1[0]) / 2,
                (v0[1] + v1[1]) / 2,
                (v0[2] + v1[2]) / 2,
            ];
            const midIndex = newPositions.length / 3;
            newPositions.push(...midpoint);
            midpointCache.set(key, midIndex);
            return midIndex;
        };
    
        // Copy original positions
        newPositions.push(...positions);
    
        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i];
            const i1 = indices[i + 1];
            const i2 = indices[i + 2];
    
            const a = getMidpoint(i0, i1);
            const b = getMidpoint(i1, i2);
            const c = getMidpoint(i2, i0);
    
            // Create four new triangles
            newIndices.push(i0, a, c);
            newIndices.push(i1, b, a);
            newIndices.push(i2, c, b);
            newIndices.push(a, b, c);
        }
    
        // Update geometry data
        this.setAttribute('position', new Float32BufferAttribute(newPositions, 3));
        this.setIndices(newIndices);
    }

    private _catmullClarkSubdivide(): void {
        const positions = this.attributes.position?.data as Float32Array;
        const indices = this.indices?.data as Uint16Array | Uint32Array;
    
        if (!positions || !indices) {
            console.error('Geometry._catmullClarkSubdivide(): Geometry must have positions and be indexed');
            return;
        }
    
        const vertexFaces: Map<number, number[][]> = new Map();
        const facePoints: number[][] = [];
        const edgePoints: Map<string, number[]> = new Map();
        const edgeMap: Map<string, number[][]> = new Map();
    
        const getKey = (a: number, b: number) => a < b ? `${a}_${b}` : `${b}_${a}`;
    
        // Compute face points
        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i];
            const i1 = indices[i + 1];
            const i2 = indices[i + 2];
    
            const v0 = positions.slice(i0 * 3, i0 * 3 + 3);
            const v1 = positions.slice(i1 * 3, i1 * 3 + 3);
            const v2 = positions.slice(i2 * 3, i2 * 3 + 3);
    
            const facePoint = [
                (v0[0] + v1[0] + v2[0]) / 3,
                (v0[1] + v1[1] + v2[1]) / 3,
                (v0[2] + v1[2] + v2[2]) / 3,
            ];
            facePoints.push(facePoint);
    
            // Map faces to vertices
            [i0, i1, i2].forEach((idx) => {
                if (!vertexFaces.has(idx)) vertexFaces.set(idx, []);
                vertexFaces.get(idx)!.push(facePoint);
            });
    
            // Build edge map
            const edges = [
                [i0, i1],
                [i1, i2],
                [i2, i0],
            ];
    
            edges.forEach(([a, b]) => {
                const key = getKey(a, b);
                if (!edgeMap.has(key)) edgeMap.set(key, []);
                edgeMap.get(key)!.push(facePoint);
            });
        }
    
        // Compute edge points
        edgeMap.forEach((facePoints, key) => {
            const [a, b] = key.split('_').map(Number);
            const v0 = positions.slice(a * 3, a * 3 + 3);
            const v1 = positions.slice(b * 3, b * 3 + 3);
            const avgFacePoints = facePoints.reduce((acc, fp) => {
                acc[0] += fp[0];
                acc[1] += fp[1];
                acc[2] += fp[2];
                return acc;
            }, [0, 0, 0]).map((sum) => sum / facePoints.length);
    
            const edgePoint = [
                (v0[0] + v1[0] + avgFacePoints[0]) / (2 + facePoints.length),
                (v0[1] + v1[1] + avgFacePoints[1]) / (2 + facePoints.length),
                (v0[2] + v1[2] + avgFacePoints[2]) / (2 + facePoints.length),
            ];
    
            edgePoints.set(key, edgePoint);
        });
    
        // Compute new positions for original vertices
        const newPositions: number[] = [];
        for (let i = 0; i < positions.length / 3; i++) {
            const vertex = positions.slice(i * 3, i * 3 + 3);
            const facePoints = vertexFaces.get(i)!;
            const n = facePoints.length;
    
            const avgFacePoint = facePoints.reduce((acc, fp) => {
                acc[0] += fp[0];
                acc[1] += fp[1];
                acc[2] += fp[2];
                return acc;
            }, [0, 0, 0]).map((sum) => sum / n);
    
            const connectedEdges = Array.from(edgeMap.entries())
                .filter(([key]) => key.includes(`${i}_`) || key.endsWith(`_${i}`))
                .map(([_, fps]) => fps)
                .flat();
    
            const avgEdgeMidpoint = connectedEdges.reduce((acc, ep) => {
                acc[0] += ep[0];
                acc[1] += ep[1];
                acc[2] += ep[2];
                return acc;
            }, [0, 0, 0]).map((sum) => sum / connectedEdges.length);
    
            const newX = (avgFacePoint[0] + 2 * avgEdgeMidpoint[0] + (n - 3) * vertex[0]) / n;
            const newY = (avgFacePoint[1] + 2 * avgEdgeMidpoint[1] + (n - 3) * vertex[1]) / n;
            const newZ = (avgFacePoint[2] + 2 * avgEdgeMidpoint[2] + (n - 3) * vertex[2]) / n;
    
            newPositions.push(newX, newY, newZ);
        }
    
        // Combine new points
        const allPositions = newPositions.slice();
        const facePointIndices: number[] = facePoints.map((fp) => {
            const index = allPositions.length / 3;
            allPositions.push(...fp);
            return index;
        });
    
        const edgePointIndices = new Map<string, number>();
        edgePoints.forEach((ep, key) => {
            const index = allPositions.length / 3;
            allPositions.push(...ep);
            edgePointIndices.set(key, index);
        });
    
        // Reconstruct faces
        const newIndices: number[] = [];
        let faceIndex = 0;
        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i];
            const i1 = indices[i + 1];
            const i2 = indices[i + 2];
    
            const fpIndex = facePointIndices[faceIndex++];
    
            const e0 = edgePointIndices.get(getKey(i0, i1))!;
            const e1 = edgePointIndices.get(getKey(i1, i2))!;
            const e2 = edgePointIndices.get(getKey(i2, i0))!;
    
            // Create new faces
            newIndices.push(i0, e0, fpIndex, e2);
            newIndices.push(i1, e1, fpIndex, e0);
            newIndices.push(i2, e2, fpIndex, e1);
            newIndices.push(e0, e1, e2, fpIndex);
        }
    
        // Update geometry data
        this.setAttribute('position', new Float32BufferAttribute(allPositions, 3));
        this.setIndices(newIndices);
    }
    
    copy(geometry: Geometry) {
        this.attributes = geometry.attributes;
        this.indices = geometry.indices;
        this.groups = geometry.groups;
        this.boundingBox = geometry.boundingBox;
        this.boundingSphere = geometry.boundingSphere;
        this.isIndexed = geometry.isIndexed;
        this.indexFormat = geometry.indexFormat;
        this.packed = geometry.packed;
        return this;
    }

}