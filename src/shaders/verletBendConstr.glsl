/* --- Uniforms --- */
// Physics Param
uniform float bendStiffness;
uniform float stretchStiffness;
uniform float structureStiffness;
uniform float ground;
uniform float groundFriction;

/* --- Const Params ---*/
const float friction = .97;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    if(floor(gl_FragCoord.y) == 2.)// restLength Path Through
    {
		gl_FragColor = texture2D(textureVerlet, uv);
        return;
    } 
	else if(floor(gl_FragCoord.y) == 1.)// OldPosition Path Through
    {
		gl_FragColor = texture2D(textureVerlet, uv);
        return;
    }
	else // Update Position 
	{
		vec4 pointData = texture2D(textureVerlet, uv);
		vec3 position = pointData.xyz;

		if(pointData.w > 0.)
		{	
			vec2 dUV = 1. / resolution.xy;

			// Solve Bend Constraint
			float restAngle = abs(pointData.w);

			vec4 prevPoint = texture2D(textureVerlet, uv + vec2(-dUV.x, 0.));
			vec4 nextPoint = texture2D(textureVerlet, uv + vec2( dUV.x, 0.));

			float prevRestAngle = abs(prevPoint.w);
			float nextRestAngle = abs(nextPoint.w);

			vec4 pprevPoint = texture2D(textureVerlet, uv + vec2(-dUV.x * 2., 0.));
			vec4 nnextPoint = texture2D(textureVerlet, uv + vec2( dUV.x * 2., 0.));

			float div =  1. / 3.;
			
			vec3 b0 = prevPoint.xyz;
			vec3 b1 = nextPoint.xyz;
			vec3 v  = position;

			vec3 c = (b0+b1+v) * div;
			vec3 cDir = (v - c) * (1. - (bendStiffness + restAngle) / distance(v, c));
			vec3 offset = -cDir;

			b0 = pprevPoint.xyz;
			b1 = position;
			v  = prevPoint.xyz;

			c = (b0+b1+v) * div;
			cDir = (v - c) * (1. - (bendStiffness + prevRestAngle) / distance(v, c));
			offset += cDir * .5;
			
			b0 = position;
			b1 = nnextPoint.xyz;
			v  = nextPoint.xyz;

			c = (b0+b1+v) * div;
			cDir = (v - c) * (1. - (bendStiffness + nextRestAngle) / distance(v, c));
			offset += cDir * .5;

			position += offset;
		}
		
		gl_FragColor = vec4(position, pointData.w);
	}
}