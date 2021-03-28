export const TransitionShader = 
{
    uniforms: {
        "tDiffuse": { value: null },
        "t": { value : 0}
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
		"	vUv = uv;",
		"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform float t;",
		"varying vec2 vUv;",
		"void main() {",
		"	vec4 tex = texture2D( tDiffuse, vUv );",
		"	gl_FragColor = vec4(tex.xyz, vUv.y > t? tex.a : 0.);",
		"}"
	].join( "\n" )
};