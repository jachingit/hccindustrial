import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import GUI from "lil-gui";
import rustVertexShader from "./shaders/rust/vertex.glsl";
import rustFragmentShader from "./shaders/rust/fragment.glsl";
import ironVertexShader from "./shaders/iron/vertex.glsl";
import ironFragmentShader from "./shaders/iron/fragment.glsl";
import zincVertexShader from "./shaders/zinc/vertex.glsl";
import zincFragmentShader from "./shaders/zinc/fragment.glsl";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import gpgpuParticlesShader from "./shaders/gpgpu/particles.glsl";
import holographicVertexShader from "./shaders/holographic/vertex.glsl";
import holographicFragmentShader from "./shaders/holographic/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 });
gui.show(false);
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();
const baseColorTexture = textureLoader.load(
  "./rust/rust_coarse_01_diff_1k.jpg",
);
const normalTexture = textureLoader.load("./rust/rust_coarse_01_nor_gl_1k.jpg");
const armTexture = textureLoader.load("./rust/rust_coarse_01_arm_1k.jpg");

baseColorTexture.colorSpace = THREE.SRGBColorSpace;

const rgbeLoader = new RGBELoader();

const gltfLoader = new GLTFLoader();

const gltf = await gltfLoader.loadAsync("./rust/model.glb");
const baseGeometry = {};
baseGeometry.instance = null;
gltf.scene.traverse((child) => {
  if (child.isMesh && !baseGeometry.instance) {
    baseGeometry.instance = child.geometry;
  }
});
baseGeometry.count = baseGeometry.instance.attributes.position.count;
// console.log(baseGeometry.instance);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Materials
  particles.material.uniforms.uResolution.value.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio,
  );

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.set(6.0, 4.0, 8.0);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

debugObject.clearColor = "#000000";
renderer.setClearColor(debugObject.clearColor);

/**
 * Environment map
 */
rgbeLoader.load("./urban_alley_01_1k.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.environment = environmentMap;
  scene.environmentIntensity = 2;
});

/**
 * Lights
 */
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
// scene.add(ambientLight);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
// directionalLight.castShadow = true;
// directionalLight.shadow.mapSize.set(1024, 1024);
// directionalLight.shadow.camera.far = 15;
// directionalLight.shadow.camera.top = 7;
// directionalLight.shadow.camera.right = 7;
// directionalLight.shadow.camera.bottom = -7;
// directionalLight.shadow.camera.left = -7;
// directionalLight.position.set(5, 5, 5);
// scene.add(directionalLight);

const timeSessions = (processStep, duration) => {
  const totalSession = 5.0;
  const session = 1.0 / totalSession;
  const processStart = processStep * session;
  const processEnd = (processStep + duration) * session;
  return { processStart, processEnd };
};

const calculateProcessStart = (processStep, duration) => {
  const { processStart, processEnd } = timeSessions(processStep, duration);
  return processStart;
};

const calculateProcessEnd = (processStep, duration) => {
  const { processStart, processEnd } = timeSessions(processStep, duration);
  return processEnd;
};

const speed = 0.1;
const blend = 0.03; // half-width of the crossfade, in timeline units

/**
 * Rust
 */
