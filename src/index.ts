import * as THREE from "three";
import ModelLoader from "./loader/modelLoader";
import ImageLoader from "./loader/imageLoader";
import { scene1, scene2, LoadingScene } from "./scenes";

import SceneBase from "./scenes/SceneBase";

import { initRenderer } from "./util";
import { TestScene } from "./scenes/testScene";

let width : number = window.innerWidth;
let height : number = window.innerHeight;

const clock = new THREE.Clock();
let renderer : THREE.WebGLRenderer;

let scenes : SceneBase[];

let initial = true;
let render : () => void;

let mouse : THREE.Vector2 = new THREE.Vector2();
let mouseDelta : THREE.Vector2 = new THREE.Vector2();

let test : TestScene;
let loading : LoadingScene;

window.addEventListener("FileLoaded", () =>
{
    if(!ModelLoader.isComplete || !ImageLoader.isComplete) return;
    
    scenes = [new scene2(renderer), new scene1(renderer)];
    OnResize();

    initial = false;

    console.log("Loading Comlete");
    loading.transition = true;
});

window.addEventListener("DOMContentLoaded", () => 
{
    renderer = initRenderer();

    new ModelLoader();
    new ImageLoader();

    test = new TestScene(renderer);
    loading = new LoadingScene(renderer);

    // strict fps
    let f = 0;
    render = () : void => 
    {
        requestAnimationFrame(render);
        f++; if(f%2==0)return;
        const delta = clock.getDelta();

        if(!initial)
        {
            scenes.forEach(scene =>
            {
                scene.Render(delta, 0, mouse, mouseDelta);
                renderer.clearDepth();
            });
        }

        const completion = (ModelLoader.LoadCounter + ImageLoader.LoadCounter) / (ModelLoader.PathCount + ImageLoader.PathCount);
        loading.Render(delta, 0, completion, mouse, mouseDelta);
    }

    render();
    width = window.innerWidth;
    height = window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
});

const OnResize = () => 
{
    loading.Resize();
    
    if(!initial)
        scenes.forEach(s => s.Resize());

    //loading.valid = false;
}

window.addEventListener('mousemove', e => 
{
    const pos = new THREE.Vector2(e.clientX, e.clientY).divide(new THREE.Vector2(width, height));
    mouseDelta = mouse.sub(pos);
    mouse = pos;
});

window.addEventListener("resize", OnResize);