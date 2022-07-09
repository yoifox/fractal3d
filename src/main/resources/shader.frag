#version 330 core

const int MAX_MARCHING_STEPS = 256;
const float MIN_DIST = 0.0;
const float MAX_DIST = 10000.0;
const float EPSILON = 0.0005;
const float FOV = 120.0;

const int ITERATIONS = 10;
const int SIERPISNKI_ITERATIONS = 20;
const int COLOR_ITERATIONS = 5;
const float BAILOUT = 50.0;
const float POWER = 10.0;

const float SHADOW_INTENSITY = 0.5;
const float SHADOW_DIFFUSE = 1.0 - SHADOW_INTENSITY;
const float DIFFUSE_STRENGTH = 0.9;
const float ORBIT_STRENGTH = 0.5;

in vec4 gl_FragCoord;
in vec2 vUv;
in float vFractal;
in vec2 vResolution;
in vec3 vCameraPos;
in vec2 vRotation;
in mat4 vCameraRot;

out vec4 fragOutColor;

vec4 orbitTrap = vec4(MAX_DIST);
int currentSteps;
vec2 rotation;

float sphereDE(vec3 samplePoint) {
    return length(samplePoint) - 1;
}

float mandelbulbDE(vec3 pos, bool isLight) {
    if(!isLight) orbitTrap = vec4(MAX_DIST);
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < ITERATIONS ; i++) {
        r = length(z);

        if (r > BAILOUT) break;

        float theta = acos(z.z/r);
        float phi = atan(z.y,z.x);
        dr =  pow( r, POWER-1.0 )*POWER*dr + 1.0;

        float zr = pow( r,POWER);
        theta = theta*POWER;
        phi = phi*POWER;

        z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));

        z+=pos;

        if (i < COLOR_ITERATIONS && !isLight) orbitTrap = min(orbitTrap,abs(vec4(z.x,z.y,z.z,r*r)));
    }
    return 0.5*log(r)*r/dr;
}

float baloonsDE(vec3 pos, bool isLight) {
    if(!isLight) orbitTrap = vec4(MAX_DIST);
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < ITERATIONS ; i++) {
        r = length(z);

        if (r > BAILOUT) break;

        float theta = acos(z.z/r);
        float phi = atan(z.y,z.x);
        dr =  pow( r, POWER-1.0 )*POWER*dr + 1.0;

        float zr = pow( r,POWER);
        theta = theta*POWER;
        phi = phi*POWER;

        z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));

        z+=pos*1.5;

        if (i < COLOR_ITERATIONS && !isLight) orbitTrap = min(orbitTrap,abs(vec4(z.x,z.y,z.z,r*r)));
    }
    return 0.5*log(r)*r/dr;
}

float mandelboxDE(vec3 pos, bool isLight) {
    if(!isLight) orbitTrap = vec4(MAX_DIST);
    float SCALE = 2.8;
    float MR2 = 0.2;

    vec4 scalevec = vec4(SCALE, SCALE, SCALE, abs(SCALE)) / MR2;
    float C1 = abs(SCALE-1.0), C2 = pow(abs(SCALE), float(1-ITERATIONS));

    vec4 p = vec4(pos.xyz, 1.0), p0 = vec4(pos.xyz, 1.0);

    for (int i=0; i<ITERATIONS; i++) {
        p.xyz = clamp(p.xyz, -1.0, 1.0) * 2.0 - p.xyz;
        float r2 = dot(p.xyz, p.xyz);
        if (i<COLOR_ITERATIONS && !isLight) orbitTrap = min(orbitTrap, abs(vec4(p.xyz,r2)));
        p.xyzw *= clamp(max(MR2/r2, MR2), 0.0, 1.0);
        p.xyzw = p*scalevec + p0;
    }
    return ((length(p.xyz) - C1) / p.w) - C2;
}

float sphereSpongeDE(vec3 pos, bool isLight) {
    if(!isLight) orbitTrap = vec4(MAX_DIST);
    float scale = 2.0;
    float spongeScale = 2.05;
    float k = scale;
    float d = -10000.0;
    float d1, r, md = 100000.0, cd = 0.0;

    for (int i = 0; i < int(ITERATIONS); i++) {
        vec3 zz = mod(pos * k, 4) - vec3(0.5 * 4) + 0;
        r = length(zz);
        d1 = (spongeScale - r) / k;
        k *= scale;
        d = max(d, d1);
        if (i < COLOR_ITERATIONS) {
            md = min(md, d);
            cd = r;
        }
    }

    return d;
}

