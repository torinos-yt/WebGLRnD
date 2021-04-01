import * as THREE from "three";
import LoadingShader from "../shaders/loading.glsl";
import { LoadingTransitionShader } from "../shaders/loadingTransitionShader";
import { lerp, lerpVec2, rawVertexShader } from "../util";
import { RawShaderMaterial } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

export class LoadingScene
{
    private renderer : THREE.WebGLRenderer;

    private scene : THREE.Scene;
    private camera : THREE.OrthographicCamera;

    public transition : boolean = false;
    public transitionStart : boolean = true;
    private transitionTime : number = 0;
    private transitionLength : number = .65;

    private composer : EffectComposer;

    private transitionPass : ShaderPass;

    private material : THREE.RawShaderMaterial;
    private loadBarMaterial : THREE.RawShaderMaterial;
    private CaptionMaterial : RawShaderMaterial;

    private loadBar : THREE.Mesh;
    private captionMesh : THREE.Mesh;

    public valid : boolean;

    private time : number = 0;
    private imageLoadtime : number = 0;
    private completion : number = 0;

    private loadTime : number = 8.0;

    private mouse : THREE.Vector2 = new THREE.Vector2();

    constructor(renderer : THREE.WebGLRenderer)
    {
        this.renderer = renderer;
        this.valid = true;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const parameters = 
        {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: true
        };

        const renderTarget = new THREE.WebGLRenderTarget(width, height, parameters);

        this.composer = new EffectComposer(this.renderer, renderTarget);

        const quad = new THREE.PlaneBufferGeometry(2,2);
        this.material = new THREE.RawShaderMaterial(
            {
                vertexShader : rawVertexShader,
                fragmentShader : LoadingShader,
                uniforms : 
                {
                    t : { value : 0 },
                    aspect : { value : width / height },
                    completion : { value : 0 },
                    mouse : { value : new THREE.Vector2 }
                },
                side : THREE.DoubleSide,
                transparent : true
            }
        );

        const mesh = new THREE.Mesh(quad, this.material);
        this.scene.add(mesh);

        const loadQuad = new THREE.PlaneBufferGeometry(.42*.7,.075*.7);
        this.loadBarMaterial = new THREE.RawShaderMaterial(
            {
                vertexShader : rawVertexShader,
                fragmentShader : 
                [
                    "precision highp float;",
                    "float sdBox( in vec2 p, in vec2 b )",
                    "{",
                    "    vec2 d = abs(p)-b;",
                    "    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);",
                    "}",
                    "uniform float t;",
                    "uniform float completion;",
                    "varying vec2 vUv;",
                    "void main() ",
                    "{",
                    "    float compl = completion>vUv.x? 1. : 0.;",
                    "    float rect = sdBox(vUv-vec2(.5), vec2(.48*1.032, .48));",
                    "    float rect2 = sdBox(vUv-vec2(.5), vec2(.44*1.11, .44));",
                    "    compl *= rect2 > 0. ? 0. : 1.;",
                    "    compl = max(rect < 0.? 0. : 1., compl);",
                    "    gl_FragColor = vec4(vec3(compl*.85), compl);",
                    "}"
                ].join("\n"),
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

        this.loadBar = new THREE.Mesh(loadQuad, this.loadBarMaterial);
        this.loadBar.scale.y = width / height;
        this.loadBar.position.y = .065;
        this.scene.add(this.loadBar);

        const captionQuad = new THREE.PlaneBufferGeometry(.42*.5,.075*.33);
        this.CaptionMaterial = new RawShaderMaterial(
            {
                vertexShader : rawVertexShader,
                fragmentShader : 
                [
                    "precision highp float;",
                    "uniform sampler2D tex;",
                    "uniform float completion;",
                    "varying vec2 vUv;",
                    "uniform float t;",
                    "float gain(float x, float k) ",
                    "{",
                    "    float a = 0.5*pow(2.0*((x<0.5)?x:1.0-x), k);",
                    "    return (x<0.5)?a:1.0-a;",
                    "}",
                    "void main() ",
                    "{",
                    "    float grid = floor(vUv.x * 9.0) / 9.0;",
                    "    float oy = clamp(grid*.65 +.9 - t, 0., 1.);",
                    "    vec2 off = vec2(0., gain(oy, 9.));",
                    "    gl_FragColor = texture2D(tex, vUv + off);",
                    "}"
                ].join("\n"),
                uniforms : 
                {
                    tex : { value : null},
                    t : { value : 0 },
                    aspect : { value : width / height },
                    completion : { value : 0 }
                },
                side : THREE.DoubleSide,
                transparent : true
            }
        );

        this.captionMesh = new THREE.Mesh(captionQuad, this.CaptionMaterial);
        this.captionMesh.translateY(-.035);
        this.captionMesh.translateX(-.001);
        this.captionMesh.scale.y = width / height;
        this.scene.add(this.captionMesh);

        const path = "../public/textures/top_serif.png";
        new THREE.TextureLoader().load(path, (tex) =>
        {
            this.CaptionMaterial.uniforms["tex"].value = tex;
            this.imageLoadtime = this.time;
        });

        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.transitionPass = new ShaderPass(LoadingTransitionShader);
        this.transitionPass.material.uniforms["aspect"].value = width / height;
        this.transitionPass.material.transparent = true;
        this.composer.addPass(this.transitionPass);
    }

    public Render(delta : number, t : number, comp : number, mouse : THREE.Vector2, mouseDelta : THREE.Vector2) : void
    {
        if(!this.valid) return;
        this.time += delta;
        this.completion = lerp(comp, this.completion, Math.exp(-1.*delta));
        const completionTime = Math.min(this.completion, this.time / this.loadTime);

        this.mouse = lerpVec2(mouse, this.mouse, Math.exp(-4. * delta));

        this.material.uniforms["t"].value = this.time;
        this.material.uniforms["completion"].value = this.completion;
        this.material.uniforms["mouse"].value = this.mouse;

        this.loadBarMaterial.uniforms["t"].value = this.time;
        this.loadBarMaterial.uniforms["completion"].value = completionTime;

        this.CaptionMaterial.uniforms["t"].value = this.imageLoadtime==0? 0 : this.time- this.imageLoadtime;

        if(this.transition && completionTime >= .996)
        {
            if(this.transitionStart)
            {
                window.scrollTo(0, 700);
                this.transitionStart = false;
            }
            this.transitionTime += delta;
        }

        this.captionMesh.translateY(this.transitionTime*.04);
        this.loadBar.translateY(this.transitionTime*.04);

        this.transitionPass.material.uniforms["t"].value = this.transitionTime / this.transitionLength;

        this.composer.render();
    }

    public Resize()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;
    
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        const aspect = width / height;

        this.loadBar.scale.y = aspect;
        this.captionMesh.scale.y = aspect;

        this.material.uniforms["aspect"].value = aspect;
        this.transitionPass.material.uniforms["aspect"].value = aspect;
    }
}