import 
{ 
    Texture,
    FloatType,
    TextureLoader
} from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";

const Paths : {[key : string] : string }[] = 
[
    {
        type : "env",
        key : "sky0",
        path : "../../public/textures/env/BOCO_skies_christmas_2.exr"
    }
];

const pathCount = Paths.length;

export default class ImageLoader
{
    private static data : Texture[] = new Array(pathCount);
    public static get Images() : Texture[] { return this.data; }

    private static counter : number = 0;

    private loader : TextureLoader;
    private exrloader : EXRLoader;

    constructor()
    {
        this.loader = new TextureLoader();
        this.exrloader = new EXRLoader().setDataType(FloatType);

        this.LoadImages();
    }

    public async LoadImages() : Promise<void>
    {
        // Parallel
        await Promise.all(Paths.map(async v =>
        {
            console.log(`${v["key"]} : load start`);

            if(v["type"] == "env")
            {
                await this.exrloader.loadAsync(v["path"]).then(tex =>
                    {
                        ImageLoader.data[v["key"]] = tex;
                    });
            }
            else
            {
                await this.loader.loadAsync(v["path"]).then(tex =>
                    {
                        ImageLoader.data[v["key"]] = tex;
                    });
            }

            console.log(`${v["key"]} : loaded`);
            ImageLoader.counter++;
        }));

        window.dispatchEvent(new Event("FileLoaded"));


        /* Straight
        this.loader.load(Paths[this.counter]["path"], (tex) =>
        {
            const key = Paths[this.counter]["key"];
            this.data[key] = tex;

            this.counter++;
            if(this.counter < pathCount)
            {
                console.log(`${key} : Loaded`);
                this.LoadImages();
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