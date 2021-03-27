import * as THREE from "three";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass";

import SceneBase from "./SceneBase";
import { VerletfromLine, VerletfromArray } from "../Verlet/verlet";
import parallelTransport from "../shaders/parallelTransport.glsl";
import { lerp, initCamera, extractMeshes, getTextureDatas, getPixelData } from "../util";
import ModelLoader from "../loader/modelLoader";
import ImageLoader from "../loader/imageLoader";

export class scene2 extends SceneBase
{

    constructor()
    {
        super();
        this.valid = true;
        this.camera = initCamera(60);

        const boxGeom = new THREE.BoxGeometry(300,300,300);
        const material = new THREE.MeshStandardMaterial();
        const mesh = new THREE.Mesh(boxGeom, material);
        mesh.rotation.set(60, 16.8, -16);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        this.scene.add(new THREE.AmbientLight(0xffffff, .05));

        { // DirectionalLight
            const light = new THREE.DirectionalLight(0xffeedd, 1.8);
            light.position.set(800, 500, 0);
            light.castShadow = true;
            light.shadow.camera.near = 100;
            light.shadow.camera.far = 2000;
            light.shadow.camera.right = 1000;
            light.shadow.camera.left = -1000;
            light.shadow.camera.top = 1500;
            light.shadow.camera.bottom = -1000;
            light.shadow.mapSize.width  = 2048;
            light.shadow.mapSize.height = 2048;
            light.shadow.radius = 2;
            light.shadow.bias = -.0045;
            light.shadow.normalBias = -.003;
            this.scene.add(light);
        }

        this.addBasePass(.5);
    }

    public Render(delta : number) : void
    {
        if(!this.valid) return;
        super.Render();
    }
}