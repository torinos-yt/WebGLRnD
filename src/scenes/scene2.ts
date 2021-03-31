import * as THREE from "three";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass";

import SceneBase from "./SceneBase";
import { InstancedVerletfromLine } from "../Verlet/verlet";
import { lerp, extractMeshes, VerletMesh } from "../util";
import ModelLoader from "../loader/modelLoader";
import ImageLoader from "../loader/imageLoader";

import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export class scene2 extends SceneBase
{
    private mesh;

    private mixer : THREE.AnimationMixer;

    private Scroll : number = 0;

    private verlet : InstancedVerletfromLine;

    constructor(renderer : THREE.WebGLRenderer)
    {
        super(renderer);
        this.valid = true;

        const boxGeom = new THREE.BoxGeometry(200,200,200);
        const material = new THREE.MeshStandardMaterial();
        this.mesh = new THREE.Mesh(boxGeom, material);
        this.mesh.rotation.set(60, 16.8, -16);
        this.mesh.castShadow = true;
        this.mesh = new THREE.Mesh(boxGeom, material);
        this.mesh.receiveShadow = true;
        //this.scene.add(this.mesh);

        const camera : GLTF = ModelLoader.Models["camera"];
        const anim = camera.animations;

        this.mixer = new THREE.AnimationMixer(camera.scene);
        const action = this.mixer.clipAction(anim[0]);

        this.camera = camera.scene.children[0] as THREE.PerspectiveCamera;
        this.camera.far = 1000;
        this.camera.near = 100;
        this.camera.updateMatrix();


        this.scene.add(camera.scene);

        action.play();

        this.scene.add(new THREE.AmbientLight(0xffffff, .05));

        { // DirectionalLight
            const light = new THREE.DirectionalLight(0xffeedd, 4.8);
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
            this.scene.add(new THREE.AmbientLight(0xffffff, .6));
        }

        const pole = extractMeshes(ModelLoader.Models["pole_decimate"]);
        // @ts-ignore
        const poleMat : THREE.MeshStandardMaterial = pole.children[0].material.clone();
        const poleGeom = (pole.children[0] as THREE.Mesh).geometry;

        const instanceCount = 200;
        const mat : THREE.Matrix4[] = new Array(instanceCount);
        const iid : number[] = new Array(instanceCount);
        const range = 6000;

        for(let i = 0; i < instanceCount; i++)
        {
            mat[i] = new THREE.Matrix4().setPosition((Math.random()-.5) * 2 * range*.3, 250, (Math.random()-.5) * 2 * range);
            iid[i] = i;
        }

        const vertexCount = 40;

        this.verlet = new InstancedVerletfromLine
        (
            this.renderer, vertexCount, 90, mat, 1216, 
            new THREE.Vector3(0,1,0), false, false, false,
            (i, p) => i <= 2
        );

        const pmGen = new THREE.PMREMGenerator(this.renderer);
        THREE.DefaultLoadingManager.onLoad = () => pmGen.dispose();

        const envMap = pmGen.fromEquirectangular(ImageLoader.Images["sky0"]).texture;
        this.scene.background = envMap;

        const instanceMesh = new THREE.InstancedMesh(poleGeom ,poleMat, instanceCount);
        const dummy : THREE.Object3D = new THREE.Object3D();
        for(let i = 0; i < instanceCount; i++)
        {
            const r = Math.random() * .2 +.8;
            dummy.scale.set(r,r,r);
            dummy.updateMatrix();
            instanceMesh.setMatrixAt(i, dummy.matrix);
        }
        instanceMesh.scale.set(.6,.8,.6);
        instanceMesh.castShadow = true;
        instanceMesh.receiveShadow = true;
        VerletMesh(instanceMesh, poleMat, envMap, this.verlet.DataTexture, 1590.046, vertexCount, true, instanceCount);

        this.scene.add(instanceMesh);

        super.addBasePass(.5);
    }

    public Render(delta : number, t : number, mouse : THREE.Vector2, mouseDelta : THREE.Vector2) : void
    {
        if(!this.valid) return;
        this.mesh.rotateX(delta*.2);
        this.mesh.rotateY(delta);
        this.mesh.rotateZ(delta*.6);

        const prev = this.Scroll;
        this.Scroll = lerp(window.scrollY, this.Scroll, Math.exp(-5.5 * delta));
        
        this.mixer.update((this.Scroll - prev) * .001);

        this.verlet.Compute({ "deltaTime": delta, "gravity" : new THREE.Vector3(0,-2.5,0) });

        super.Render(delta, t, mouse, mouseDelta);
    }
}