const rustMaterial = new CustomShaderMaterial({
  baseMaterial: THREE.MeshStandardMaterial,
  silent: true,

  map: baseColorTexture,
  normalMap: normalTexture,
  aoMap: armTexture,
  roughnessMap: armTexture,
  metalnessMap: armTexture,

  metalness: 0.0,
  roughness: 1.0,

  vertexShader: rustVertexShader,
  fragmentShader: rustFragmentShader,

  uniforms: {
    uTime: new THREE.Uniform(0),
    uSpeed: new THREE.Uniform(speed),
    uBlend: new THREE.Uniform(blend),
    uProcessStart: new THREE.Uniform(calculateProcessStart(0, 2)),
    uProcessEnd: new THREE.Uniform(calculateProcessEnd(0, 2)),
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

gltf.scene.traverse((child) => {
  if (child.isMesh) {
    child.material = rustMaterial;
  }
});

const distant = 3;
// gltf.scene.position.x = distant * -2;
scene.add(gltf.scene); // .children[0]

/**
 * Iron
 */
const ironMaterial = new CustomShaderMaterial({
  baseMaterial: THREE.MeshStandardMaterial,
  silent: true,

  color: "#1b1817",
  normalMap: normalTexture,

  metalness: 0.8,
  roughness: 0.8,
  wireframe: false,

  vertexShader: ironVertexShader,
  fragmentShader: ironFragmentShader,

  uniforms: {
    uTime: new THREE.Uniform(0),
    uSpeed: new THREE.Uniform(speed),
    uBlend: new THREE.Uniform(blend),
    uProcessStart: new THREE.Uniform(calculateProcessStart(2, 2)),
    uProcessEnd: new THREE.Uniform(calculateProcessEnd(2, 2)),
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const iron = new THREE.Mesh(baseGeometry.instance, ironMaterial);
// iron.position.x = gltf.scene.position.x + distant;
scene.add(iron);

/**
 * Zinc
 */
const zincMaterial = new CustomShaderMaterial({
  baseMaterial: THREE.MeshPhysicalMaterial,
  silent: true,

  color: "#ffffff",
  normalMap: normalTexture,
  normalScale: new THREE.Vector2(0.05, 0.05),

  metalness: 1,
  roughness: 0,
  wireframe: false,

  vertexShader: zincVertexShader,
  fragmentShader: zincFragmentShader,

  uniforms: {
    uTime: new THREE.Uniform(0),
    uSpeed: new THREE.Uniform(speed),
    uBlend: new THREE.Uniform(blend),
    uProcessStart: new THREE.Uniform(calculateProcessStart(4, 1)),
    uProcessEnd: new THREE.Uniform(calculateProcessEnd(4, 1)),
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const zinc = new THREE.Mesh(baseGeometry.instance, zincMaterial);
// zinc.position.x = iron.position.x + distant;
scene.add(zinc);

/**
 * GPU Compute
 */
// Setup
const gpgpu = {};
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count));
gpgpu.computation = new GPUComputationRenderer(
  gpgpu.size,
  gpgpu.size,
  renderer,
);

// Base particles
const baseParticlesTexture = gpgpu.computation.createTexture();

for (let i = 0; i < baseGeometry.count; i++) {
  const i3 = i * 3;
  const i4 = i * 4;

  // Position based on geometry
  baseParticlesTexture.image.data[i4 + 0] =
    baseGeometry.instance.attributes.position.array[i3 + 0];
  baseParticlesTexture.image.data[i4 + 1] =
    baseGeometry.instance.attributes.position.array[i3 + 1];
  baseParticlesTexture.image.data[i4 + 2] =
    baseGeometry.instance.attributes.position.array[i3 + 2];
  baseParticlesTexture.image.data[i4 + 3] = Math.random();
}

// Particles variable
gpgpu.particlesVariable = gpgpu.computation.addVariable(
  "uParticles",
  gpgpuParticlesShader,
  baseParticlesTexture,
);
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [
  gpgpu.particlesVariable,
]);

// Uniforms
gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0);
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0);
gpgpu.particlesVariable.material.uniforms.uBase = new THREE.Uniform(
  baseParticlesTexture,
);
gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence =
  new THREE.Uniform(1);
gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength =
  new THREE.Uniform(0.5);
gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency =
  new THREE.Uniform(0.5);

// Init
gpgpu.computation.init();

//Debug
gpgpu.debug = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 3),
  new THREE.MeshBasicMaterial({
    map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable)
      .texture,
  }),
);
gpgpu.debug.position.x = 3;
gpgpu.debug.visible = false;
scene.add(gpgpu.debug);

/**
 * Particles
 */
const particles = {};

// Geometry
const particlesUvArray = new Float32Array(gpgpu.size * gpgpu.size * 2);
const sizesArray = new Float32Array(gpgpu.size * gpgpu.size);

for (let y = 0; y < gpgpu.size; y++) {
  for (let x = 0; x < gpgpu.size; x++) {
    const i = y * gpgpu.size + x;
    const i2 = i * 2;

    const uvX = (x + 0.5) / gpgpu.size;
    const uvY = (y + 0.5) / gpgpu.size;

    particlesUvArray[i2 + 0] = uvX;
    particlesUvArray[i2 + 1] = uvY;

    // Size
    sizesArray[i] = Math.random();
  }
}

particles.geometry = new THREE.BufferGeometry();
particles.geometry.setDrawRange(0, baseGeometry.count);
particles.geometry.setAttribute(
  "aParticlesUv",
  new THREE.BufferAttribute(particlesUvArray, 2),
);
particles.geometry.setAttribute(
  "aColor",
  baseGeometry.instance.attributes.color,
);
particles.geometry.setAttribute(
  "aSize",
  new THREE.BufferAttribute(sizesArray, 1),
);

// Material
particles.material = new THREE.ShaderMaterial({
  vertexShader: particlesVertexShader,
  fragmentShader: particlesFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uSize: new THREE.Uniform(0.09),
    uResolution: new THREE.Uniform(
      new THREE.Vector2(
        sizes.width * sizes.pixelRatio,
        sizes.height * sizes.pixelRatio,
      ),
    ),
    uParticlesTexture: new THREE.Uniform(),
    uSpeed: new THREE.Uniform(speed),
    uBlend: new THREE.Uniform(blend),
    uProcessStart: new THREE.Uniform(calculateProcessStart(1, 1)),
    uProcessEnd: new THREE.Uniform(calculateProcessEnd(1, 1)),
  },
  transparent: true,
  depthWrite: false,
  // blending: THREE.AdditiveBlending,
});

