export const ToneMapShader = 
{
    uniforms: {
        "tDiffuse": { value: null },
        "exposure": { value: 1.0 }
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
		"	vUv = uv;",
		"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
        "vec3 ACESFilmicCurve(vec3 x){",
            "float a = 2.51;",
            "float b = .03;",
            "float c = 2.43;",
            "float d = .59;",
            "float e = .14;",
            "return clamp((x * (a*x + b)) / (x * (c*x + d) + e), 0., 1.);",
        "}",
        "vec3 RainhardCurve(vec3 x){",
        "    return x / (1.0 + x);",
        "}",
        "vec3 UnrealCurve(vec3 x){",
        "    return x / (x + .155) * 1.019;",
        "}",
        "uniform sampler2D tDiffuse;",
        "uniform float exposure;",
		"varying vec2 vUv;",
		"void main() {",
		"	vec4 tex = texture2D( tDiffuse, vUv );",
		"	gl_FragColor = LinearTosRGB(vec4(ACESFilmicCurve(tex.rgb * exposure), tex.a));",
		"}"
	].join( "\n" )
};