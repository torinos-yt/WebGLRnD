import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

const Paths : {[key : string] : string}[] = 
[
    {
        key : "pole",
        path : "../../public/models/ElectricityPole_map.glb"
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

        this.dracoLoader.setDecoderPath("../../node_modules/three/examples/js/libs/draco/gltf/");
        this.loader.setDRACOLoader(this.dracoLoader);

        this.LoadModels();
    }

    public async LoadModels() : Promise<void>
    {
        // Parallel
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


        /* Straight
        this.loader.load(Paths[this.counter]["path"], (gltf) =>
        {
            const key = Paths[this.counter]["key"];
            this.data[key] = gltf;

            this.counter++;
            if(this.counter < pathCount)
            {
                console.log(`${key} : Loaded`);
                this.LoadModels();
            }
            else
            {
                console.log(`${key} : Loaded`);
                window.dispatchEvent(new Event("ModelLoaded"));
            }
        })
        */
    }

    public static get LoadCounter() : number { return this.counter / pathCount; }

    public static get isComplete() : boolean { return this.counter == pathCount; }
}