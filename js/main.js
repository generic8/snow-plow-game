import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* =========================
   BASIC SETUP
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

/* =========================
   LOAD 3D JEEP MODEL
========================= */
let jeepModel = null;
let jeepLoaded = false;
const gltfLoader = new GLTFLoader();

const loadingDiv = document.createElement("div");
loadingDiv.style.position = "fixed";
loadingDiv.style.top = "50%";
loadingDiv.style.left = "50%";
loadingDiv.style.transform = "translate(-50%, -50%)";
loadingDiv.style.color = "white";
loadingDiv.style.fontSize = "20px";
loadingDiv.style.fontFamily = "Arial";
loadingDiv.style.background = "rgba(0,0,0,0.8)";
loadingDiv.style.padding = "20px 30px";
loadingDiv.style.borderRadius = "10px";
loadingDiv.style.zIndex = "999999";
loadingDiv.textContent = "Loading 3D Snow Plow Jeep...";
document.body.appendChild(loadingDiv);

gltfLoader.load(
  './snow_plow_jeep.glb',
  (gltf) => {
    jeepModel = gltf.scene;
    jeepModel.scale.set(0.8, 0.8, 0.8);
    jeepModel.rotation.y = Math.PI;
    jeepLoaded = true;
    loadingDiv.textContent = "✅ Jeep Loaded!";
    setTimeout(() => loadingDiv.remove(), 1500);
  },
  undefined,
  (error) => {
    console.error("Error loading Jeep:", error);
    loadingDiv.textContent = "❌ Failed to load Jeep";
    setTimeout(() => loadingDiv.remove(), 3000);
  }
);

/* =========================
   UI (Start Screen + HUD + Minimap + Win Screen)
========================= */

// --- Start Screen ---
const startScreen = document.createElement("div");
startScreen.style.position = "fixed";
startScreen.style.inset = "0";
startScreen.style.zIndex = "100000";
startScreen.style.display = "flex";
startScreen.style.alignItems = "center";
startScreen.style.justifyContent = "center";
startScreen.style.background = "rgba(0,0,0,0.75)";
startScreen.style.fontFamily = "Arial";

startScreen.innerHTML = `
  <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); padding:22px 24px; border-radius:14px; width:360px; color:white; text-align:center;">
    <div style="font-size:22px; font-weight:bold; margin-bottom:6px;">Snow Plow</div>
    <div style="font-size:14px; opacity:0.9; margin-bottom:14px;">Choose your vehicle, then start.</div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
      <button id="vehPickup" style="padding:10px; cursor:pointer; border-radius:10px;">
        <div style="font-weight:bold;">Pickup</div>
        <div style="font-size:12px; opacity:0.8;">Fast • Small blade</div>
      </button>
 <button id="vehHeavy" style="padding:10px; cursor:pointer; border-radius:10px;">
        <div style="font-weight:bold; font-size:13px;">Heavy Plow</div>
        <div style="font-size:11px; opacity:0.8;">Slower • Wide blade</div>
      </button>
      <button id="vehJeep" style="padding:10px; cursor:pointer; border-radius:10px; border:2px solid #4fc3f7;">
        <div style="font-weight:bold; font-size:13px;">🚙 Snow Jeep</div>
        <div style="font-size:11px; opacity:0.8;">Balanced • 3D!</div>
      </button>
    </div>

    <button id="startBtn" style="width:100%; padding:10px 12px; cursor:pointer; font-size:15px;" disabled>
      Select a vehicle to start
    </button>

    <div style="font-size:12px; opacity:0.8; margin-top:12px;">Controls: W/A/S/D</div>
  </div>
`;
document.body.appendChild(startScreen);

const startBtn = document.getElementById("startBtn");
const vehPickup = document.getElementById("vehPickup");
const vehHeavy = document.getElementById("vehHeavy");
const vehJeep = document.getElementById("vehJeep");

// --- HUD ---
const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.top = "12px";
hud.style.left = "12px";
hud.style.zIndex = "99999";
hud.style.background = "rgba(0,0,0,0.6)";
hud.style.color = "white";
hud.style.padding = "10px 12px";
hud.style.font = "14px Arial";
hud.style.borderRadius = "8px";
hud.style.userSelect = "none";
hud.style.display = "none";
hud.innerHTML = `
  <div style="font-weight:bold; margin-bottom:6px;">Snow Plow</div>
  <div id="snowPct">Snow cleared: 0%</div>
  <div id="targetLine" style="margin-top:4px;">Target: 20%</div>
  <div id="damagePct" style="margin-top:4px;">Damage: 0%</div>
  <button id="resetSnowBtn" style="margin-top:8px; padding:6px 10px; cursor:pointer;">Reset snow</button>
`;
document.body.appendChild(hud);

const snowPctEl = document.getElementById("snowPct");
const targetLineEl = document.getElementById("targetLine");
const damagePctEl = document.getElementById("damagePct");
const resetSnowBtn = document.getElementById("resetSnowBtn");

// --- Minimap (top-right) ---
const minimap = document.createElement("canvas");
minimap.width = 180;
minimap.height = 180;
minimap.style.position = "fixed";
minimap.style.top = "12px";
minimap.style.right = "12px";
minimap.style.zIndex = "99999";
minimap.style.borderRadius = "10px";
minimap.style.border = "1px solid rgba(255,255,255,0.25)";
minimap.style.background = "rgba(0,0,0,0.35)";
minimap.style.display = "none";
document.body.appendChild(minimap);

const mm = minimap.getContext("2d");

