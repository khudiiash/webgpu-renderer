import { Object3D } from "@/core/Object3D";
import { BoxGeometry } from "@/geometry/BoxGeometry";
import { StandardMaterial } from "@/materials/StandardMaterial";
import { Mesh } from "@/core/Mesh";
import { PlaneGeometry } from "@/geometry";
import { GridMaterial } from "@/materials/GridMaterial";

export class CoordSystem extends Object3D {
    constructor() {
        super();
        this.name = 'CoordSystem';
        this.createCoordSystem();
    }

    createCoordSystem() {
        const red = new StandardMaterial({ useLight: false, diffuse: '#ff0000' });
        const green = new StandardMaterial({ useLight: false, diffuse: '#00ff00' });
        const blue = new StandardMaterial({ useLight: false, diffuse: '#0000ff' });
        const box = new BoxGeometry(1, 1, 1);
        const athick = 0.03;
        const xAxis = new Mesh(box, red).setScale(100, athick, athick);
        xAxis.position.x = 50;
        const yAxis = new Mesh(box, green).setScale(athick, 100, athick);
        yAxis.position.y = 50;
        const zAxis = new Mesh(box, blue).setScale(athick, athick, 100);
        zAxis.position.z = 50;
        this.add(xAxis);
        this.add(yAxis);
        this.add(zAxis);

        const gridGeometry = new PlaneGeometry(100, 100, 10, 10);
        const gridMaterial = new GridMaterial({ uvMode: 3 });
        const grid = new Mesh(gridGeometry, gridMaterial);
        grid.rotation.x = Math.PI / 2;
        this.add(grid);
    }

}