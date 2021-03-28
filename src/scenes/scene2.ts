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
    private mesh;

    constructor(renderer : THREE.WebGLRenderer)
    {
        super(renderer);
        this.valid = true;
        this.camera = initCamera(60);

        const boxGeom = new THREE.BoxGeometry(300,300,300);
        const material = new THREE.MeshStandardMaterial();
        this.mesh = new THREE.Mesh(boxGeom, material);
        this.mesh.rotation.set(60, 16.8, -16);
        this.mesh.castShadow = true;
        this.mesh = new THREE.Mesh(boxGeom, material);
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

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

        super.addBasePass(.5);
    }

    public Render(delta : number, t : number) : void
    {
        if(!this.valid) return;
        this.mesh.rotateX(delta*.2);
        this.mesh.rotateY(delta);
        this.mesh.rotateZ(delta*.6);
        super.Render(delta, t);
    }
}