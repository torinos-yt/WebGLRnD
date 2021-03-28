import * as THREE from "three";

import SceneBase from "./SceneBase";

export class LoadingScene extends SceneBase
{

    constructor(renderer : THREE.WebGLRenderer)
    {
        super(renderer);
        super.addBasePass(.5);
    }

    public Render(delta : number, t : number) : void
    {
        if(!this.valid) return;
        super.Render(delta, t);
    }
}