// Points
particles.points = new THREE.Points(particles.geometry, particles.material);
// particles.points.position.x = zinc.position.x + distant;
scene.add(particles.points);

/**
 * Tweaks
 */
gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});
gui
  .add(particles.material.uniforms.uSize, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uSize");
gui
  .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uFlowFieldInfluence");
gui
  .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength, "value")
  .min(0)
  .max(10)
  .name("uFlowFieldStrength");
gui
  .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uFlowFieldFrequency");

/**
 * Electron
 */
const holography = {};
holography.geometry = baseGeometry.instance;

holography.materialParameters = {};
holography.materialParameters.color = "#70c1ff";

gui.addColor(holography.materialParameters, "color").onChange(() => {
  holography.material.uniforms.uColor.value.set(
    holography.materialParameters.color,
  );
});

holography.material = new THREE.ShaderMaterial({
  vertexShader: holographicVertexShader,
  fragmentShader: holographicFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uColor: new THREE.Uniform(
      new THREE.Color(holography.materialParameters.color),
    ),
    uSpeed: new THREE.Uniform(speed),
    uBlend: new THREE.Uniform(blend),
    uProcessStart: new THREE.Uniform(calculateProcessStart(3, 1)),
    uProcessEnd: new THREE.Uniform(calculateProcessEnd(3, 1)),
    uProcessTime: new THREE.Uniform(0),
  },
  wireframe: false,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

holography.mesh = new THREE.Mesh(holography.geometry, holography.material);
holography.mesh.scale.set(1.01, 1.01, 1.01);
// holography.mesh.position.x = particles.points.position.x + distant;
scene.add(holography.mesh);

/**
 * Workflow State & Navigation
 */
const TOTAL_STAGES = 5;
const period = 1 / speed; // seconds per full timeline loop
const SWEEP_RATE = 4; // higher = snappier jump between stages

// Middle of each stage's window, in timeline seconds → [1, 3, 5, 7, 9]
const stageTimes = Array.from(
  { length: TOTAL_STAGES },
  (_, i) => ((i + 0.5) / TOTAL_STAGES) * period,
);

let time = 0;
let targetTime = null; // null = playing, number = holding / easing to a stage

const navItems = document.querySelectorAll(".nav-item");

document.querySelector(".nav-bar").addEventListener("click", (event) => {
  const button = event.target.closest(".nav-item");
  if (!button) return;

  targetTime =
    button.dataset.action === "play"
      ? null
      : stageTimes[Number(button.dataset.stage)];

  navItems.forEach((btn) => btn.classList.toggle("active", btn === button));
});

const stageButtons = document.querySelectorAll(".nav-item[data-stage]");
let currentStage = -1;

// Highlights the stage the auto-play timeline is passing through (-1 = none)
const setCurrentStage = (stage) => {
  if (stage === currentStage) return;
  currentStage = stage;

  stageButtons.forEach((btn) => {
    btn.classList.toggle("current", Number(btn.dataset.stage) === stage);
  });
};

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = Math.min(elapsedTime - previousTime, 0.1);
  previousTime = elapsedTime;

  if (targetTime === null) {
    time += deltaTime;
  } else {
    // ease along the shortest way round the loop
    const diff =
      THREE.MathUtils.euclideanModulo(targetTime - time + period / 2, period) -
      period / 2;
    time += diff * (1 - Math.exp(-deltaTime * SWEEP_RATE));
  }
  time = THREE.MathUtils.euclideanModulo(time, period);

  // Highlight the current stage only in auto mode
  setCurrentStage(
    targetTime === null
      ? Math.floor((time / period) * TOTAL_STAGES) % TOTAL_STAGES
      : -1,
  );

  // Rust
  rustMaterial.uniforms.uTime.value = time;

  // GPGPU/particles Update
  gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime;
  gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime;

  gpgpu.computation.compute();
  particles.material.uniforms.uTime.value = time;
  particles.material.uniforms.uParticlesTexture.value =
    gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture;

  // Iron
  ironMaterial.uniforms.uTime.value = time;

  // Holography (glitch/stripes keep running on elapsed time, the window follows `time`)
  holography.material.uniforms.uTime.value = elapsedTime;
  holography.material.uniforms.uProcessTime.value = time;

  // Zinc
  zincMaterial.uniforms.uTime.value = time;

  // Update controls
  controls.update();

  // console.log(camera.position);

  // Render normal scene
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
