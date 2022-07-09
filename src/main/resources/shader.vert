#version 330 core

in vec3 pos;
in vec2 uv;
out vec2 vUv;

out float vFractal;
out vec2 vResolution;
out vec3 vCameraPos;
out vec2 vRotation;
out mat4 vCameraRot;

uniform int fractal;
uniform vec2 resolution;
uniform lowp vec3 cameraPos;
uniform lowp vec2 rotation;
uniform lowp mat4 cameraRot;

void main() {
    gl_Position = vec4(pos, 1.0);
    vResolution = resolution;
    vCameraPos = cameraPos;
    vRotation = rotation;
    vFractal = fractal;
    vCameraRot = cameraRot;
    vUv = uv;
}