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
    NoToneMapping,
    Vector4,
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
