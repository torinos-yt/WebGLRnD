import * as THREE from "three";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass";

import SceneBase from "./SceneBase";
import { VerletfromLine, VerletfromArray } from "../Verlet/verlet";
import { lerp, initCamera, extractMeshes, VerletMesh } from "../util";
import ModelLoader from "../loader/modelLoader";
import ImageLoader from "../loader/imageLoader";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vector3 } from "three";

export class scene1 extends SceneBase
{
    private verlet : VerletfromLine;
    private verlet2 : VerletfromLine;
    private verlet3 : VerletfromLine;
    private verletTop : VerletfromLine;
    private verletConstr : VerletfromLine[];

    private defaultPos : THREE.Vector3;
    private zDir : THREE.Vector3;

    private sao : SAOPass;

    private bg : THREE.Texture;

    private prevY : number;

    private first : boolean;

    private cameraPivot : THREE.Group;

    private xAngle : number;
    private yAngle : number;

    constructor(renderer : THREE.WebGLRenderer)
    {
        super(renderer);
        this.valid = true;
        this.camera = initCamera(180);
        this.cameraPivot = new THREE.Group();
        this.cameraPivot.add(this.camera);
        this.scene.add(this.cameraPivot);
        this.first = true;

        this.xAngle = 0;
        this.yAngle = 0;

        let num = 30;
        this.verlet = new VerletfromLine
        (
            this.renderer, num, 60, 10000,
            new THREE.Vector3(-250, 0, .25),
            new THREE.Vector3(-1,0,0), false, false, false,
            (i, p) => (-2700 < p.x && p.x < -2400) || i == num-8 || i < 2 || i >= num-2
        );

        num = 35;
        this.verlet2 = new VerletfromLine
        (
            this.renderer, num, 60, 10000,
            new THREE.Vector3(-550, 0, .25),
            new THREE.Vector3(-1,0,0), false, false, false,
            (i, p) => (-2700 < p.x && p.x < -2400) || i == num-10 || i < 2 || i >= num-2
        );

        num = 30;
        this.verlet3 = new VerletfromLine
        (
            this.renderer, num, 60, 10000,
            new THREE.Vector3(-550, 0, .25),
            new THREE.Vector3(-1,0,0), false, false, false,
            (i, p) => (-2700 < p.x && p.x < -2400) || i == num-8 || i < 2 || i >= num-2
        );

        num = 18;
        this.verletTop = new VerletfromLine
        (
            this.renderer, num, 60, 1197,
            new THREE.Vector3(15, 614, 26),
            new THREE.Vector3(-1,0,0), false, false, false, 
            (i, p) => i < 2 || i >= num-2
        );

        num = 9;
        const posArray : THREE.Vector3[] = new Array(num);
        const div = 1/num;
        for(let i = 0; i < num; i++)
        {
            const pos = new THREE.Vector3(Math.sin(Math.PI*.5 * (div * i) + Math.PI),
                                          Math.cos(Math.PI*.5 * (div * i) + Math.PI), 0);

            pos.multiply(new THREE.Vector3(150,70,100)).add(new THREE.Vector3(-20, 627, 75.5));
            posArray[i] = pos;
        }
        this.verletConstr = new Array(3);
        for(let i = 0; i < 3; i++)
        {
            this.verletConstr[i] =  new VerletfromArray
            (
                this.renderer, 30, posArray, 
                false, false, true,
                (i, p) => i < 2 || i >= num-1
            );
        }

        { // DirectionalLight
            const light = new THREE.DirectionalLight(0xffeedd, 3.66);
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

        this.scene.add(new THREE.AmbientLight(0xbbddff, .2));

        this.camera.position.x = 1303.68;
        this.camera.position.y = -165.674;
        this.camera.position.z = 943.331;
        this.camera.setRotationFromEuler(new THREE.Euler(.8582, .84651, -.6953));

        this.prevY = this.camera.position.y;

        this.defaultPos = this.camera.position.clone();
        this.zDir = new THREE.Vector3(0,this.defaultPos.y,0).sub(this.defaultPos).normalize();

        const pmGen = new THREE.PMREMGenerator(this.renderer);
        THREE.DefaultLoadingManager.onLoad = () => pmGen.dispose();

        const envMap = pmGen.fromEquirectangular(ImageLoader.Images["sky0"]).texture;

        this.scene.background = envMap;
    
        this.bg = ImageLoader.Images["skyBG0"];
        this.bg.repeat.x = .9;
        this.bg.repeat.y = .9;
        this.bg.wrapS = THREE.MirroredRepeatWrapping;
        this.bg.wrapT = THREE.MirroredRepeatWrapping;
        this.scene.background = this.bg;

        const pole = ModelLoader.Models["pole"];
        pole.scene.traverse((node) =>
        {
            // @ts-ignore
            if(node.isMesh)
            {
                const geom = (node as THREE.Mesh).geometry;
                const mat = ((node as THREE.Mesh).material as THREE.MeshStandardMaterial);
                mat.envMap = envMap;
    
                const mesh = new THREE.InstancedMesh(geom, mat, 2);
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                const dummy : THREE.Object3D = new THREE.Object3D();
                mesh.rotateX(3.1415 * .5);
                mesh.translateZ(500);
                mesh.updateMatrix();
                mesh.setMatrixAt(0, dummy.matrix);
                dummy.translateX(-1200);
                dummy.translateY(0);
                dummy.updateMatrix();
                mesh.setMatrixAt(1, dummy.matrix);

                this.scene.add(mesh);
            }
        });

        const wire = extractMeshes(ModelLoader.Models["cableWind"], envMap, false);
        wire.scale.set(.2,.25,.2);
        wire.translateY(112);
        wire.translateZ(80);
        wire.translateX(490);
        wire.updateMatrix();
        let mat : THREE.MeshStandardMaterial = ((wire.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial);
        VerletMesh(wire.children[0] as THREE.Mesh, mat, envMap, this.verlet.DataTexture, 10000, this.verlet.VertexCount);

        this.scene.add(wire);

        const wire2 = extractMeshes(ModelLoader.Models["cableWind2"], envMap, false);
        wire2.scale.set(.2,.25,.2);
        wire2.translateY(112);
        wire2.translateZ(20);
        wire2.translateX(490);
        wire2.updateMatrix();
        mat = ((wire2.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial);
        VerletMesh(wire2.children[0] as THREE.Mesh, mat, envMap, this.verlet.DataTexture, 10000, this.verlet.VertexCount);

        this.scene.add(wire2);

        const wire3 = extractMeshes(ModelLoader.Models["cableWind2"], envMap, false);
        wire3.scale.set(.2,.35,.2);
        wire3.translateY(182);
        wire3.translateZ(20);
        wire3.translateX(490);
        wire3.updateMatrix();
        mat = ((wire3.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial);
        VerletMesh(wire3.children[0] as THREE.Mesh, mat, envMap, this.verlet2.DataTexture, 10000, this.verlet2.VertexCount);

        this.scene.add(wire3);

        const wire4 = extractMeshes(ModelLoader.Models["cableWind3"], envMap, false);
        wire4.scale.set(.2,.25,.2);
        wire4.translateY(352);
        wire4.translateZ(40);
        wire4.translateX(490);
        wire4.updateMatrix();
        mat = ((wire4.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial);
        VerletMesh(wire4.children[0] as THREE.Mesh, mat, envMap, this.verlet2.DataTexture, 10000, this.verlet2.VertexCount);

        this.scene.add(wire4);

        const wire5 = extractMeshes(ModelLoader.Models["cableWind4"], envMap, false);
        wire5.scale.set(.2,.25,.2);
        wire5.translateY(422);
        wire5.translateZ(40);
        wire5.translateX(490);
        wire5.updateMatrix();
        mat = ((wire5.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial);
        VerletMesh(wire5.children[0] as THREE.Mesh, mat, envMap, this.verlet3.DataTexture, 10000, this.verlet3.VertexCount);

        this.scene.add(wire5);


        ModelLoader.Models["cable"].scene.traverse((node) =>
        {
            // @ts-ignore
            if(node.isMesh)
            {
                const geom = (node as THREE.Mesh).geometry;
                const mat = new THREE.MeshStandardMaterial();
                mat.copy(((node as THREE.Mesh).material as THREE.MeshStandardMaterial));
    
                const mesh = new THREE.InstancedMesh(geom, mat, 9);

                for(let i = 0; i < 9; i+=3)
                {
                    const dummy : THREE.Object3D = new THREE.Object3D();
                    dummy.translateX(1200 - 1200*(i/3));
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i, dummy.matrix);

                    dummy.translateZ(53);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i+1, dummy.matrix);

                    dummy.translateZ(58.5);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i+2, dummy.matrix);
                }

                VerletMesh(mesh, mat, envMap, this.verletTop.DataTexture, 1270, this.verletTop.VertexCount)

                this.scene.add(mesh);
            }
        });

        ModelLoader.Models["cable2"].scene.traverse((node) =>
        {
            // @ts-ignore
            if(node.isMesh)
            {
                const geom = (node as THREE.Mesh).geometry;
                const mat =  ((node as THREE.Mesh).material as THREE.MeshStandardMaterial);
    
                for(let i = 0; i < 3; i++)
                {
                    const matcpy = new THREE.MeshStandardMaterial().copy(mat);
                    const mesh = new THREE.InstancedMesh(geom, matcpy, 2);

                    mesh.translateZ(19 * i);

                    const dum = new THREE.Object3D;
                    mesh.setMatrixAt(0, dum.matrix);

                    dum.translateX(-1200);
                    dum.updateMatrix();
                    mesh.setMatrixAt(1, dum.matrix);

                    VerletMesh(mesh, matcpy, envMap, this.verletConstr[i].DataTexture, 400, this.verletConstr[i].VertexCount);

                    this.scene.add(mesh);
                }
            }
        });

        this.scene.fog = new THREE.Fog(0xbbddff, 100, 13000);

        super.addBasePass(.85);

        { // SAO Pass
            this.sao = new SAOPass(this.scene, this.camera, true, true);
            this.sao.params.output = 0;
            this.sao.params.saoIntensity = 1.2;
            this.sao.params.saoScale = 3000;
            this.sao.params.saoKernelRadius = 30;
            this.sao.params.saoBlur = 1;
            this.sao.params.saoBlurRadius = 4;
            this.sao.params.saoBlurStdDev = 8;
            this.sao.params.saoBlurDepthCutoff = 0.0002;
            this.sao.params.saoBias = 1;
            this.composer.addPass(this.sao);
        }
    }

    public Render(delta : number, t : number, mouse : THREE.Vector2, mouseDelta : THREE.Vector2) : void
    {
        if(!this.valid) return;
        //ScrollY
        this.cameraPivot.position.y = lerp(this.defaultPos.y - window.scrollY*.5 + 300, this.cameraPivot.position.y, Math.exp(-2.5 * delta));

        // Angle from Mouse
        this.yAngle = lerp((mouse.x - .5) * -.08, this.yAngle, Math.exp(-1.5 * delta));
        this.xAngle = lerp((mouse.y - .5) * -.08, this.xAngle, Math.exp(-1.5 * delta));
        const q = new THREE.Quaternion().setFromAxisAngle(this.zDir.clone().cross(new Vector3(0,1,0)), this.xAngle);
        q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yAngle, 0)));
        this.cameraPivot.setRotationFromQuaternion(q);

        // BG Angle from Mouse
        this.bg.offset.y = lerp((window.scrollY*-.00001)+.1+(mouse.y-.5)*-.15, this.bg.offset.y, Math.exp(-2 * delta));
        this.bg.offset.x = lerp((mouse.x-.5)*.04, this.bg.offset.x, Math.exp(-2 * delta));

        // gravity
        const deltaY : number = window.scrollY - this.prevY;
        const gravY : number = lerp(-9.81, -deltaY*4, Math.max(Math.min(Math.abs(deltaY)*.05, 1), 0));
        const gravity = this.first? new THREE.Vector3(0,0,0) : new THREE.Vector3(0, gravY, 0);

        this.prevY = window.scrollY;

        this.verlet.Compute({"deltaTime" : delta, "gravity" : gravity.multiplyScalar(.8)});
        this.verlet2.Compute({"deltaTime" : delta, "gravity" : gravity});
        this.verlet3.Compute({"deltaTime" : delta, "gravity" : gravity});
        this.verletTop.Compute({"deltaTime" : delta, "gravity" : gravity.multiplyScalar(.5)});

        const targetPos = this.verletTop.ReadData(new THREE.Vector2(.156, 0));

        for(let i = 0; i < 3; i++)
        {
            targetPos.add(new THREE.Vector3(0,0,(53 - 19)*i - (28.5*Math.max(i-1, 0))));
            this.verletConstr[i].Compute(
            {
                "deltaTime" : delta,
                "gravity" : gravity.multiplyScalar(.1),
                "tip" : targetPos
            });
        }

        this.first = false;

        super.Render(delta, t, mouse, mouseDelta);
    }

}