float mengerSpongeDE(vec3 pos, bool isLight) {
    float scale = 2.0;
    float spongeScale = 2.05;
    pos = (pos * 0.5 + vec3(0.5)) * scale;

    vec3 v = abs(pos - spongeScale) - spongeScale;
    float d1 = max(v.x, max(v.y, v.z));
    float d = d1;
    float p = 1.0;
    float md = 10000.0;
    vec3 cd = v;

    for (int i = 0; i < int(ITERATIONS); i++) {
        vec3 a = mod(3.0 * pos * p, 3.0);
        p *= 3.0;
        v = vec3(0.5) - abs(a - vec3(1.5)) + 0;
        d1 = min(max(v.x, v.z), min(max(v.x, v.y), max(v.y, v.z))) / p;
        d = max(d, d1);
        if (i < COLOR_ITERATIONS) {
            md = min(md, d);
            cd = v;
        }
    }

    return d;
}

mat4 rotateZaxis(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat4(
    vec4(c, -s, 0, 0),
    vec4(s, c, 0, 0),
    vec4(0, 0, 1, 0),
    vec4(0, 0, 0, 1)
    );
}

mat4 rotateYaxis(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat4(
    vec4(c, 0, s, 0),
    vec4(0, 1, 0, 0),
    vec4(-s, 0, c, 0),
    vec4(0, 0, 0, 1)
    );
}

mat4 rotateXaxis(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat4(
    vec4(1, 0, 0, 0),
    vec4(0, c, -s, 0),
    vec4(0,s, c, 0),
    vec4(0, 0, 0, 1)
    );
}

float getDE(vec3 samplePoint, bool isLight) {

    vec3 fractalPoint = ((rotateXaxis(-vRotation.y * 0.005) *
        rotateYaxis(-vRotation.x*0.005) *
        rotateYaxis(0) *
        vec4(samplePoint,1.0))).xyz;

    if(vFractal == 1)
        return mandelbulbDE(fractalPoint, isLight);
    if(vFractal == 2)
        return baloonsDE(fractalPoint, isLight);
    if(vFractal == 3)
        return mengerSpongeDE(fractalPoint, isLight);
    if(vFractal == 4)
        return sphereSpongeDE(fractalPoint, isLight);
    return mandelboxDE(fractalPoint, isLight);
}

float rayMarch(vec3 from, vec3 direction, bool isLight) {
    float totalDistance = 0.0;
    int steps;
    for (steps=0; steps < MAX_MARCHING_STEPS; steps++) {
        vec3 p = from + totalDistance * direction;
        float distance = getDE(p,isLight);
        totalDistance += distance;
        if (distance > MAX_DIST || distance < EPSILON) break;
    }
    currentSteps = steps;
    return totalDistance;
}

vec3 rayDirection(float fov, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fov)/2.0);
    return normalize(vec3(xy,z));
}

vec3 getNormal(vec3 samplePoint, bool isLight) {
    float distanceToPoint = getDE(samplePoint,isLight);
    vec2 e = vec2(.01,0);

    vec3 n = distanceToPoint - vec3(
        getDE(samplePoint-e.xyy,isLight),
        getDE(samplePoint-e.yxy,isLight),
        getDE(samplePoint-e.yyx,isLight)
    );

    return normalize(n);
}

float getLight(vec3 samplePoint) {
    vec3 lightPosition = vec3(10.0,10.0,-10.0);
    vec3 light = normalize(lightPosition-samplePoint);
    vec3 normal = getNormal(samplePoint,true);

    float dif = clamp(dot(normal,light)*DIFFUSE_STRENGTH,0.0,1.0);
    float distanceToLightSource = rayMarch(samplePoint+normal*EPSILON*2.0,light,true);
    if(distanceToLightSource < length(lightPosition-samplePoint)) dif *= SHADOW_DIFFUSE;

    return dif;
}

void main() {
    vec3 dir = (vec4(rayDirection(FOV, vResolution, gl_FragCoord.xy), 0) * vCameraRot).xyz;

    float marchedDistance = rayMarch(vCameraPos, dir, false);

    if(marchedDistance >= MAX_DIST && false) {
        float glow = currentSteps / 3;
        fragOutColor = mix(vec4(0.0, 0.0, 0.0, 0.0),vec4(1.0, 1.0, 1.0, 1.0),glow*0.05);
    } else {
        vec3 p = vCameraPos + dir * marchedDistance;
        float diffuse = getLight(p);

        vec3 gradient = mix(vec3(0.3, 0.3, 1), vec3(0.2, 0.2, 0.3), smoothstep(0.0, 1.0, vUv.y));

        //vec4 baseColor = vec4(orbitTrap.z + diffuse * 0.6, orbitTrap.x + diffuse * 0.6, orbitTrap.w / 4.0, 1.0) * orbitTrap.w * 0.6 + 0.1;
        vec4 baseColor = vec4(0.5, 0.5, 0.5, 1) + diffuse * 0.6;

        fragOutColor = mix(baseColor,vec4(gradient,1.0),clamp(marchedDistance*0.25,0.0,1.0) / 2.0);
        if(marchedDistance > MAX_DIST) {
            fragOutColor = vec4(gradient, 1);
        }
    }
}