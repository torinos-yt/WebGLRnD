import loadingTransition from "./loadingTransition.glsl";

export const LoadingTransitionShader = 
{
    uniforms: {
        "tDiffuse": { value: null },
		"t": { value : 0},
		"aspect" : { valuie : 0 }
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
		"	vUv = uv;",
		"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: loadingTransition
};