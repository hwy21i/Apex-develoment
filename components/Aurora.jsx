"use client";

import React, { useEffect, useRef, useState } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import "./Aurora.css";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );
  vec3 m = max(
    0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
    0.0
  );
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  float n1 = snoise(vec2(uv.x * 1.4 + uTime * 0.06, uv.y * 0.9));
  float n2 = snoise(vec2(uv.x * 2.1 - uTime * 0.04, uv.y * 1.6 + n1 * 0.4));
  
  float wave = uv.y + n2 * uAmplitude * 0.22;
  
  vec3 col = mix(uColorStops[0], uColorStops[1], smoothstep(0.1, 0.6, wave));
  col = mix(col, uColorStops[2], smoothstep(0.5, 0.95, wave));
  
  fragColor = vec4(col, uBlend);
}
`;

export default function Aurora({
  colorStops = ["#1A2D42", "#2E4156", "#AAB7B7"],
  blend = 0.35,
  amplitude = 0.7,
  speed = 0.25,
  className = "",
}) {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    let gl;
    let animId;

    try {
      renderer = new Renderer({
        alpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        antialias: true,
        powerPreference: "low-power",
      });
      gl = renderer.gl;
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const stopColors = colorStops.map((hex) => new Color(hex));

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: stopColors },
        uResolution: { value: [container.offsetWidth || 1, container.offsetHeight || 1] },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container || !renderer) return;
      const width = container.offsetWidth || window.innerWidth;
      const height = container.offsetHeight || window.innerHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
    resize();

    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastTime = performance.now();
    let accumulatedTime = 0;

    function update(t) {
      const dt = (t - lastTime) * 0.001;
      lastTime = t;
      if (!prefersReducedMotion) {
        accumulatedTime += dt * speed;
      }
      program.uniforms.uTime.value = accumulatedTime;
      renderer.render({ scene: mesh });
      animId = requestAnimationFrame(update);
    }

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (gl && gl.canvas && gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      const loseContext = gl?.getExtension("WEBGL_lose_context");
      if (loseContext) loseContext.loseContext();
    };
  }, [colorStops, blend, amplitude, speed]);

  return (
    <div
      ref={containerRef}
      className={`aurora-container ${className}`}
      aria-hidden="true"
    >
      {!hasWebGL && <div className="aurora-fallback" />}
    </div>
  );
}

