import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader";

import { ToneMapShader } from "../shaders/toneMapShader";
import { TransitionShader } from "../shaders/transitionShader";

export default class SceneBase
{
    private renderTarget : THREE.WebGLRenderTarget;

    protected renderer : THREE.WebGLRenderer;
    protected composer : EffectComposer;

    protected scene : THREE.Scene;
    protected camera : THREE.PerspectiveCamera;

    protected renderPass : RenderPass;
    protected fxaaPass : ShaderPass;
    protected tonePass : ShaderPass;
    protected vignettePass : ShaderPass;
    protected transitionPass : ShaderPass;

    public valid : boolean;

    private beforeRender : boolean;

    constructor(renderer : THREE.WebGLRenderer)
    {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.valid = false;

        this.beforeRender = true;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const parameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: true
        };

        this.renderTarget = new THREE.WebGLRenderTarget(width, height, parameters);

        this.composer = new EffectComposer(this.renderer, this.renderTarget);
    }

    protected addBasePass(exposure : number) : void
    {
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.renderPass.clearColor = new THREE.Color(0,0,0);
        this.renderPass.clearAlpha = 0;
        this.composer.addPass(this.renderPass);

        this.tonePass = new ShaderPass(ToneMapShader);
        this.tonePass.material.uniforms[ "exposure" ].value = exposure;
        this.composer.addPass(this.tonePass);

        this.fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = this.renderer.getPixelRatio();

        this.fxaaPass.material.uniforms[ "resolution" ].value.x = 1 / ( window.innerWidth * pixelRatio );
        this.fxaaPass.material.uniforms[ "resolution" ].value.y = 1 / ( window.innerHeight * pixelRatio );
        this.composer.addPass(this.fxaaPass);

        this.vignettePass = new ShaderPass(VignetteShader);
        this.vignettePass.material.uniforms["offset"].value = .8;
        this.vignettePass.material.uniforms["darkness"].value = .65;
        this.composer.addPass(this.vignettePass);

        this.transitionPass = new ShaderPass(TransitionShader);
        this.transitionPass.material.uniforms["t"].value = 0;
        this.transitionPass.material.transparent = true;
    }

    protected set exposure(exposure : number)
    {
        this.tonePass.material.uniforms[ "exposure" ].value = Math.max(exposure, 0);
    }

    public Render(delta : number, t : number) : void
    {
        if(this.beforeRender)
        {
            this.composer.addPass(this.transitionPass);
            this.beforeRender = false;
        }
        this.transitionPass.material.uniforms["t"].value = t;

        this.composer.render(delta);
    }

    public Resize() : void
    {    
        const width = window.innerWidth;
        const height = window.innerHeight;

        const pixelRatio = window.devicePixelRatio
    
        this.composer.setSize(width, height);
        this.composer.setPixelRatio(pixelRatio);
    
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.fxaaPass.material.uniforms[ "resolution" ].value.x = 1 / ( window.innerWidth * pixelRatio );
        this.fxaaPass.material.uniforms[ "resolution" ].value.y = 1 / ( window.innerHeight * pixelRatio );
    }

    public get RenderTarget() : THREE.WebGLRenderTarget
    {
        return this.composer.writeBuffer;
    }
}