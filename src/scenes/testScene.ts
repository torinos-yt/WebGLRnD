import * as THREE from "three";
import { Curves } from "three/examples/jsm/curves/CurveExtras";

import { VerletfromCurve } from "../Verlet/verlet";
import { lerp, initCamera } from "../util";

import parallelTransport from "../shaders/parallelTransport.glsl";

export class TestScene
{

    private renderer : THREE.WebGLRenderer;

    private scene : THREE.Scene;
    private camera : THREE.PerspectiveCamera;

    private verletSimulator : VerletfromCurve;

    private Mesh : THREE.Mesh;

    public valid : boolean;

    constructor(renderer : THREE.WebGLRenderer)
    {   
        this.renderer = renderer;
        this.valid = true;

        this.camera = initCamera(60);
        this.scene = new THREE.Scene();

        const light = new THREE.DirectionalLight(0xffffff, 1);
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
        light.shadow.bias = -.003;
        light.shadow.normalBias = -.003;
        this.scene.add(light);

        const ambient = new THREE.AmbientLight(0xffffff, .1);
        this.scene.add(ambient);
    
        const under = new THREE.PointLight(0xbbddff, .2);
        under.position.set(-350,-4000,-500);
        this.scene.add(under);

        const boxGeom = new THREE.BoxGeometry(300,300,300);
        const material = new THREE.MeshStandardMaterial();
        const mesh = new THREE.Mesh(boxGeom, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
    
        this.Mesh = mesh;
    
        for(let i = 0; i < 5; i++)
        {
            const geo = new THREE.BoxGeometry(150, 150, 150);
            const mesh = new THREE.Mesh(geo, material);
            mesh.position.y = 500 * -(i + 1);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
    
            this.scene.add(mesh);
        }

        const setCustomVert = (shader : THREE.Shader) =>
        {
            shader.uniforms["verletTexture"] = {value : this.verletSimulator.DataTexture};
            shader.uniforms["count"] = {value : this.verletSimulator.VertexCount};
            shader.uniforms["instanceCount"] = {value : 1};
            shader.uniforms["iid"] = {value : 0};
            shader.uniforms["boundY"] = {value : 1290};
            shader.vertexShader = "uniform sampler2D verletTexture;\n" + shader.vertexShader;
            shader.vertexShader = "uniform float count;\n" + shader.vertexShader;
            shader.vertexShader = "uniform float instanceCount;\n" + shader.vertexShader;
            shader.vertexShader = "uniform float iid;\n" + shader.vertexShader;
            shader.vertexShader = "uniform float boundY;\n" + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", parallelTransport);
        }
    
        const curve = new Curves.DecoratedTorusKnot4a(150);
        this.verletSimulator = new VerletfromCurve(curve, 128, renderer, 30);
        const debugPlane = new THREE.PlaneGeometry(1000, 30);
        debugPlane.translate(0, 250, 300);
        const debugMat = new THREE.MeshBasicMaterial({color:0xffffff});
        debugMat.map = this.verletSimulator.DataTexture;
        this.scene.add(new THREE.Mesh(debugPlane, debugMat));
    
        const tubeGeom = new THREE.CylinderGeometry(20,20,500,32,this.verletSimulator.VertexCount, true);
        const tubeMat = new THREE.MeshStandardMaterial({color:0x999999, wireframe:false});
        
        tubeMat.onBeforeCompile = setCustomVert;
        const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
        tubeMesh.translateX(450);
        tubeMesh.translateY(200);
        tubeMesh.receiveShadow = true;
        tubeMesh.castShadow = true;
    
        const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
        const distMat = new THREE.MeshDistanceMaterial();
        depthMat.defines = depthMat.defines || { MAT_NO_NEED_NORMAL : 1 };
        distMat.defines = distMat.defines || { MAT_NO_NEED_NORMAL : 1 };
    
        depthMat.onBeforeCompile = setCustomVert;
        distMat.onBeforeCompile = setCustomVert;
    
        tubeMesh.customDepthMaterial = depthMat;
        tubeMesh.customDistanceMaterial = distMat;
        this.scene.add(tubeMesh);
    }

    public Render(delta : number) : void
    {
        if(!this.valid) return;

        const k : number = 7;

        this.camera.position.y = lerp(-window.scrollY, this.camera.position.y, Math.exp(-k * delta));

        this.Mesh.rotateX(.5 * delta);
        this.Mesh.rotateY(.8 * delta);
        this.Mesh.rotateZ(.3 * delta);

        const updateData = 
        {
            "deltaTime" : delta, "IView" : this.camera.matrixWorld,
            "IProj" : this.camera.projectionMatrixInverse,
        }
        this.verletSimulator.Compute(updateData);

        this.renderer.render(this.scene, this.camera);
    }

    public Resize()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;
    
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
}