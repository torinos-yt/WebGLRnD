vec2 dUV = vec2(1. / count, 0.);

#if defined( USE_CUSTOM_MODEL )
    vec3 vPosition = position.xyz * vec3(1.,1.,0.);
    vec2 sampleUV = vec2(position.z / (1216. * 1.), 0.) + dUV.x * .5;

    vec3 pos  = texture2D(verletTexture, sampleUV).xyz;
    vec3 nPos = texture2D(verletTexture, sampleUV+dUV).xyz;
    vec3 pPos = texture2D(verletTexture, sampleUV-dUV).xyz;

    vec3 up = vec3(0.,1.,0.);

    vec3 yDir = normalize(nPos - pPos);
    vec3 xDir = normalize(cross(up, yDir));
    vec3 zDir = normalize(cross(xDir, yDir));

    mat4 mat = mat4(vec4(xDir, 0),
                    vec4(-zDir, 0),
                    vec4(yDir, 0),
                    vec4(pos , 1));
#else
    vec3 vPosition = position.xyz * vec3(1.,0.,1.);
    vec2 sampleUV = vec2(uv.y, 0.) + dUV.x * .5;

    vec3 pos  = texture2D(verletTexture, sampleUV).xyz;
    vec3 nPos = texture2D(verletTexture, sampleUV+dUV).xyz;
    vec3 pPos = texture2D(verletTexture, sampleUV-dUV).xyz;

    vec3 up = vec3(0.,1.,0.);

    vec3 yDir = normalize(nPos - pPos);
    vec3 xDir = normalize(cross(up, yDir));
    vec3 zDir = normalize(cross(xDir, yDir));

    mat4 mat = mat4(vec4(xDir, 0),
                    vec4(yDir, 0),
                    vec4(zDir, 0),
                    vec4(pos , 1));
#endif

vec3 transformed = (mat * vec4(vPosition, 1.)).xyz;

#ifndef MAT_NO_NEED_NORMAL
    vNormal = normalMatrix * mat3(mat) * normal;
#endif