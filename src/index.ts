import * as THREE from "three";
import { Curves } from "three/examples/jsm/curves/CurveExtras";
import { VerletfromCurve } from "./Verlet/verlet";
import ModelLoader from "./loader/modelLoader";
import ImageLoader from "./loader/imageLoader";
import { scene1 } from "./scenes";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import parallelTransport from "./shaders/parallelTransport.glsl";
import SceneBase from "./scenes/SceneBase";

import { lerp, initRenderer, initCamera } from "./util";

let width : number = window.innerWidth;
let height : number = window.innerHeight;

const clock = new THREE.Clock();
let renderer : THREE.WebGLRenderer;

let camera = initCamera(60);

let verletSimulator : VerletfromCurve;

let scene : THREE.Scene;

let scenes : SceneBase[];

let initial = true;

const setCustomVert = (shader : THREE.Shader) =>
{
    shader.uniforms["verletTexture"] = {value : verletSimulator.DataTexture};
    shader.uniforms["count"] = {value : verletSimulator.VertexCount};
    shader.vertexShader = "uniform sampler2D verletTexture;\n" + shader.vertexShader;
    shader.vertexShader = "uniform float count;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", parallelTransport);
}

window.addEventListener("DOMContentLoaded", () => 
{
    renderer = initRenderer();
    renderer.toneMappingExposure = .85;

    //const controls = new OrbitControls(camera, renderer.domElement);

    new ModelLoader();
    new ImageLoader();

    scene = new THREE.Scene();

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
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xffffff, .1);
    scene.add(ambient);

    const under = new THREE.PointLight(0xbbddff, .2);
    under.position.set(-350,-4000,-500);
    scene.add(under);


    const boxGeom = new THREE.BoxGeometry(300,300,300);
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(boxGeom, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    for(let i = 0; i < 5; i++)
    {
        const geo = new THREE.BoxGeometry(150, 150, 150);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.y = 500 * -(i + 1);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);
    }

    const curve = new Curves.DecoratedTorusKnot4a(150);
    verletSimulator = new VerletfromCurve(curve, 256, renderer);
    const debugPlane = new THREE.PlaneGeometry(1000, 30);
    debugPlane.translate(0, 250, 300);
    const debugMat = new THREE.MeshBasicMaterial({color:0xffffff});
    debugMat.map = verletSimulator.DataTexture;
    scene.add(new THREE.Mesh(debugPlane, debugMat));

    const tubeGeom = new THREE.CylinderGeometry(20,20,500,32,verletSimulator.VertexCount, true);
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
    scene.add(tubeMesh);

    // strict fps
    let f = 0;
    const render = () : void => 
    {
        if(!initial) return;
        requestAnimationFrame(render);
        f++; if(f%2==0)return;
        const delta = clock.getDelta();
        const k : number = 7;

        //camera.position.y = lerp(-window.scrollY, camera.position.y, Math.exp(-k * delta));

        const updateData = 
        {
            "deltaTime" : delta, "IView" : camera.matrixWorld,
            "IProj" : camera.projectionMatrixInverse
        }
        verletSimulator.Compute(updateData);

        renderer.render(scene, camera);
    }

    render();
    width = window.innerWidth;
    height = window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

window.addEventListener("FileLoaded", () =>
{
    if(!ModelLoader.isComplete || !ImageLoader.isComplete) return;
    
    const root = ModelLoader.Models["pole"].scene;
    root.translateY(0);
    root.translateX(-500);
    //root.rotateX(-3.1415*.5);
    root.traverse((node) =>
    {
        node.castShadow = true;
        node.receiveShadow = true;
        // @ts-ignore
        if(node.isMesh){
            /*
            const mat : THREE.Material = (node as THREE.Mesh).material as THREE.Material;
            mat.defines = mat.defines || {};
            mat.defines["USE_CUSTOM_MODEL"] = 1;
            mat.onBeforeCompile = setCustomVert;
            (node as THREE.Mesh).material = mat;
            const depthMat = new THREE.MeshDepthMaterial({ depthPacking : THREE.RGBADepthPacking });
            const distMat = new THREE.MeshDistanceMaterial();
            depthMat.defines = depthMat.defines || {};
            depthMat.defines["MAT_NO_NEED_NORMAL"] = 1;
            depthMat.defines["USE_CUSTOM_MODEL"] = 1;
            distMat.defines = distMat.defines || {};
            distMat.defines["MAT_NO_NEED_NORMAL"] = 1;
            distMat.defines["USE_CUSTOM_MODEL"] = 1

            depthMat.onBeforeCompile = setCustomVert
            distMat.onBeforeCompile = setCustomVert;
        
            node.customDepthMaterial = depthMat;
            node.customDistanceMaterial = distMat;
            */
        }
    })

    scene.add(root);
    
    scenes = [new scene1()];
    OnResize();

    // strict fps
    let f = 0;
    
    const renderScenes = () : void => 
    {
        requestAnimationFrame(renderScenes);
        f++; if(f%2==0)return;
        const delta = clock.getDelta();
        const k : number = 7;

        //camera.position.y = lerp(-window.scrollY, camera.position.y, Math.exp(-k * delta));

        scenes[0].Render(delta);
    }
    initial = false;
    renderScenes();
});

const OnResize = () => 
{
    width = window.innerWidth;
    height = window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    scenes.forEach(s => s.Resize());
}

window.addEventListener("resize", OnResize);