// --- Win Screen ---
const winScreen = document.createElement("div");
winScreen.style.position = "fixed";
winScreen.style.inset = "0";
winScreen.style.zIndex = "100001";
winScreen.style.display = "none";
winScreen.style.alignItems = "center";
winScreen.style.justifyContent = "center";
winScreen.style.background = "rgba(0,0,0,0.75)";
winScreen.style.fontFamily = "Arial";
winScreen.innerHTML = `
  <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); padding:22px 24px; border-radius:14px; width:360px; color:white; text-align:center;">
    <div style="font-size:22px; font-weight:bold; margin-bottom:8px;">MISSION COMPLETE ✅</div>
    <div id="winStats" style="font-size:14px; opacity:0.95; margin-bottom:14px;">Stats</div>
    <button id="playAgainBtn" style="width:100%; padding:10px 12px; cursor:pointer; font-size:15px;">Play again</button>
  </div>
`;
document.body.appendChild(winScreen);

const winStatsEl = document.getElementById("winStats");
const playAgainBtn = document.getElementById("playAgainBtn");

/* =========================
   GAME STATE + VEHICLE PRESETS
========================= */
let gameStarted = false;

let missionTargetPct = 20;
let missionComplete = false;
targetLineEl.textContent = `Target: ${missionTargetPct}%`;

const VEHICLES = {
  pickup: { name: "Pickup", maxSpeed: 0.32, turnSpeed: 0.04, clearRadius: 24, bodyColor: 0x333333, use3D: false },
  heavy: { name: "Heavy", maxSpeed: 0.22, turnSpeed: 0.028, clearRadius: 40, bodyColor: 0x222244, use3D: false },
  jeep: { name: "Snow Jeep", maxSpeed: 0.28, turnSpeed: 0.035, clearRadius: 32, bodyColor: 0x2a4a6a, use3D: true }
};

let selectedVehicle = null;
let selectedVehicleKey = null;
function setSelected(key) {
  selectedVehicleKey = key;
  selectedVehicle = VEHICLES[key];
  vehPickup.style.outline = key === "pickup" ? "2px solid #fff" : "none";
  vehHeavy.style.outline = key === "heavy" ? "2px solid #fff" : "none";
  vehJeep.style.outline = key === "jeep" ? "2px solid #fff" : "none";
  startBtn.disabled = false;
  startBtn.textContent = `Start with ${selectedVehicle.name}`;
}

vehPickup.addEventListener("click", () => setSelected("pickup"));
vehHeavy.addEventListener("click", () => setSelected("heavy"));
vehJeep.addEventListener("click", () => setSelected("jeep"));


/* =========================
   WORLD / CITY SETTINGS
========================= */
const GROUND_SIZE = 200;
const HALF = GROUND_SIZE / 2;

const ROAD_WIDTH = 10;
const ROAD_LENGTH = GROUND_SIZE;
const BLOCK_SPACING = 26;
const ROAD_COUNT_EACH_SIDE = 3;

/* =========================
   PHOTOREALISTIC SWISS ALPS BACKDROP
========================= */

