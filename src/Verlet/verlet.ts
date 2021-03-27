import * as THREE from "three";
import { GPUComputationRenderer, Variable } from "three/examples/jsm/misc/GPUComputationRenderer";

import verletPtShader from "../shaders/verletPt.glsl";
import verletConstrShader from "../shaders/verletConstr.glsl";
import verletBendConstrShader from "../shaders/verletBendConstr.glsl";

import readRenderTargetShader from "../shaders/readRenderTarget.glsl";

const perInstanceHeight = 2;

class VerletSimulator
{
    private width : number;
    private height : number;

    private subStep : number;

    private isClose : boolean;

    private rootConstr : boolean;
    private tipConstr : boolean;

    private gpuComputePt : GPUComputationRenderer;
    private renderer : THREE.WebGLRenderer;

    private verletPtVariable : Variable;
    private verletConstrVariable : Variable;
    private verletBendConstrVariable : Variable;

    public verletPtUniform : {[uniform : string] : THREE.IUniform};
    public verletConstrUniform : {[uniform : string] : THREE.IUniform};
    public verletBendConstrUniform : {[uniform : string] : THREE.IUniform};

    private readConstrShader;
    private readConstrData : Uint8Array;
    private readRenderTarget : THREE.WebGLRenderTarget;

    constructor(vertexCount : number, instanceCount : number, subStep : number, close : boolean, root : boolean, tip : boolean)
    {
        this.width = vertexCount;
        this.height = perInstanceHeight * instanceCount;
        this.subStep = subStep;
        this.isClose = close;
        this.rootConstr = root;
        this.tipConstr = tip;
    }

    protected initSimulator(renderer : THREE.WebGLRenderer, data : THREE.Vector3[], pinFunc? : (index : number, pos : THREE.Vector3) => boolean)
    {
        this.renderer = renderer;
        this.gpuComputePt = new GPUComputationRenderer(this.width, this.height, this.renderer);

        const computeTexture = this.gpuComputePt.createTexture();
        this.initTextureData(computeTexture, data, pinFunc);

        this.verletPtVariable = this.gpuComputePt.addVariable("textureVerlet", verletPtShader, computeTexture);
        this.gpuComputePt.setVariableDependencies(this.verletPtVariable, [this.verletPtVariable]);

        this.verletConstrVariable = this.gpuComputePt.addVariable("textureVerlet", verletConstrShader, computeTexture);
        this.gpuComputePt.setVariableDependencies(this.verletConstrVariable, [this.verletPtVariable]);

        this.verletBendConstrVariable = this.gpuComputePt.addVariable("textureVerlet", verletBendConstrShader, computeTexture);
        this.gpuComputePt.setVariableDependencies(this.verletBendConstrVariable, [this.verletConstrVariable]);

        const ground = -400.0;
        const groundFriction = .75;

        this.verletPtUniform = this.verletPtVariable.material.uniforms;
        this.verletPtUniform["deltaTime"] = { value : 0.0 };
        this.verletPtUniform["subStep"] = { value : this.subStep - 1 };
        this.verletPtUniform["currentStep"] = { value : 0 };
        this.verletPtUniform["ground"] = { value : ground };
        this.verletPtUniform["gravity"] = { value : new THREE.Vector3(0,-9.81,0) };
        this.verletPtUniform["groundFriction"] = { value : groundFriction };
        this.verletPtUniform["IView"] = { value : new THREE.Matrix4() };
        this.verletPtUniform["IProj"] = { value : new THREE.Matrix4() };
        this.verletPtUniform["mouse"] = { value : new THREE.Vector2() };
        this.verletPtUniform["mouseDelta"] = { value : new THREE.Vector2() };
        this.verletPtUniform["mousePressed"] = { value : false };
        this.verletPtUniform["root"] = { value : data[0] };
        this.verletPtUniform["tip"] = { value : data[this.width-1] };
        this.verletPtUniform["rotConstraint"] = { value : this.rootConstr };
        this.verletPtUniform["tipConstraint"] = { value : this.tipConstr };

        this.verletConstrUniform = this.verletConstrVariable.material.uniforms;
        this.verletConstrUniform["stretchStiffness"] = { value : .96 };
        this.verletConstrUniform["structureStiffness"] = { value : .3};
        this.verletConstrUniform["ground"] = { value : ground };
        this.verletConstrUniform["groundFriction"] = { value : groundFriction };

        this.verletBendConstrUniform = this.verletBendConstrVariable.material.uniforms;
        this.verletBendConstrUniform["bendStiffness"] = { value : .01 };
        this.verletBendConstrUniform["ground"] = { value : ground };
        this.verletBendConstrUniform["groundFriction"] = { value : groundFriction };

        if(this.isClose)
        {
            this.verletPtVariable.wrapS = THREE.RepeatWrapping;
            this.verletConstrVariable.wrapS = THREE.RepeatWrapping;
            this.verletBendConstrVariable.wrapS = THREE.RepeatWrapping;
        }
        else
        {
            this.verletPtVariable.wrapS = THREE.ClampToEdgeWrapping;
            this.verletConstrVariable.wrapS = THREE.ClampToEdgeWrapping;
            this.verletBendConstrVariable.wrapS = THREE.ClampToEdgeWrapping;
        }

        this.verletPtVariable.minFilter = THREE.LinearFilter;
        this.verletPtVariable.magFilter = THREE.LinearFilter;
        this.verletConstrVariable.minFilter = THREE.LinearFilter;
        this.verletConstrVariable.magFilter = THREE.LinearFilter;
        this.verletBendConstrVariable.minFilter = THREE.LinearFilter;
        this.verletBendConstrVariable.magFilter = THREE.LinearFilter;

        // @ts-ignore
        this.readConstrShader = this.gpuComputePt.createShaderMaterial( readRenderTargetShader, 
        {
            point: { value: new THREE.Vector2() },
            DataTexture: { value: null }
        } );

        this.readConstrData = new Uint8Array(4 * 1 * 4);
        this.readRenderTarget = new THREE.WebGLRenderTarget(4, 1,
        {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            depthBuffer: false
        });

        const error = this.gpuComputePt.init();

        if(error != null) console.error(error);
    }

