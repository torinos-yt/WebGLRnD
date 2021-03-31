import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

const Paths : {[key : string] : string}[] = 
[
    {
        key : "pole",
        path : "../public/models/ElectricityPole_map.glb"
    },
    {
        key : "pole_decimate",
        path : "../public/models/ElectricityPole_Decimate.glb"
    },
    {
        key : "cable",
        path : "../public/models/Cable.glb"
    },
    {
        key : "cable2",
        path : "../public/models/Cable2.glb"
    },
    {
        key : "cableWind",
        path : "../public/models/CableWind.glb"
    },
    {
        key : "cableWind2",
        path : "../public/models/CableWind2.glb"
    },
    {
        key : "cableWind3",
        path : "../public/models/CableWind3.glb"
    },
    {
        key : "cableWind4",
        path : "../public/models/CableWind4.glb"
    },
    {
        key : "camera",
        path : "../public/models/CameraAnimation.glb"
    }
];

const pathCount = Paths.length;

export default class ModelLoader
{
    private static data : GLTF[] = new Array(pathCount);
    public static get Models() : GLTF[] { return this.data; }

    private static counter : number = 0;

    private loader : GLTFLoader;
    private dracoLoader : DRACOLoader;

    constructor()
    {
        this.loader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();

        this.dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
        this.loader.setDRACOLoader(this.dracoLoader);

        this.LoadModels();
    }

    public async LoadModels() : Promise<void>
    {
        // Parallel
        /*
        await Promise.all(Paths.map(async v =>
        {
            console.log(`${v["key"]} : load start`);
            await this.loader.loadAsync(v["path"]).then(gltf =>
                {
                    ModelLoader.data[v["key"]] = gltf;
                });

            console.log(`${v["key"]} : loaded`);
            ModelLoader.counter++;
        }));

        window.dispatchEvent(new Event("FileLoaded"));
        */

        // Straight
        this.loader.load(Paths[ModelLoader.counter]["path"], (gltf) =>
        {
            const key = Paths[ModelLoader.counter]["key"];
            ModelLoader.data[key] = gltf;

            ModelLoader.counter++;
            if(ModelLoader.counter < pathCount)
            {
                console.log(`${key} : Loaded`);
                this.LoadModels();
            }
            else
            {
                console.log(`${key} : Loaded`);
                window.dispatchEvent(new Event("FileLoaded"));
            }
        })
        
    }

    public static get LoadCounter() : number { return this.counter; }

    public static get PathCount() : number { return pathCount; }

    public static get isComplete() : boolean { return this.counter == pathCount; }
}