/* --- Uniforms --- */
uniform float deltaTime;
uniform float subStep;
uniform float currentStep;

// Physics Param
uniform vec3 gravity;
uniform float ground;
uniform float groundFriction;

// Interaction Param
uniform mat4 IView;
uniform mat4 IProj;
uniform vec2 mouse;
uniform vec2 mouseDelta;
uniform bool mousePressed;

/* --- Const Params ---*/
const float friction = .97;

float LinetoPointDistance(vec3 dir, vec3 cam, vec3 p)
{
    vec3 PtoA = cam - p; 
    float dotLP = dot(PtoA, dir);

    vec3 toLineDir = PtoA - (dir * dotLP);

    return length(toLineDir);
}

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 dUV = 1. / resolution.xy;

    if(floor(gl_FragCoord.y) == 2.)// restLength Path Through
    {
		gl_FragColor = texture2D(textureVerlet, uv);
        return;
    } 
	else if(floor(gl_FragCoord.y) == 1.)// Update OldPosition
    {
		if(subStep == currentStep)
		{
			float restLength = texture2D(textureVerlet, uv).w;
			gl_FragColor = vec4(texture2D(textureVerlet, uv - vec2(0., dUV.y)).xyz, restLength);
		}
		else
		{
			gl_FragColor = texture2D(textureVerlet, uv);
		}
        return;
    }
	else // Update Position 
	{
		vec4 pointData = texture2D(textureVerlet, uv);
		vec3 position = pointData.xyz;

		if(pointData.w > 0. && subStep == currentStep)
		{
			vec3 oldP = texture2D(textureVerlet, uv + vec2(0., dUV.y)).xyz;

			// Solve Point
			vec3 velocity = (position - oldP);
			//velocity += normalize(texture2D(textureVerlet, uv + vec2(dUV.x, 0.)).xyz - position)*deltaTime*.05;
			//velocity += simplexDFV(position * .5) * deltaTime * .0015;
			velocity *= friction;
			
			if(position.y < ground && length(velocity) > .000001)
			{
				velocity *= -groundFriction;
			}
			
			if(!isnan(velocity.x))
				position += velocity;

			position += gravity * deltaTime;

			if(position.y < ground)
				position.y = ground;
			
			vec3 camPos = IView[3].xyz;
			vec3 mouseDir = 
				normalize((IView * vec4( (IProj * vec4(mouse, 0., 0.)).xy, 1., 0.)).xyz);
			
			if(LinetoPointDistance(mouseDir, camPos, position) < .2 && mousePressed) 
			{
				float dist = distance(camPos, position); 			
				position = camPos + mouseDir * dist;
			}
		}
		
		gl_FragColor = vec4(position, pointData.w);
	}
}