/* GRADIENT SKY - FIXED */
const skyGeo = new THREE.SphereGeometry(500, 32, 15);
const skyMat = new THREE.ShaderMaterial({
  uniforms: {
    topColor: { value: new THREE.Color(0x5588ff) },
    bottomColor: { value: new THREE.Color(0xbbd9f5) },
    offset: { value: 33 },
    exponent: { value: 0.45 }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    
    varying vec3 vWorldPosition;
    
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `,
  side: THREE.BackSide
});

const skyMesh = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyMesh);

/* SUN LIGHT */
const sunLight = new THREE.DirectionalLight(0xfffaed, 1.8);
sunLight.position.set(80, 120, 80);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x362312, 0.5);
scene.add(hemiLight);

/* PROCEDURAL MOUNTAIN GEOMETRY with FBM NOISE */
const mountainsGroup = new THREE.Group();
scene.add(mountainsGroup);

function noise3D(x, y, z) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function fbm(x, y, octaves = 6) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += noise3D(x * frequency, y * frequency, i * 0.1) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value / maxValue;
}

function createRealisticMountainRange(config) {
  const { width, depth, maxHeight, segments, position, layer } = config;
  
  const geometry = new THREE.PlaneGeometry(width, depth, segments, segments);
  
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 1];
    
    const noiseScale = 0.015;
    let height = fbm(x * noiseScale, z * noiseScale, 6);
    
    const distFromCenter = Math.abs(x / width);
    const falloff = Math.pow(1 - Math.min(distFromCenter * 1.5, 1), 2);
    
    height = height * falloff * maxHeight;
    
    if (height > maxHeight * 0.4) {
      const peakFactor = (height - maxHeight * 0.4) / (maxHeight * 0.6);
      height += Math.pow(peakFactor, 2) * maxHeight * 0.3;
    }
    
    vertices[i + 2] = height;
  }
  
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      snowLine: { value: maxHeight * 0.6 },
      maxHeight: { value: maxHeight },
      rockColor: { value: new THREE.Color(0x3a3633) },
      snowColor: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float snowLine;
      uniform float maxHeight;
      uniform vec3 rockColor;
      uniform vec3 snowColor;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        float height = vPosition.y;
        
        float snowMix = smoothstep(snowLine - 5.0, snowLine + 5.0, height);
        
        float noiseVal = noise(vPosition.xz * 0.1) * 0.3;
        snowMix = smoothstep(snowLine - 8.0 + noiseVal * 10.0, snowLine + 3.0 + noiseVal * 10.0, height);
        
        float slope = abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
        snowMix *= smoothstep(0.3, 0.8, slope);
        
        vec3 finalColor = mix(rockColor, snowColor, snowMix);
        
        vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
        float diffuse = max(dot(vNormal, lightDir), 0.0);
        
        float ambient = 0.45;
        float lighting = ambient + diffuse * 0.65;
        
        float rim = 1.0 - max(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0);
        rim = pow(rim, 3.0) * 0.2;
        
        finalColor *= lighting;
        finalColor += rim * vec3(0.9, 0.95, 1.0);
        
        finalColor += (noise(vPosition.xz * 0.05) - 0.5) * 0.03;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.receiveShadow = true;
  
  return mesh;
}

const mountain1 = createRealisticMountainRange({
  width: 400,
  depth: 80,
  maxHeight: 85,
  segments: 128,
  position: { x: 0, y: 0, z: 90 },
  layer: 1
});
mountainsGroup.add(mountain1);

const mountain2 = createRealisticMountainRange({
  width: 450,
  depth: 90,
  maxHeight: 75,
  segments: 96,
  position: { x: 0, y: 0, z: 120 },
  layer: 2
});
mountain2.material.uniforms.rockColor.value.setHex(0x454340);
mountainsGroup.add(mountain2);

const mountain3 = createRealisticMountainRange({
  width: 500,
  depth: 100,
  maxHeight: 65,
  segments: 80,
  position: { x: 0, y: 0, z: 150 },
  layer: 3
});
mountain3.material.uniforms.rockColor.value.setHex(0x5a5855);
mountainsGroup.add(mountain3);

for (let i = 1; i <= 3; i++) {
  const hazeMat = new THREE.MeshBasicMaterial({
    color: 0xc5d9eb,
    transparent: true,
    opacity: 0.15 * i,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  
  const hazePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 120),
    hazeMat
  );
  hazePlane.rotation.x = -Math.PI / 2;
  hazePlane.position.set(0, 1, 90 + i * 20);
  mountainsGroup.add(hazePlane);
}

/* ANIMATED VOLUMETRIC CLOUDS */
const cloudsGroup = new THREE.Group();
scene.add(cloudsGroup);

function perlinNoise(x, y, seed = 0) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  
  const u = xf * xf * (3.0 - 2.0 * xf);
  const v = yf * yf * (3.0 - 2.0 * yf);
  
  const hash = (x, y) => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  };
  
  const a = hash(X, Y);
  const b = hash(X + 1, Y);
  const c = hash(X, Y + 1);
  const d = hash(X + 1, Y + 1);
  
  const x1 = a + u * (b - a);
  const x2 = c + u * (d - c);
  
  return x1 + v * (x2 - x1);
}

function fbmNoise(x, y, octaves = 4) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += perlinNoise(x * frequency, y * frequency, i * 100) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value / maxValue;
}

function createRealisticCloudTexture(seed = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      
      const nx = x / canvas.width;
      const ny = y / canvas.height;
      
      let cloudDensity = fbmNoise(nx * 4 + seed, ny * 4 + seed, 5);
      
      cloudDensity = Math.pow(cloudDensity, 1.5);
      
      const edgeFade = Math.min(
        Math.min(nx, 1 - nx) * 3,
        Math.min(ny, 1 - ny) * 3
      );
      cloudDensity *= Math.min(edgeFade, 1);
      
      cloudDensity = Math.max(0, (cloudDensity - 0.3) * 1.8);
      
      const alpha = Math.min(255, cloudDensity * 255);
      
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = alpha;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const cloudLayers = [];
for (let i = 0; i < 5; i++) {
  const cloudTexture = createRealisticCloudTexture(i * 1000);
  
  const cloudMaterial = new THREE.MeshBasicMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.35 - i * 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending
  });
  
  const width = 600 + i * 100;
  const height = 300 + i * 50;
  
  const cloudPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height, 1, 1),
    cloudMaterial
  );
  
  cloudPlane.position.set(
    (i % 2) * 20 - 10,
    55 + i * 12,
    60 + i * 25
  );
  cloudPlane.rotation.x = -Math.PI / 2.2 - i * 0.02;
  
  cloudsGroup.add(cloudPlane);
  cloudLayers.push({
    mesh: cloudPlane,
    texture: cloudTexture,
    speed: 0.0015 + i * 0.0008,
    initialX: cloudPlane.position.x
  });
}

/* ATMOSPHERIC FOG */
scene.fog = new THREE.FogExp2(0xb5d9f0, 0.0055);

function updateMountainScene(deltaTime) {
  cloudLayers.forEach(layer => {
    layer.texture.offset.x += layer.speed * deltaTime * 0.01;
  });
}

/* =========================
   BASE GROUND
========================= */
const baseGround = new THREE.Mesh(
  new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
  new THREE.MeshStandardMaterial({ color: 0xa3a3a3, roughness: 1 })
);
baseGround.rotation.x = -Math.PI / 2;
baseGround.position.y = 0;
scene.add(baseGround);

/* =========================
   ROAD TEXTURES
========================= */
const ROAD_CANVAS_SIZE = 1024;
let _roadCanvases = null;

function _rand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function _makeRoadCanvases() {
  const cColor = document.createElement("canvas");
  cColor.width = ROAD_CANVAS_SIZE;
  cColor.height = ROAD_CANVAS_SIZE;
  const ctx = cColor.getContext("2d");

  const cRough = document.createElement("canvas");
  cRough.width = ROAD_CANVAS_SIZE;
  cRough.height = ROAD_CANVAS_SIZE;
  const rctx = cRough.getContext("2d");

  const cNormal = document.createElement("canvas");
  cNormal.width = ROAD_CANVAS_SIZE;
  cNormal.height = ROAD_CANVAS_SIZE;
  const nctx = cNormal.getContext("2d");

  ctx.fillStyle = "#2b2f33";
  ctx.fillRect(0, 0, ROAD_CANVAS_SIZE, ROAD_CANVAS_SIZE);

  const img = ctx.getImageData(0, 0, ROAD_CANVAS_SIZE, ROAD_CANVAS_SIZE);
  const data = img.data;

  const height = new Float32Array(ROAD_CANVAS_SIZE * ROAD_CANVAS_SIZE);

  for (let y = 0; y < ROAD_CANVAS_SIZE; y++) {
    for (let x = 0; x < ROAD_CANVAS_SIZE; x++) {
      const i = (y * ROAD_CANVAS_SIZE + x);

      const n1 = (Math.random() - 0.5) * 0.9;
      const n2 = (Math.random() - 0.5) * 0.45;
      const wear = (Math.random() - 0.5) * 0.06;

      const speck = (Math.random() < 0.04) ? (Math.random() * 0.35) : 0;

      const h = n1 + n2 + wear + speck;
      height[i] = h;
    }
  }

  for (let y = 0; y < ROAD_CANVAS_SIZE; y++) {
    for (let x = 0; x < ROAD_CANVAS_SIZE; x++) {
      const i = (y * ROAD_CANVAS_SIZE + x);
      const di = i * 4;

      const base = 42;
      const v = height[i] * 18;

      let r = base + v;
      let g = base + v + 2;
      let b = base + v + 5;

      if (_rand(i * 0.017) < 0.0022) {
        r -= 20; g -= 18; b -= 16;
      }

      const u = x / ROAD_CANVAS_SIZE;
      const tire1 = Math.exp(-Math.pow((u - 0.35) / 0.06, 2)) * 9;
      const tire2 = Math.exp(-Math.pow((u - 0.65) / 0.06, 2)) * 9;

      r -= (tire1 + tire2);
      g -= (tire1 + tire2);
      b -= (tire1 + tire2);

      data[di]     = Math.max(0, Math.min(255, r));
      data[di + 1] = Math.max(0, Math.min(255, g));
      data[di + 2] = Math.max(0, Math.min(255, b));
      data[di + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const edgeInset = Math.round(ROAD_CANVAS_SIZE * 0.08);
  const centerX = ROAD_CANVAS_SIZE / 2;

  ctx.strokeStyle = "rgba(245,245,245,0.85)";
  ctx.lineWidth = Math.max(6, Math.round(ROAD_CANVAS_SIZE * 0.012));
  ctx.beginPath();
  ctx.moveTo(edgeInset, 0); ctx.lineTo(edgeInset, ROAD_CANVAS_SIZE);
  ctx.moveTo(ROAD_CANVAS_SIZE - edgeInset, 0); ctx.lineTo(ROAD_CANVAS_SIZE - edgeInset, ROAD_CANVAS_SIZE);
  ctx.stroke();

  ctx.strokeStyle = "rgba(250,250,250,0.75)";
  ctx.lineWidth = Math.max(5, Math.round(ROAD_CANVAS_SIZE * 0.010));
  ctx.setLineDash([Math.round(ROAD_CANVAS_SIZE * 0.055), Math.round(ROAD_CANVAS_SIZE * 0.05)]);
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, ROAD_CANVAS_SIZE);
  ctx.stroke();
  ctx.setLineDash([]);

  const rimg = rctx.getImageData(0, 0, ROAD_CANVAS_SIZE, ROAD_CANVAS_SIZE);
  const rd = rimg.data;
  for (let i = 0; i < height.length; i++) {
    const di = i * 4;
    let rr = 210 + height[i] * 10;

    rd[di] = rd[di + 1] = rd[di + 2] = Math.max(0, Math.min(255, rr));
    rd[di + 3] = 255;
  }
  rctx.putImageData(rimg, 0, 0);

  const nimg = nctx.getImageData(0, 0, ROAD_CANVAS_SIZE, ROAD_CANVAS_SIZE);
  const nd = nimg.data;

  const strength = 2.2;
  function H(x, y) {
    x = Math.max(0, Math.min(ROAD_CANVAS_SIZE - 1, x));
    y = Math.max(0, Math.min(ROAD_CANVAS_SIZE - 1, y));
    return height[y * ROAD_CANVAS_SIZE + x];
  }

  for (let y = 0; y < ROAD_CANVAS_SIZE; y++) {
    for (let x = 0; x < ROAD_CANVAS_SIZE; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength;

      let nx = -dx, ny = -dy, nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;

      const di = (y * ROAD_CANVAS_SIZE + x) * 4;
      nd[di]     = Math.round((nx * 0.5 + 0.5) * 255);
      nd[di + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nd[di + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nd[di + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);

  return { cColor, cRough, cNormal };
}

function makeRoadMaps() {
  if (!_roadCanvases) _roadCanvases = _makeRoadCanvases();

  const colorTex = new THREE.CanvasTexture(_roadCanvases.cColor);
  colorTex.colorSpace = THREE.SRGBColorSpace;
  colorTex.wrapS = THREE.RepeatWrapping;
  colorTex.wrapT = THREE.RepeatWrapping;
  colorTex.anisotropy = 8;
  colorTex.needsUpdate = true;
  colorTex.generateMipmaps = true;
  colorTex.minFilter = THREE.LinearMipmapLinearFilter;
  colorTex.magFilter = THREE.LinearFilter;

  const roughTex = new THREE.CanvasTexture(_roadCanvases.cRough);
  roughTex.colorSpace = THREE.NoColorSpace;
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.anisotropy = 8;
  roughTex.needsUpdate = true;
  roughTex.generateMipmaps = true;
  roughTex.minFilter = THREE.LinearMipmapLinearFilter;  
  roughTex.magFilter = THREE.LinearFilter;

  const normalTex = new THREE.CanvasTexture(_roadCanvases.cNormal);
  normalTex.colorSpace = THREE.NoColorSpace;
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.anisotropy = 8;
  normalTex.needsUpdate = true;
  normalTex.generateMipmaps = true;
  normalTex.minFilter = THREE.LinearMipmapLinearFilter;
  normalTex.magFilter = THREE.LinearFilter;

  return { colorTex, roughTex, normalTex };
}

/* =========================
   ROADS
========================= */
const roadsGroup = new THREE.Group();
scene.add(roadsGroup);

function addRoadStrip({ horizontal, position }) {
  const geo = horizontal
    ? new THREE.PlaneGeometry(ROAD_LENGTH, ROAD_WIDTH)
    : new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH);

  const maps = makeRoadMaps();

  const mat = new THREE.MeshStandardMaterial({
    map: maps.colorTex,
    roughnessMap: maps.roughTex,
    normalMap: maps.normalTex,
    roughness: 1.0,
    metalness: 0.0,
    normalScale: new THREE.Vector2(0.22, 0.22)
  });

  const road = new THREE.Mesh(geo, mat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.01;

  if (horizontal) road.position.z = position;
  else road.position.x = position;

  const repX = horizontal ? (ROAD_LENGTH / 18) : 1;
  const repY = horizontal ? 1 : (ROAD_LENGTH / 18);

  road.material.map.repeat.set(repX, repY);
  road.material.roughnessMap.repeat.set(repX, repY);
  road.material.normalMap.repeat.set(repX, repY);

  road.material.map.needsUpdate = true;
  road.material.roughnessMap.needsUpdate = true;
  road.material.normalMap.needsUpdate = true;

  roadsGroup.add(road);
}

/* =========================
   SIDEWALKS + CURBS
========================= */
function addSidewalksForRoad({ horizontal, position }) {
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xb3b3b3, roughness: 1 });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x8f8f8f, roughness: 1 });

  const sidewalkWidth = 3.2;
  const curbWidth = 0.35;
  const curbHeight = 0.18;

  const long = ROAD_LENGTH;
  const short = ROAD_WIDTH;

  const sidewalkGeo = horizontal
    ? new THREE.PlaneGeometry(long, sidewalkWidth)
    : new THREE.PlaneGeometry(sidewalkWidth, long);

  const curbGeo = horizontal
    ? new THREE.BoxGeometry(long, curbHeight, curbWidth)
    : new THREE.BoxGeometry(curbWidth, curbHeight, long);

  function placePair(offset) {
    const s = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    s.rotation.x = -Math.PI / 2;
    s.position.y = 0.021;
    if (horizontal) s.position.set(0, 0.021, position + offset);
    else s.position.set(position + offset, 0.021, 0);
    scene.add(s);

    const c = new THREE.Mesh(curbGeo, curbMat);
    c.position.y = curbHeight / 2 + 0.021;
    if (horizontal) c.position.set(0, c.position.y, position + (offset > 0 ? (short / 2) : -(short / 2)));
    else c.position.set(position + (offset > 0 ? (short / 2) : -(short / 2)), c.position.y, 0);
    scene.add(c);
  }

  const offsetFromCenter = (ROAD_WIDTH / 2) + (sidewalkWidth / 2);
  placePair(+offsetFromCenter);
  placePair(-offsetFromCenter);
}

for (let i = -ROAD_COUNT_EACH_SIDE; i <= ROAD_COUNT_EACH_SIDE; i++) {
  const pos = i * BLOCK_SPACING;

  addRoadStrip({ horizontal: true, position: pos });
  addSidewalksForRoad({ horizontal: true, position: pos });

  addRoadStrip({ horizontal: false, position: pos });
  addSidewalksForRoad({ horizontal: false, position: pos });
}

/* =========================
   SWISS BUILDINGS
========================= */
const swissMaterials = {
  wood1: new THREE.MeshStandardMaterial({ color: 0x8B6F47, roughness: 0.95 }),
  wood2: new THREE.MeshStandardMaterial({ color: 0x6B4423, roughness: 0.95 }),
  wood3: new THREE.MeshStandardMaterial({ color: 0x4A3018, roughness: 0.95 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x6B6B6B, roughness: 1.0 }),
  roofDark: new THREE.MeshStandardMaterial({ color: 0x3A2818, roughness: 0.9 }),
  roofRed: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.85 }),
  shutterRed: new THREE.MeshStandardMaterial({ color: 0xA0301E, roughness: 0.7 }),
  shutterGreen: new THREE.MeshStandardMaterial({ color: 0x2F5233, roughness: 0.7 }),
  shutterBrown: new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.7 }),
};

const buildingsGroup = new THREE.Group();
scene.add(buildingsGroup);
const buildings = [];

function createSwissChalet(x, z, size) {
  const chalet = new THREE.Group();
  
  const dimensions = size === 'small' 
    ? { w: 6, h: 4, d: 5 }
    : { w: 8, h: 5, d: 7 };
  
  const stoneHeight = 1.2;
  const woodHeight = dimensions.h - stoneHeight;
  
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(dimensions.w, stoneHeight, dimensions.d),
    swissMaterials.stone
  );
  foundation.position.y = stoneHeight / 2;
  chalet.add(foundation);
  
  const woodTypes = [swissMaterials.wood1, swissMaterials.wood2, swissMaterials.wood3];
  const woodMat = woodTypes[Math.floor(Math.random() * woodTypes.length)];
  
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(dimensions.w, woodHeight, dimensions.d),
    woodMat
  );
  walls.position.y = stoneHeight + woodHeight / 2;
  chalet.add(walls);
  
  const roofHeight = dimensions.w * 0.5;
  const roofGeo = new THREE.ConeGeometry(dimensions.w * 0.8, roofHeight, 4);
  const roofMat = Math.random() > 0.5 ? swissMaterials.roofDark : swissMaterials.roofRed;
  
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = stoneHeight + woodHeight + roofHeight / 2;
  roof.rotation.y = Math.PI / 4;
  chalet.add(roof);
  
  const balconyWidth = dimensions.w * 0.8;
  const balcony = new THREE.Mesh(
    new THREE.BoxGeometry(balconyWidth, 0.15, 1.2),
    woodMat
  );
  balcony.position.set(0, stoneHeight + woodHeight * 0.6, dimensions.d / 2 + 0.5);
  chalet.add(balcony);
  
  for (let i = -1; i <= 1; i += 0.4) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.6, 0.08),
      woodMat
    );
    post.position.set(
      i * balconyWidth * 0.4,
      stoneHeight + woodHeight * 0.6 + 0.4,
      dimensions.d / 2 + 1.0
    );
    chalet.add(post);
  }
  
  const shutterMats = [swissMaterials.shutterRed, swissMaterials.shutterGreen, swissMaterials.shutterBrown];
  const shutterMat = shutterMats[Math.floor(Math.random() * shutterMats.length)];
  
  for (let wx = -1; wx <= 1; wx += 2) {
    const shutterL = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.8, 0.05),
      shutterMat
    );
    shutterL.position.set(
      wx * dimensions.w * 0.25 - 0.25,
      stoneHeight + woodHeight * 0.5,
      dimensions.d / 2 + 0.01
    );
    chalet.add(shutterL);
    
    const shutterR = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.8, 0.05),
      shutterMat
    );
    shutterR.position.set(
      wx * dimensions.w * 0.25 + 0.25,
      stoneHeight + woodHeight * 0.5,
      dimensions.d / 2 + 0.01
    );
    chalet.add(shutterR);
  }
  
  chalet.position.set(x, 0, z);
  return chalet;
}

function addBuilding(buildingGroup, x, z, radius) {
  buildingsGroup.add(buildingGroup);
  buildings.push({ mesh: buildingGroup, x, z, radius });
}

const blockSize = BLOCK_SPACING - ROAD_WIDTH;

for (let bx = -2; bx <= 2; bx++) {
  for (let bz = -2; bz <= 2; bz++) {
    const centerX = bx * BLOCK_SPACING + BLOCK_SPACING / 2;
    const centerZ = bz * BLOCK_SPACING + BLOCK_SPACING / 2;

    if (Math.abs(centerX) > HALF - BLOCK_SPACING || Math.abs(centerZ) > HALF - BLOCK_SPACING) continue;

    const count = 1 + ((bx + bz + 10) % 2);

    for (let i = 0; i < count; i++) {
      const size = Math.random() > 0.5 ? 'small' : 'large';
      
      const offsetX = ((i - 0.5) * 8);
      const offsetZ = ((0.5 - i) * 8);

      const chalet = createSwissChalet(centerX + offsetX, centerZ + offsetZ, size);
      const radius = size === 'small' ? 4 : 5.5;
      
      addBuilding(chalet, centerX + offsetX, centerZ + offsetZ, radius);
    }
  }
}

/* =========================
   SNOW MASK + SNOW
========================= */
const maskSize = 1024;
const maskCanvas = document.createElement("canvas");
maskCanvas.width = maskSize;
maskCanvas.height = maskSize;
const maskCtx = maskCanvas.getContext("2d");

const maskTexture = new THREE.CanvasTexture(maskCanvas);
maskTexture.colorSpace = THREE.NoColorSpace;
maskTexture.minFilter = THREE.LinearFilter;
maskTexture.magFilter = THREE.LinearFilter;

const snow = new THREE.Mesh(
  new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    alphaMap: maskTexture,
    transparent: true,
    opacity: 0.88,
    roughness: 1.0,
    metalness: 0.0,
    depthWrite: false
  })
);

snow.rotation.x = -Math.PI / 2;
snow.position.y = 0.035;
scene.add(snow);

function worldToMask(x, z) {
  const u = (x + HALF) / GROUND_SIZE;
  const v = (-z + HALF) / GROUND_SIZE;

  if (u < 0 || u > 1 || v < 0 || v > 1) return null;

  return {
    x: Math.floor(u * maskSize),
    y: Math.floor((1 - v) * maskSize)
  };
}

function drawRoadSnowMask() {
  maskCtx.fillStyle = "black";
  maskCtx.fillRect(0, 0, maskSize, maskSize);

  maskCtx.fillStyle = "white";

  function drawWorldRectSnow(centerX, centerZ, sizeX, sizeZ) {
    const left = centerX - sizeX / 2;
    const right = centerX + sizeX / 2;
    const top = centerZ + sizeZ / 2;
    const bottom = centerZ - sizeZ / 2;

    const p1 = worldToMask(left, top);
    const p2 = worldToMask(right, bottom);
    if (!p1 || !p2) return;

    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p1.x - p2.x);
    const h = Math.abs(p1.y - p2.y);

    maskCtx.fillRect(x, y, w, h);
  }

  for (let i = -ROAD_COUNT_EACH_SIDE; i <= ROAD_COUNT_EACH_SIDE; i++) {
    const pos = i * BLOCK_SPACING;
    drawWorldRectSnow(0, pos, ROAD_LENGTH, ROAD_WIDTH);
    drawWorldRectSnow(pos, 0, ROAD_WIDTH, ROAD_LENGTH);
  }

  maskTexture.needsUpdate = true;
}

let totalRoadSamples = 1;

function recomputeTotalRoadSamples() {
  const img = maskCtx.getImageData(0, 0, maskSize, maskSize).data;
  let road = 0;
  for (let i = 0; i < img.length; i += 4 * 8) {
    if (img[i] > 128) road++;
  }
  totalRoadSamples = Math.max(1, road);
}

/* =========================
   DAMAGE + RESET + CLEARING
========================= */
let damage = 0;

function resetSnow() {
  drawRoadSnowMask();
  recomputeTotalRoadSamples();
  maskTexture.needsUpdate = true;

  damage = 0;
  damagePctEl.textContent = "Damage: 0%";
}

resetSnow();
resetSnowBtn.addEventListener("click", () => resetSnow());

function clearSnow(x, z, radiusPx) {
  const p = worldToMask(x, z);
  if (!p) return;

  maskCtx.fillStyle = "black";
  maskCtx.beginPath();
  maskCtx.arc(p.x, p.y, radiusPx, 0, Math.PI * 2);
  maskCtx.fill();

  maskTexture.needsUpdate = true;
}

/* =========================
   VEHICLE
========================= */
const vehicle = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.6, 2),
  new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 })
);
body.position.y = 0.4;
vehicle.add(body);

const blade = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.2, 0.2),
  new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.7 })
);
blade.position.set(0, 0.25, 1.1);
vehicle.add(blade);

scene.add(vehicle);
const bladeWorldPos = new THREE.Vector3();

/* =========================
   CONTROLS
========================= */
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = true;
});

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = false;
});

/* =========================
   MOVEMENT SETTINGS
========================= */
let speed = 0;
let maxSpeed = 0.25;
const accel = 0.01;
const friction = 0.008;
let turnSpeed = 0.03;
let clearRadiusPx = 30;

/* =========================
   CAMERA
========================= */
camera.position.set(0, 3, -6);
camera.lookAt(0, 0.5, 0);

/* =========================
   START GAME
========================= */
startBtn.addEventListener("click", () => {
  if (!selectedVehicle) return;

  maxSpeed = selectedVehicle.maxSpeed;
  turnSpeed = selectedVehicle.turnSpeed;
  clearRadiusPx = selectedVehicle.clearRadius;
  body.material.color.setHex(selectedVehicle.bodyColor);

  vehicle.position.set(0, 0, 0);
  vehicle.rotation.set(0, 0, 0);
  speed = 0;

  missionComplete = false;
  missionTargetPct = 20;
  targetLineEl.textContent = `Target: ${missionTargetPct}%`;
  resetSnow();
  
  // Handle 3D Jeep model
  if (selectedVehicleKey === "jeep" && jeepLoaded && jeepModel) {
    body.visible = false;
    blade.visible = false;
    if (!vehicle.userData.jeepAdded) {
      const jeepClone = jeepModel.clone();
      jeepClone.position.set(0, 0.5, 0);
      jeepClone.rotation.y = Math.PI;  // Rotate 180 degrees
      vehicle.add(jeepClone);
      vehicle.userData.jeepAdded = true;
      vehicle.userData.jeepMesh = jeepClone;
    }
    vehicle.userData.jeepMesh.visible = true;
  } else {
    body.visible = true;
    blade.visible = true;
    if (vehicle.userData.jeepMesh) {
      vehicle.userData.jeepMesh.visible = false;
    }
  }
  
  gameStarted = true;
  startScreen.style.display = "none";
  hud.style.display = "block";
  minimap.style.display = "block";
});

/* =========================
   PLAY AGAIN
========================= */
playAgainBtn.addEventListener("click", () => {
  winScreen.style.display = "none";
  startScreen.style.display = "flex";
  hud.style.display = "none";
  minimap.style.display = "none";

  missionComplete = false;
  gameStarted = false;

  resetSnow();

  selectedVehicle = null;
  startBtn.disabled = true;
  startBtn.textContent = "Select a vehicle to start";
  vehPickup.style.outline = "none";
  vehHeavy.style.outline = "none";
  vehJeep.style.outline = "none";
});

/* =========================
   MINIMAP MAPPING
========================= */
function worldToMinimap(x, z, w, h) {
  const u = (x + HALF) / GROUND_SIZE;
  const v = (z + HALF) / GROUND_SIZE;

  const x0 = u * w;
  const y0 = (1 - v) * h;

  return { x: w - x0, y: y0 };
}

/* =========================
   LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) {
    try {
      const deltaTime = clock.getDelta() * 1000;
      updateMountainScene(deltaTime);
    } catch (e) {
      console.warn("Mountain scene update error:", e);
    }
    renderer.render(scene, camera);
    return;
  }

  const deltaTime = clock.getDelta() * 1000;
  
  try {
    updateMountainScene(deltaTime);
  } catch (e) {
    console.warn("Mountain scene update error:", e);
  }

  if (keys.w) speed += accel;
  if (keys.s) speed -= accel;
  speed = Math.max(-maxSpeed, Math.min(maxSpeed, speed));

  if (!keys.w && !keys.s) {
    if (speed > 0) speed = Math.max(0, speed - friction);
    if (speed < 0) speed = Math.min(0, speed + friction);
  }

  if (Math.abs(speed) > 0.001) {
    if (keys.a) vehicle.rotation.y += turnSpeed;
    if (keys.d) vehicle.rotation.y -= turnSpeed;
  }

  const prevX = vehicle.position.x;
  const prevZ = vehicle.position.z;

  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(vehicle.quaternion);
  vehicle.position.addScaledVector(forward, speed);

  const vehicleRadius = 1.2;
  for (const b of buildings) {
    const dx = vehicle.position.x - b.x;
    const dz = vehicle.position.z - b.z;
    const dist = Math.hypot(dx, dz);

    if (dist < vehicleRadius + b.radius) {
      vehicle.position.x = prevX;
      vehicle.position.z = prevZ;

      speed = -speed * 0.3;

      damage = Math.min(100, damage + 2);
      damagePctEl.textContent = `Damage: ${Math.round(damage)}%`;
      break;
    }
  }

  if (Math.abs(speed) > 0.002) {
    blade.getWorldPosition(bladeWorldPos);
    clearSnow(bladeWorldPos.x, bladeWorldPos.z, clearRadiusPx);
  }

  const camOffset = new THREE.Vector3(0, 3, -6).applyQuaternion(vehicle.quaternion);
  camera.position.copy(vehicle.position).add(camOffset);
  camera.lookAt(vehicle.position.x, 0.5, vehicle.position.z);

  if (!animate._lastPctUpdate) animate._lastPctUpdate = 0;
  const now = performance.now();

  if (now - animate._lastPctUpdate > 250) {
    animate._lastPctUpdate = now;

    const img = maskCtx.getImageData(0, 0, maskSize, maskSize).data;
    let snowyRoad = 0;
    for (let i = 0; i < img.length; i += 4 * 8) {
      if (img[i] > 128) snowyRoad++;
    }

    const cleared = Math.max(0, totalRoadSamples - snowyRoad);
    const pct = Math.round((cleared / totalRoadSamples) * 100);
    snowPctEl.textContent = `Snow cleared: ${pct}%`;

    if (!missionComplete && pct >= missionTargetPct) {
      missionComplete = true;
      gameStarted = false;
      winStatsEl.textContent = `Cleared: ${pct}% • Damage: ${Math.round(damage)}%`;
      winScreen.style.display = "flex";
    }
  }

  if (!animate._lastMinimapUpdate) animate._lastMinimapUpdate = 0;
  const mmNow = performance.now();
  if (mmNow - animate._lastMinimapUpdate > 100) {
    animate._lastMinimapUpdate = mmNow;

    const w = minimap.width;
    const h = minimap.height;

    mm.clearRect(0, 0, w, h);

    mm.fillStyle = "rgba(0,0,0,0.55)";
    mm.fillRect(0, 0, w, h);

    mm.save();
    mm.globalAlpha = 0.55;
    mm.imageSmoothingEnabled = true;
    mm.translate(w, h);
    mm.scale(-1, -1);
    mm.drawImage(maskCanvas, 0, 0, w, h);
    mm.restore();

    mm.save();
    mm.strokeStyle = "rgba(255,255,255,0.18)";
    mm.lineWidth = 1;

    function toMMNoFlip(x, z) {
      const u = (x + HALF) / GROUND_SIZE;
      const v = (z + HALF) / GROUND_SIZE;
      return { x: u * w, y: (1 - v) * h };
    }

    for (let i = -ROAD_COUNT_EACH_SIDE; i <= ROAD_COUNT_EACH_SIDE; i++) {
      const pos = i * BLOCK_SPACING;

      {
        const a = toMMNoFlip(-HALF, pos);
        const b = toMMNoFlip(HALF, pos);
        mm.beginPath();
        mm.moveTo(a.x, a.y);
        mm.lineTo(b.x, b.y);
        mm.stroke();
      }

      {
        const a = toMMNoFlip(pos, -HALF);
        const b = toMMNoFlip(pos, HALF);
        mm.beginPath();
        mm.moveTo(a.x, a.y);
        mm.lineTo(b.x, b.y);
        mm.stroke();
      }
    }
    mm.restore();

    const p = worldToMinimap(vehicle.position.x, vehicle.position.z, w, h);

    mm.fillStyle = "rgba(0,255,255,0.95)";
    mm.beginPath();
    mm.arc(p.x, p.y, 4, 0, Math.PI * 2);
    mm.fill();

    const angle = vehicle.rotation.y;
    const dx = Math.sin(angle) * 10;
    const dy = -Math.cos(angle) * 10;

    mm.strokeStyle = "rgba(0,255,255,0.95)";
    mm.lineWidth = 2;
    mm.beginPath();
    mm.moveTo(p.x, p.y);
    mm.lineTo(p.x + dx, p.y + dy);
    mm.stroke();
  }

  renderer.render(scene, camera);
}

animate();

/* =========================
   RESIZE
========================= */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
