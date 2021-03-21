/* --- Uniforms --- */
// Physics Param
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

			// Solve Constraint
			vec4 restLength = texture2D(textureVerlet, uv + vec2(0., dUV.y * 2.));
			float prevRestLength = texture2D(textureVerlet, uv + vec2(-dUV.x, dUV.y * 2.)).x;
			
			float staticFriction = 1.0;


			vec3 pos0 = texture2D(textureVerlet, uv - vec2(dUV.x, 0.)).xyz;
			vec3 pos1 = position;

			if(pos1.y <= ground)
			{
				pos1.y = ground;
				staticFriction = groundFriction;
			}
			
			float dist = distance(pos0, pos1);
			float diff = (prevRestLength - dist) / dist * stretchStiffness;
			
			vec3 prevOffset = (pos1 - pos0) * diff * .5;
			
			if(isnan(prevOffset.x))
				prevOffset = vec3(0.);
			
			pos0 = position;
			pos1 = texture2D(textureVerlet, uv + vec2(dUV.x, 0.)).xyz;
		
			if(pos0.y + prevOffset.y <= ground)
			{ 
				pos0.y = ground;
				staticFriction = groundFriction;
			}
			
			dist = distance(pos0, pos1);
			diff = (restLength.x - dist) / dist * stretchStiffness;
			
			vec3 offset = (pos1 - pos0) * diff * .5;
			
			if(isnan(offset.x))
				offset = vec3(0.);
			
			position = pos0 + (prevOffset - offset) * staticFriction;
			
			
			/* ---Structure Constraint--- */
			/*
			float off = floor(resolution.x/4.);
			
			pos0 = position;
			pos1 = texture2D(textureVerlet, uv + vec2(dUV.x * off, 0.)).xyz;
		
			if(pos0.y <= ground)
			{ 
				pos0.y = ground;
				staticFriction = groundFriction;
			}
			
			dist = distance(pos0, pos1);
			diff = (restLength.y - dist) / dist * stretchStiffness * structureStiffness;
			
			offset = (pos1 - pos0) * diff * .5;
			
			if(!isnan(offset.x))
				pos0 -= offset * staticFriction;
			
			position = pos0;
			
			pos0 = position;
			pos1 = texture2D(textureVerlet, uv + vec2(dUV.x * off * 2., 0.)).xyz;
		
			if(pos0.y <= ground)
			{ 
				pos0.y = ground;
				staticFriction = groundFriction;
			}
			
			dist = distance(pos0, pos1);
			diff = (restLength.z - dist) / dist * stretchStiffness * structureStiffness;
			
			offset = (pos1 - pos0) * diff * .5;
			
			if(!isnan(offset.x))
				pos0 -= offset * staticFriction;
			
			position = pos0;

			pos0 = position;
			pos1 = texture2D(textureVerlet, uv + vec2(dUV.x * off * 3., 0.)).xyz;
		
			if(pos0.y <= ground)
			{ 
				pos0.y = ground;
				staticFriction = groundFriction;
			}
			
			dist = distance(pos0, pos1);
			diff = (restLength.w - dist) / dist * stretchStiffness * structureStiffness;
			
			offset = (pos1 - pos0) * diff * .5;
			
			if(!isnan(offset.x))
				pos0 -= offset * staticFriction;
			
			position = pos0;
			*/
		}
		
		gl_FragColor = vec4(position, pointData.w);
	}
}