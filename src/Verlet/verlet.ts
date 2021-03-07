import * as THREE from "three";
import { GPUComputationRenderer, Variable } from "three/examples/jsm/misc/GPUComputationRenderer";

import verletPtShader from "../shaders/verletPt.glsl";
import verletConstrShader from "../shaders/verletConstr.glsl";
import { Vector3 } from "three";

const perInstanceHeight = 3;
const subStep = 50;

type Uniforms = 
{ 
    deltaTime : number, IView? : THREE.Matrix4, IProj? : THREE.Matrix4,
    mouse? : THREE.Vector2, mouseDelta? : THREE.Vector2, mousePressed? : boolean
}

class VerletSimulator
{
    private width : number;
    private height : number;

    private gpuComputePt : GPUComputationRenderer;
    private gpuComputeConstr : GPUComputationRenderer;

    private verletPtVariable : Variable;
    private verletConstrVariable : Variable;

    public verletPtUniform : {[uniform : string] : THREE.IUniform};
    public verletConstrUniform : {[uniform : string] : THREE.IUniform};

    constructor(vertexCount : number, instanceCount : number)
    {
        this.width = vertexCount;
        this.height = perInstanceHeight * instanceCount;
    }

    protected initSimulator(renderer : THREE.WebGLRenderer, data : THREE.Vector3[], pinFunc? : (index : number, pos : THREE.Vector3) => number)
    {
        this.gpuComputePt = new GPUComputationRenderer(this.width, this.height, renderer);
        this.gpuComputeConstr = new GPUComputationRenderer(this.width, this.height, renderer);

        const computeTexture = this.gpuComputePt.createTexture();
        this.initTextureData(computeTexture, data, pinFunc);

        this.verletPtVariable = this.gpuComputePt.addVariable("textureVerlet", verletPtShader, computeTexture);
        this.gpuComputePt.setVariableDependencies(this.verletPtVariable, [this.verletPtVariable]);

        this.verletConstrVariable = this.gpuComputePt.addVariable("textureVerlet", verletConstrShader, computeTexture);
        this.gpuComputeConstr.setVariableDependencies(this.verletConstrVariable, [this.verletConstrVariable]);

        const ground = -400.0;
        const groundFriction = .75;

        this.verletPtUniform = this.verletPtVariable.material.uniforms;
        this.verletPtUniform["deltaTime"] = { value : 0.0 };
        this.verletPtUniform["ground"] = { value : ground };
        this.verletPtUniform["groundFriction"] = { value : groundFriction };
        this.verletPtUniform["gravity"] = { value : new THREE.Vector3(0,-9.81*10,0) };
        this.verletPtUniform["IView"] = { value : new THREE.Matrix4() };
        this.verletPtUniform["IProj"] = { value : new THREE.Matrix4() };
        this.verletPtUniform["mouse"] = { value : new THREE.Vector2() };
        this.verletPtUniform["mouseDelta"] = { value : new THREE.Vector2() };
        this.verletPtUniform["mousePressed"] = { value : false };

        this.verletPtVariable.wrapS = THREE.RepeatWrapping;

        this.verletConstrUniform = this.verletConstrVariable.material.uniforms;
        this.verletConstrUniform["stretchStiffness"] = { value : 1.5 };
        this.verletConstrUniform["structureStiffness"] = { value : .3};
        this.verletConstrUniform["ground"] = { value : ground };
        this.verletConstrUniform["groundFriction"] = { value : groundFriction };

        this.verletConstrVariable.wrapS = THREE.RepeatWrapping;

        const error = this.gpuComputePt.init();

        if(error != null) console.error(error);
    }

    private initTextureData(texture : THREE.DataTexture, data : THREE.Vector3[], pinFunc : (index : number, pos : THREE.Vector3) => number = (i,p) : number => 0)
    {
        const texArray = texture.image.data;
        const w = this.width * 4;
        const offset = Math.floor(this.width / 4.0);

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

            // w
            texArray[idx + 3 + 0] = pinFunc(i, position);
            texArray[idx + 3 + w] = 1;

            /* --- restLength --- */
            // To Next Vertex
            const next = data[(i + 1) % this.width];
            texArray[idx + 0 + w * 2] = position.distanceTo(next) * restLengthScale;

            // To Offseted Vertex 1
            const offsetPos1 = data[((i + offset) % this.width)]
            texArray[idx + 1 + w * 2] = position.distanceTo(offsetPos1) * restLengthScale;

            // To Offseted Vertex 2
            const offsetPos2 = data[((i + offset * 2) % this.width)]
            texArray[idx + 2 + w * 2] = position.distanceTo(offsetPos2) * restLengthScale;
            
            // To Offseted Vertex 3
            const offsetPos3 = data[((i + offset * 3) % this.width)]
            texArray[idx + 3 + w * 2] = position.distanceTo(offsetPos3) * restLengthScale;
        }
    }

    public Compute(data : 
    { 
        deltaTime : number, IView? : THREE.Matrix4, IProj? : THREE.Matrix4,
        mouse? : THREE.Vector2, mouseDelta? : THREE.Vector2, mousePressed? : boolean
    }) : void
    {
        for(const key in data)
            this.verletPtUniform[key].value = data[key];

        this.gpuComputeConstr.setVariableDependencies(this.verletConstrVariable, [this.verletPtVariable]);
        for(let i = 0; i < subStep; i++) this.gpuComputeConstr.compute();
        
        this.gpuComputePt.setVariableDependencies(this.verletPtVariable, [this.verletConstrVariable]);
        this.gpuComputePt.compute();
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
}

export class VerletfromCurve extends VerletSimulator
{
    constructor(curve : THREE.Curve<THREE.Vector3>,
                sample : number, renderer : THREE.WebGLRenderer,
                pinFunc? : (index : number, pos : THREE.Vector3) => number)
    {
        super(sample, 1); 

        const posArray = curve.getPoints(sample);
        this.initSimulator(renderer, posArray, pinFunc);
    }
}

export class VerletfromLine extends VerletSimulator
{
    constructor(renderer : THREE.WebGLRenderer, sample : number, length : number = 100,
                root : THREE.Vector3 = new THREE.Vector3(),
                up : THREE.Vector3 = new Vector3(0,1,0), 
                pinFunc? : (index : number, pos : THREE.Vector3) => number)
    {
        super(sample, 1); 

        const normUp = up.normalize();

        const posArray : THREE.Vector3[] = new Array(sample);
        posArray[0] = root;
        for(let i = 1; i < sample; i++)
            posArray[i] = posArray[i - 1].add(normUp.multiplyScalar(length / sample));

        this.initSimulator(renderer, posArray, pinFunc);
    }
}