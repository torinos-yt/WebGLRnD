import * as THREE from "three";
import LoadingShader from "../shaders/loading.glsl";
import { lerp } from "../util";

export class LoadingScene
{
    private renderer : THREE.WebGLRenderer;

    private scene : THREE.Scene;
    private camera : THREE.OrthographicCamera;

    private material : THREE.RawShaderMaterial;

    public valid : boolean;

    private time : number = 0;
    private completion : number = 0;

    private loadTime : number = 5.0;

    constructor(renderer : THREE.WebGLRenderer)
    {
        this.renderer = renderer;
        this.valid = true;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const quad = new THREE.PlaneBufferGeometry(2,2);
        this.material = new THREE.RawShaderMaterial(
            {
                vertexShader : 
                [
                    "precision mediump float;",
                    "uniform mat4 modelViewMatrix;",
                    "uniform mat4 projectionMatrix;",
                    "attribute vec3 position;",
                    "attribute vec2 uv;",
                    "varying vec2 vUv;",
                    "void main(){",
                    "   vUv = uv;",
                    "   gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);",
                    "}"
                ].join("\n"),
                fragmentShader : LoadingShader,
                uniforms : 
                {
                    t : { value : 0 },
                    aspect : { value : width / height },
                    completion : { value : 0 }
                },
                side : THREE.DoubleSide,
                transparent : true
            }
        );

        const mesh = new THREE.Mesh(quad, this.material);
        this.scene.add(mesh);
    }

    public Render(delta : number, t : number, comp : number, mouse : THREE.Vector2, mouseDelta : THREE.Vector2) : void
    {
        if(!this.valid) return;
        this.time += delta;
        this.completion = lerp(comp, this.completion, Math.exp(-1.*delta));

        this.material.uniforms["t"].value = this.time;
        this.material.uniforms["completion"].value = this.completion

        this.renderer.render(this.scene, this.camera);
    }

    public Resize()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;
    
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.material.uniforms["aspect"].value = width / height;
    }
}