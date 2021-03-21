import 
{ 
    WebGLRenderer,
    PCFSoftShadowMap,
    Texture,
    sRGBEncoding,
    PerspectiveCamera,
    Mesh,
    MeshStandardMaterial,
    Group,
    NoToneMapping
} from "three";

import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export const lerp = (x : number, y : number, p : number) : number =>  x + (y - x) * p;

export const initRenderer = () : WebGLRenderer =>
{
    const canvas = document.querySelector("#render-target") as HTMLCanvasElement;
    const r = new WebGLRenderer({ canvas });
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

export const extractMeshes = (root : GLTF, envMap? : Texture) : Group =>
{
    const group : Group = new Group();

    root.scene.traverse((node) =>
    {
        // @ts-ignore
        if(node.isMesh)
        {
            const geom = (node as Mesh).geometry;
            const mat = ((node as Mesh).material as MeshStandardMaterial);
            mat.envMap = envMap;

            const mesh = new Mesh(geom, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            group.add(mesh);
        }
    });

    return group;
}