    private initTextureData(texture : THREE.DataTexture, data : THREE.Vector3[], pinFunc : (index : number, pos : THREE.Vector3) => boolean = (i,p) : boolean => false)
    {
        const texArray = texture.image.data;
        const w = this.width * 4;

        const restLengthScale = 1.;

        for(let i = 0; i < this.width; i++)
        {
            const idx = i * 4;
            const position = data[i];

            /* --- position --- */
            // x
            texArray[idx + 0 + 0] = position.x;
            texArray[idx + 0 + w] = position.x;

            // y
            texArray[idx + 1 + 0] = position.y;
            texArray[idx + 1 + w] = position.y;

            // z
            texArray[idx + 2 + 0] = position.z;
            texArray[idx + 2 + w] = position.z;

            const next = data[close ? (i + 1) % this.width : Math.min(i+1,this.width)];
            const prev = data[close ? (this.width + i - 1) % this.width : Math.max(i-1,0)];

            /* --- restAngle --- */
            const centroid = position.clone().add(next).add(prev).divideScalar(3);
            texArray[idx + 3 + 0] = Math.max(position.distanceTo(centroid), 2) * (pinFunc(i, position) ? -1 : 1);

            /* --- restLength --- */
            // To Next Vertex
            texArray[idx + 3 + w] = position.distanceTo(next) * restLengthScale;
        }
    }

    public Compute(data : 
    { 
        deltaTime : number, IView? : THREE.Matrix4, IProj? : THREE.Matrix4,
        mouse? : THREE.Vector2, mouseDelta? : THREE.Vector2, mousePressed? : boolean,
        gravity? : THREE.Vector3, root? : THREE.Vector3, tip? : THREE.Vector3
    }) : void
    {
        for(const key in data)
            this.verletPtUniform[key].value = data[key];

        this.gpuComputePt.setVariableDependencies(this.verletConstrVariable, [this.verletPtVariable]);
        this.gpuComputePt.setVariableDependencies(this.verletBendConstrVariable, [this.verletConstrVariable]);
        this.gpuComputePt.setVariableDependencies(this.verletPtVariable, [this.verletBendConstrVariable]);
        for(let i = 0; i < this.subStep; i++)
        {
            this.verletPtUniform["currentStep"].value = i;
            this.gpuComputePt.compute();
        }
    }

    public get VertexCount() : number
    {
        return this.width;
    }

    public get DataTexture() : THREE.Texture
    {
        // @ts-ignore
        return this.gpuComputePt.getCurrentRenderTarget(this.verletPtVariable).texture;
    }

    public get RendeTarget() : THREE.RenderTarget
    {
        return this.gpuComputePt.getCurrentRenderTarget(this.verletPtVariable);
    }

    public ReadData(position : THREE.Vec2) : THREE.Vector3
    {
        this.readConstrShader.uniforms[ "DataTexture" ].value = this.DataTexture;
        this.readConstrShader.uniforms[ "point" ].value = position;
        this.gpuComputePt.doRenderTarget( this.readConstrShader, this.readRenderTarget );

        this.renderer.readRenderTargetPixels( this.readRenderTarget, 0, 0, 4, 1, this.readConstrData );

        const pixels = new Float32Array(this.readConstrData.buffer);

        return new THREE.Vector3(pixels[0], pixels[1], pixels[2]);
    }
}

export class VerletfromCurve extends VerletSimulator
{
    constructor(curve : THREE.Curve<THREE.Vector3>,
                sample : number, renderer : THREE.WebGLRenderer, substep : number = 30,
                close : boolean = true, root : boolean = false, tip : boolean = false,
                pinFunc? : (index : number, pos : THREE.Vector3) => boolean)
    {
        super(sample, 1, substep, close, root, tip); 

        const posArray = curve.getPoints(sample);
        this.initSimulator(renderer, posArray, pinFunc);
    }
}

export class VerletfromLine extends VerletSimulator
{
    constructor(renderer : THREE.WebGLRenderer, sample : number, substep : number = 30,
                length : number = 100, root : THREE.Vector3 = new THREE.Vector3(),
                up : THREE.Vector3 = new THREE.Vector3(0,1,0), close : boolean = true,
                rootConstr : boolean = false, tipConstr : boolean = false,
                pinFunc? : (index : number, pos : THREE.Vector3) => boolean)
    {
        super(sample, 1, substep, close, rootConstr, tipConstr); 

        up.normalize();

        const posArray : THREE.Vector3[] = new Array(sample);
        posArray[0] = root;
        for(let i = 1; i < sample; i++)
        {
            const pos = new THREE.Vector3().copy(posArray[i - 1]);
            pos.add(new THREE.Vector3().copy(up).multiplyScalar(length / (sample-1)));
            posArray[i] = pos;
        }

        this.initSimulator(renderer, posArray, pinFunc);
    }
}

export class VerletfromArray extends VerletSimulator
{
    constructor(renderer : THREE.WebGLRenderer, substep : number = 30,
                posArray : THREE.Vector3[], close : boolean = true,
                rootConstr : boolean = false, tipConstr : boolean = false,
                pinFunc? : (index : number, pos : THREE.Vector3) => boolean)
    {
        super(posArray.length, 1, substep, close, rootConstr, tipConstr); 

        this.initSimulator(renderer, posArray, pinFunc);
    }
}