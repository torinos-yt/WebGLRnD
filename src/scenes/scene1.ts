import * as THREE from "three";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass";

import SceneBase from "./SceneBase";
import { VerletfromLine } from "../Verlet/verlet";
import { lerp, initCamera, extractMeshes } from "../util";
import ModelLoader from "../loader/modelLoader";
import ImageLoader from "../loader/imageLoader";

export class scene1 extends SceneBase
{
    private verlet : VerletfromLine;

    private defaultY : number;

    private sao : SAOPass;

    constructor()
    {
        super();
        this.valid = true;
        this.camera = initCamera(110);
        this.verlet = new VerletfromLine(this.renderer, 64);

        const light = new THREE.DirectionalLight(0xffeedd, 2.2);
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

        this.scene.add(new THREE.AmbientLight(0xbbddff, .55));

        this.camera.position.x = 381.410;
        this.camera.position.y = 64.97;
        this.camera.position.z = 447.152;
        this.camera.setRotationFromEuler(new THREE.Euler(.9779, .6251, -.7152));

        this.defaultY = this.camera.position.y;

        const pmGen = new THREE.PMREMGenerator(this.renderer);
        THREE.DefaultLoadingManager.onLoad = () => { pmGen.dispose(); };

        const envMap = pmGen.fromEquirectangular(ImageLoader.Images["sky0"]).texture;

        this.scene.background = envMap;

        const pole = ModelLoader.Models["pole"];
        const poleMesh = extractMeshes(pole, envMap);
        poleMesh.rotateX(3.1415 * .5);
        poleMesh.translateZ(500);
        this.scene.add(poleMesh);

        super.addBasePass(.51);

        //new OrbitControls(this.camera, this.renderer.domElement);

        this.sao = new SAOPass(this.scene, this.camera, false, true);
        this.sao.params.output = 0;
        this.sao.params.saoIntensity = .35;
        this.sao.params.saoScale = 1000;
        this.sao.params.saoKernelRadius = 40;
        this.sao.params.saoBlur = 1;
        this.sao.params.saoBlurRadius = 4;
        this.sao.params.saoBlurStdDev = 8;
        this.sao.params.saoBlurDepthCutoff = 0.0002;
        this.composer.addPass(this.sao);
    }

    public Render(delta : number) : void
    {
        if(!this.valid) return;
        this.verlet.Compute({"deltaTime" : delta});
        this.camera.position.y = lerp(this.defaultY - window.scrollY*.3, this.camera.position.y, Math.exp(-7 * delta));
        
        super.Render();
    }
}