vec3 dUV = vec3(1. / count, 1. / (instanceCount * 2.), 0.);

vec3 vPosition;
vec3 posLocal;

#if defined( Z_UP )
    vPosition = position.xzy * vec3(1.,-1.,1.);
    posLocal = position.xzy * vec3(1.,-1.,1.);
#else
    vPosition = position.xyz;
    posLocal = position;
#endif

vPosition *= vec3(1.,0.,1.);
float iid = float(gl_InstanceID);

#if defined( USE_CUSTOM_MODEL )
    vec2 sampleUV = vec2(posLocal.y / boundY, dUV.y * iid) + dUV.xy * .5;

    vec3 pos  = texture2D(verletTexture, sampleUV).xyz;
    vec3 nPos = texture2D(verletTexture, sampleUV+dUV.xz).xyz;
    vec3 pPos = texture2D(verletTexture, sampleUV-dUV.xz).xyz;

    vec3 up = normalize(vec3(0.,1.,0.));

    vec3 yDir = normalize(nPos - pPos);
    vec3 xDir = normalize(cross(up, yDir));
    vec3 zDir = normalize(cross(xDir, yDir));

    mat4 mat = mat4(vec4(xDir, 0),
                    vec4(yDir, 0),
                    vec4(zDir, 0),
                    vec4(pos , 1));
#else
    vec2 sampleUV = vec2(uv.y, dUV.y * iid) + dUV.xy * .5;

    vec3 pos  = texture2D(verletTexture, sampleUV).xyz;
    vec3 nPos = texture2D(verletTexture, sampleUV+dUV.xz).xyz;
    vec3 pPos = texture2D(verletTexture, sampleUV-dUV.xz).xyz;

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