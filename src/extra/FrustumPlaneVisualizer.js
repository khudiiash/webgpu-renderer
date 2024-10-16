class FrustumPlaneVisualizer {
    constructor(scene, frustum) {
        this.scene = scene;
        this.frustum = frustum;
        this.markers = [];
        this.lines = [];
        this.initializeMarkers();
    }

    initializeMarkers() {
        const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const markerMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });

        for (let i = 0; i < 6; i++) {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            this.markers.push(marker);
            this.scene.add(marker);

            const lineGeometry = new THREE.BufferGeometry();
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.lines.push(line);
            this.scene.add(line);
        }
    }

    update(camera) {
        const nearPlaneDistance = camera.near;
        const farPlaneDistance = camera.far;

        for (let i = 0; i < 6; i++) {
            const plane = this.frustum.planes[i];
            const marker = this.markers[i];
            const line = this.lines[i];

            // Calculate a point on the plane
            let distance = i < 4 ? nearPlaneDistance : (i === 4 ? nearPlaneDistance : farPlaneDistance);
            let point = new THREE.Vector3().copy(plane.normal).multiplyScalar(-plane.constant);
            point.addScaledVector(plane.normal, distance);

            // Position the marker
            marker.position.copy(point);

            // Create a line from the camera to the point on the plane
            const linePositions = new Float32Array([
                camera.position.x, camera.position.y, camera.position.z,
                point.x, point.y, point.z
            ]);
            line.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
            line.geometry.attributes.position.needsUpdate = true;
        }
    }
}