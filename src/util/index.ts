import 
{ 
    WebGLRenderer,
    PCFSoftShadowMap,
    Texture,
    sRGBEncoding,
    RGBADepthPacking,
    PerspectiveCamera,
    Mesh,
    MeshStandardMaterial,
    MeshDepthMaterial,
    MeshDistanceMaterial,
    Group,
    NoToneMapping,
    Vector2,
    Vector3,
    Vector4,
} from "three";

import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import parallelTransport from "../shaders/parallelTransport.glsl";

export const lerp = (x : number, y : number, p : number) : number =>  x + (y - x) * p;
export const lerpVec2 = (x : Vector2, y : Vector2, p : number) : Vector2 =>
{
    return new Vector2(lerp(x.x, y.x, p), lerp(x.y , y.y, p));
};
export const lerpVec3 = (x : Vector3, y : Vector3, p : number) : Vector3 =>
{
    return new Vector3(lerp(x.x, y.x, p), lerp(x.y , y.y, p), lerp(x.z , y.z, p));
}

export const initRenderer = () : WebGLRenderer =>
{
    const canvas = document.querySelector("#render-target") as HTMLCanvasElement;
    const r = new WebGLRenderer({ canvas });
    r.toneMappingExposure = .85;
    r.autoClear = false;
    r.shadowMap.enabled = true;
    r.shadowMap.type = PCFSoftShadowMap;
    r.toneMapping = NoToneMapping;
    r.outputEncoding = sRGBEncoding;

    return r;
}

export const initCamera = (focalLength : number) : PerspectiveCamera =>
{
    const width = window.innerWidth;
    const height = window.innerHeight;

    const sensorSize = 36.0; //mm
    const fovRad = Math.atan(sensorSize / (2.0 * focalLength));
    const fov = fovRad * (360.0 / Math.PI);
    const dist = height / 2.0 / Math.tan(fovRad);
    const cam = new PerspectiveCamera(fov, width / height, 50, dist * 3);
    cam.position.z = dist;

    return cam;
}

export const extractMeshes = (root : GLTF, envMap? : Texture, frustomCull : boolean = true) : Group =>
{
    const group : Group = new Group();

    root.scene.traverse((node) =>
    {
        // @ts-ignore
        if(node.isMesh)
        {
            const geom = (node as Mesh).geometry;
            const mat = new MeshStandardMaterial().copy(((node as Mesh).material as MeshStandardMaterial));
            mat.envMap = envMap;

            const mesh = new Mesh(geom, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            mesh.frustumCulled = frustomCull;
            group.add(mesh);
        }
    });

    return group;
}

export const VerletMesh = (mesh : THREE.Mesh | THREE.InstancedMesh, mat : THREE.MeshStandardMaterial,
    env : THREE.Texture, data : THREE.Texture, bound : number, count : number, zUp : boolean = false) : void =>
{
    mat.defines = mat.defines || {};
    mat.defines["USE_CUSTOM_MODEL"] = 1;
    mat.envMap = env;

    const setCustomVert = (shader : THREE.Shader) =>
    {
        shader.uniforms["verletTexture"] = {value : data};
        shader.uniforms["count"] = {value : count};
        shader.uniforms["instanceCount"] = {value : 1};
        shader.uniforms["iid"] = {value : 0};
        shader.uniforms["boundY"] = {value : bound};
        shader.vertexShader = "uniform sampler2D verletTexture;\n" + shader.vertexShader;
        shader.vertexShader = "uniform float count;\n" + shader.vertexShader;
        shader.vertexShader = "uniform float instanceCount;\n" + shader.vertexShader;
        shader.vertexShader = "uniform float iid;\n" + shader.vertexShader;
        shader.vertexShader = "uniform float boundY;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", parallelTransport);
    };

    mat.onBeforeCompile = setCustomVert;
    let depthMat = new MeshDepthMaterial({ depthPacking : RGBADepthPacking });
    let distMat = new MeshDistanceMaterial();
    depthMat.defines = depthMat.defines || {};
    depthMat.defines["MAT_NO_NEED_NORMAL"] = 1;
    depthMat.defines["USE_CUSTOM_MODEL"] = 1;
    distMat.defines = distMat.defines || {};
    distMat.defines["MAT_NO_NEED_NORMAL"] = 1;
    distMat.defines["USE_CUSTOM_MODEL"] = 1;

    if(zUp)
    {
        mat.defines["Z_UP"] = 1;
        depthMat.defines["Z_UP"] = 1;
        distMat.defines["Z_UP"] = 1;
    }

    depthMat.onBeforeCompile = setCustomVert;
    distMat.onBeforeCompile = setCustomVert;

    mesh.customDepthMaterial = depthMat;
    mesh.customDistanceMaterial = distMat;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.frustumCulled = false;
}

export const getTextureDatas = (texture : Texture) : ImageData =>
{
    const canvas = document.createElement("canvas");
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    const context = canvas.getContext("2d");
    context.drawImage(texture.image, 0, 0);

    return context.getImageData(0, 0, canvas.width, canvas.height);
}

export const getPixelData = (imageData : ImageData, x : number, y : number) : Vector4 =>
{
    const pos = (x + imageData.width * y) * 4;

    return new Vector4(imageData.data[pos],
                       imageData.data[pos + 1],
                       imageData.data[pos + 2],
                       imageData.data[pos + 3],);
}

export const isSafari = () : boolean =>
    !!navigator.userAgent.match( /Safari/i ) && !navigator.userAgent.match( /Chrome/i );
