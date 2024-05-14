export default /* glsl */`
uniform float uTime;
uniform float uColorOffset;
uniform float uColorMultiplier;
uniform sampler2D uTexture;
uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vDisplacement;


varying float vElevation;



void main() 
{
  vec4 imageTexture = texture2D(uTexture,vUv);

  float mixStrength = vElevation * uColorMultiplier + uColorOffset;
  vec3 color = mix(uDepthColor,uSurfaceColor,mixStrength);
	gl_FragColor = vec4(color,1.);

}
`;
