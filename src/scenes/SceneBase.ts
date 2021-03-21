import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";

import { initRenderer } from "./../util";
import { ToneMapShader } from "../shaders/toneMapShader";

export default class SceneBase
{
    protected renderer : THREE.WebGLRenderer;
    protected composer : EffectComposer;

    protected scene : THREE.Scene;
    protected camera : THREE.PerspectiveCamera;

    private fxaaPass : ShaderPass;
    protected tonePass : ShaderPass;

    public valid : boolean;

    constructor()
    {
        this.renderer = initRenderer();
        this.scene = new THREE.Scene();
        this.valid = false;

        this.composer = new EffectComposer(this.renderer);
    }

    protected addBasePass(exposure : number) : void
    {
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.tonePass = new ShaderPass(ToneMapShader);
        this.tonePass.material.uniforms[ "exposure" ].value = exposure;
        this.composer.addPass(this.tonePass);

        this.fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = this.renderer.getPixelRatio();

        this.fxaaPass.material.uniforms[ "resolution" ].value.x = 1 / ( window.innerWidth * pixelRatio );
        this.fxaaPass.material.uniforms[ "resolution" ].value.y = 1 / ( window.innerHeight * pixelRatio );
        this.composer.addPass(this.fxaaPass);
    }

    protected set exposure(exposure : number)
    {
        this.tonePass.material.uniforms[ "exposure" ].value = Math.max(exposure, 0);
    }

    public Render(delta? : number) : void
    {
        //this.renderer.render(this.scene, this.camera);
        this.composer.render();
    }

    public Resize() : void
    {    
        const width = window.innerWidth;
        const height = window.innerHeight;

        const pixelRatio = window.devicePixelRatio
    
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(pixelRatio);
    
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();  

        this.fxaaPass.material.uniforms[ "resolution" ].value.x = 1 / ( window.innerWidth * pixelRatio );
        this.fxaaPass.material.uniforms[ "resolution" ].value.y = 1 / ( window.innerHeight * pixelRatio );
    }
}