uniform sampler2D tDiffuse;
uniform float t;
uniform float aspect;
varying vec2 vUv;

float parabola( float x, float k )
{
    return pow( 4.0*x*(1.0-x), k );
}

void main() 
{
    vec4 tex = texture2D( tDiffuse, vUv );

    vec2 dir = normalize(vec2(-.5*aspect,.5));
    float d = dot(dir, vUv);

    float rt = parabola(clamp(t*.5, 0., .5), .85);

    float a = mix(1., float(fract(d*60.) > .5), float(vUv.y < rt*1.5));
    a = mix(a, 0., float(vUv.y < (rt * 1.5 - .4)));
    gl_FragColor = vec4(tex.xyz, a);
}