precision mediump float;

uniform float aspect;
uniform float t;
uniform float completion;
varying vec2 vUv;

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float random (vec2 st)
{
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

float noise (in vec2 st) 
{
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float gain(float x, float k) 
{
    float a = 0.5*pow(2.0*((x<0.5)?x:1.0-x), k);
    return (x<0.5)?a:1.0-a;
}

void main() 
{
    vec2 uv = vec2(vUv.x * aspect, vUv.y);

    float scale = 40.;
    vec2 suv = uv * scale;

    vec2 canvas = fract(suv - vec2(.5));
    vec2 id = suv - canvas;
    vec2 grid = id / scale;

    float speed = .2;

    float rand = noise(grid*45. + t*.4) * .15 - .35;
    float randp = t*speed + rand;

    float circle = float(grid.y > randp);

    float sub = randp - grid.y*.8;
    float sub2 = randp - grid.y;

    float colfade = clamp(sub, -2., .2);
    float shapefade = clamp((sub2+4.92)*.1, 0., 1.);
    shapefade = gain(shapefade, 600.);

    vec3 col = vec3(.33,.4,.42)*.2;
    vec3 bg = vec3(.15, .15, .19)*.25;

    vec2 center = canvas - vec2(.5);

    vec2 rs = vec2(.12); 

    vec2 ts = vec2(shapefade*rs.x*4., 0.);

    if(rand > -.3) ts = ts.yx;

    float rect0 = sdBox(center - rs * 2. + ts, rs);
    float rect1 = sdBox(center               , rs);
    float rect2 = sdBox(center + rs * 2. - ts, rs);

    float inrect = float(rect0 < 0. || rect1 < 0. || rect2 < 0.);

    // gl_FragColor = vec4(canvas, 0, 1);
    col = mix(bg, col + colfade, clamp(inrect + circle, 0., 1.));
    gl_FragColor = vec4(col, 1.);
}