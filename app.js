// Mobile Menu Toggle
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.getElementById('navMenu');

if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Header scroll effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
        header?.classList.add('scrolled');
    } else {
        header?.classList.remove('scrolled');
    }
});

// Scroll Animation Observer
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

// Form Submission Handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Show success alert
        alert(`Thank you, ${data.name}! We have received your inquiry regarding our ${data.service} services and will contact you shortly.`);
        contactForm.reset();
        console.log('Form submission received:', data);
    });
}

// -------------------------------------------------------------
// THREE.JS 3D ENGINE & SCROLL-DRIVEN FLIGHT TIMELINE
// -------------------------------------------------------------

let scene, camera, renderer, particleGeometry, particleMaterial, particleSystem;
let currentShape = 'sphere';
const particleCount = 2000;
const scrollModels = [];

// Setup coordinate arrays for particle system
const shapes = {
    sphere: new Float32Array(particleCount * 3),
    cube: new Float32Array(particleCount * 3),
    torus: new Float32Array(particleCount * 3),
    helix: new Float32Array(particleCount * 3),
    knot: new Float32Array(particleCount * 3),
    grid: new Float32Array(particleCount * 3),
    network: new Float32Array(particleCount * 3)
};

// Base positions that we lerp between shapes
let particleBasePositions;

// Colors mapping for particle transitions
let targetColor = new THREE.Color('#00d2ff');
let currentColor = new THREE.Color('#00d2ff');

// Network Hubs for shape generator
const hubs = [
    new THREE.Vector3(-80, 30, 10),
    new THREE.Vector3(80, -20, -10),
    new THREE.Vector3(0, 80, 40),
    new THREE.Vector3(-30, -80, -40),
    new THREE.Vector3(50, 60, -30)
];

// -------------------------------------------------------------
// PROCEDURAL 3D MODELS (Laptop, Server, Chip, Router, Code, PC, Network)
// -------------------------------------------------------------

function createLaptopModel() {
    const laptopGroup = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
        color: currentColor,
        wireframe: true,
        roughness: 0.3,
        metalness: 0.8
    });
    
    // Base / Keyboard
    const baseGeom = new THREE.BoxGeometry(24, 1.2, 16);
    const base = new THREE.Mesh(baseGeom, material);
    base.position.y = -0.6;
    laptopGroup.add(base);
    
    // Screen Hinge & Frame
    const screenGeom = new THREE.BoxGeometry(24, 16, 1);
    const screen = new THREE.Mesh(screenGeom, material);
    screen.position.y = 8;
    screen.position.z = -8;
    screen.rotation.x = -0.25; // Tilt back
    laptopGroup.add(screen);
    
    return laptopGroup;
}

function createServerModel() {
    const serverGroup = new THREE.Group();
    const cabinetMat = new THREE.MeshStandardMaterial({
        color: currentColor,
        wireframe: true
    });
    
    // Tall cabinet outer frame
    const cabinetGeom = new THREE.BoxGeometry(16, 32, 16);
    const cabinet = new THREE.Mesh(cabinetGeom, cabinetMat);
    serverGroup.add(cabinet);
    
    // Emissive server blink lights
    const lightMat = new THREE.MeshBasicMaterial({
        color: 0x39ff14,
        toneMapped: false
    });
    const lightGeom = new THREE.BoxGeometry(1.5, 0.8, 0.8);
    
    // Front panels / chassis slots
    for (let y = -12; y <= 12; y += 6) {
        const slotGeom = new THREE.BoxGeometry(14, 1, 15.8);
        const slot = new THREE.Mesh(slotGeom, cabinetMat);
        slot.position.y = y;
        serverGroup.add(slot);
        
        // Dynamic green activity light
        const bl = new THREE.Mesh(lightGeom, lightMat);
        bl.position.set(-4.5, y, 8.1);
        serverGroup.add(bl);
    }
    
    return serverGroup;
}

function createChipModel() {
    const chipGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
        color: currentColor,
        wireframe: true
    });
    const pinMat = new THREE.MeshStandardMaterial({
        color: 0xe5e7eb,
        wireframe: true
    });
    
    // Center packages (Silicon core)
    const bodyGeom = new THREE.BoxGeometry(16, 2, 16);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    chipGroup.add(body);
    
    // Pins extending on sides
    for (let z = -6; z <= 6; z += 3) {
        const pinLeftGeom = new THREE.BoxGeometry(4, 0.5, 1);
        const pinLeft = new THREE.Mesh(pinLeftGeom, pinMat);
        pinLeft.position.set(-9.5, -0.5, z);
        chipGroup.add(pinLeft);
        
        const pinRight = new THREE.Mesh(pinLeftGeom, pinMat);
        pinRight.position.set(9.5, -0.5, z);
        chipGroup.add(pinRight);
    }
    
    return chipGroup;
}

function createRouterModel() {
    const routerGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
        color: currentColor,
        wireframe: true
    });
    
    // Cylinder body
    const bodyGeom = new THREE.CylinderGeometry(12, 12, 3, 10);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    routerGroup.add(body);
    
    // Antennas
    const antGeom = new THREE.CylinderGeometry(0.4, 0.4, 14, 4);
    const ant1 = new THREE.Mesh(antGeom, bodyMat);
    ant1.position.set(-5, 7, -6);
    ant1.rotation.z = 0.15;
    routerGroup.add(ant1);
    
    const ant2 = new THREE.Mesh(antGeom, bodyMat);
    ant2.position.set(5, 7, -6);
    ant2.rotation.z = -0.15;
    routerGroup.add(ant2);
    
    return routerGroup;
}

function createCodeModel() {
    const codeGroup = new THREE.Group();
    
    // Create text canvas with lines of code
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, size, size);
    
    ctx.font = 'bold 16px Courier New';
    ctx.fillStyle = '#00d2ff';
    const lines = [
        'function main() {',
        '  let iot = new IoT();',
        '  iot.connect(Server);',
        '  OS.debloat();',
        '  buildSoftware();',
        '  networking.up();',
        '}'
    ];
    lines.forEach((line, index) => {
        ctx.fillText(line, 10, 45 + index * 30);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    const geom = new THREE.PlaneGeometry(24, 24);
    const plane = new THREE.Mesh(geom, mat);
    codeGroup.add(plane);
    
    return codeGroup;
}

function createPcTowerModel() {
    const pcGroup = new THREE.Group();
    const caseMat = new THREE.MeshStandardMaterial({
        color: currentColor,
        wireframe: true
    });
    const fanMat = new THREE.MeshStandardMaterial({
        color: 0xe5e7eb,
        wireframe: true
    });
    
    // Case body
    const caseGeom = new THREE.BoxGeometry(14, 26, 22);
    const cabinet = new THREE.Mesh(caseGeom, caseMat);
    pcGroup.add(cabinet);
    
    // Internal dual fans
    const fanGeom = new THREE.TorusGeometry(4.5, 0.6, 6, 16);
    const fan1 = new THREE.Mesh(fanGeom, fanMat);
    fan1.position.set(0, 5, 2);
    pcGroup.add(fan1);
    
    const fan2 = new THREE.Mesh(fanGeom, fanMat);
    fan2.position.set(0, -5, 2);
    pcGroup.add(fan2);
    
    return pcGroup;
}

function createNetworkMeshModel() {
    const networkGroup = new THREE.Group();
    const nodeMat = new THREE.MeshStandardMaterial({
        color: currentColor,
        wireframe: true
    });
    
    // Central Router hub
    const centerGeom = new THREE.SphereGeometry(6, 8, 8);
    const center = new THREE.Mesh(centerGeom, nodeMat);
    networkGroup.add(center);
    
    // Orbiting satellite client spheres
    const satelliteGeom = new THREE.SphereGeometry(3, 6, 6);
    const connectionPoints = [
        new THREE.Vector3(-16, 12, 6),
        new THREE.Vector3(16, -12, -6),
        new THREE.Vector3(-6, -16, 14),
        new THREE.Vector3(12, 16, -10)
    ];
    
    connectionPoints.forEach(pt => {
        // Draw satellite
        const sat = new THREE.Mesh(satelliteGeom, nodeMat);
        sat.position.copy(pt);
        networkGroup.add(sat);
        
        // Draw connection fiber line
        const points = [new THREE.Vector3(0,0,0), pt];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: currentColor });
        const line = new THREE.Line(lineGeom, lineMat);
        networkGroup.add(line);
    });
    
    return networkGroup;
}

// -------------------------------------------------------------
// TEXTURE GENERATOR FOR PARTICLE
// -------------------------------------------------------------

function createCircleTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    return new THREE.CanvasTexture(canvas);
}

// -------------------------------------------------------------
// THREE.JS INITIALIZATION & SCENE SETUP
// -------------------------------------------------------------

function initThree() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    // 1. Scene & Camera setup
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 320;

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Add gentle lighting for 3D meshes
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(100, 100, 50);
    scene.add(dirLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 2. Generate target shape arrays
    generateShapes();

    // 3. Create Particle System
    particleGeometry = new THREE.BufferGeometry();
    particleBasePositions = new Float32Array(shapes.sphere);
    const initialPositions = new Float32Array(particleCount * 3);
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));

    particleMaterial = new THREE.PointsMaterial({
        size: 5.5,
        map: createCircleTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: currentColor
    });

    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 4. Create and Register Scroll-Driven 3D Models
    setupScrollModels();

    // 5. Setup Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', checkActiveSection);

    // 6. Start animation loop
    animate();

    // Hide loader
    const loading = document.getElementById('loading');
    if (loading) {
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 300);
    }
}

function setupScrollModels() {
    const cards = document.querySelectorAll('.service-card');
    const heroSection = document.getElementById('home');
    
    if (!heroSection) return;
    
    // Register Hero Laptop
    scrollModels.push({
        mesh: createLaptopModel(),
        element: heroSection,
        activeScale: 2.2,
        phaseOffset: 0,
        rotFreqX: 0.9,
        rotFreqZ: 0.7
    });
    
    // Register Card elements
    if (cards.length >= 6) {
        scrollModels.push({
            mesh: createCodeModel(),
            element: cards[0], // Software
            activeScale: 2.0,
            phaseOffset: 1.0,
            rotFreqX: 1.1,
            rotFreqZ: 0.8
        });
        scrollModels.push({
            mesh: createRouterModel(),
            element: cards[1], // IoT
            activeScale: 1.9,
            phaseOffset: 2.0,
            rotFreqX: 0.7,
            rotFreqZ: 1.2
        });
        scrollModels.push({
            mesh: createPcTowerModel(),
            element: cards[2], // Refurbish PC/Laptop
            activeScale: 1.8,
            phaseOffset: 3.0,
            rotFreqX: 1.3,
            rotFreqZ: 0.6
        });
        scrollModels.push({
            mesh: createChipModel(),
            element: cards[3], // OS Customize
            activeScale: 2.0,
            phaseOffset: 4.0,
            rotFreqX: 0.8,
            rotFreqZ: 1.0
        });
        scrollModels.push({
            mesh: createServerModel(),
            element: cards[4], // Server
            activeScale: 1.6,
            phaseOffset: 5.0,
            rotFreqX: 1.0,
            rotFreqZ: 0.9
        });
        scrollModels.push({
            mesh: createNetworkMeshModel(),
            element: cards[5], // Networking
            activeScale: 1.9,
            phaseOffset: 6.0,
            rotFreqX: 0.6,
            rotFreqZ: 1.1
        });
    }
    
    // Add meshes to scene, starting at scale 0
    scrollModels.forEach(item => {
        scene.add(item.mesh);
        item.mesh.scale.setScalar(0.001);
    });
}

// Mathematical shape formulas
function generateShapes() {
    // 1. Sphere
    for (let i = 0; i < particleCount; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const r = 120;
        shapes.sphere[i * 3] = r * Math.cos(theta) * Math.sin(phi);
        shapes.sphere[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        shapes.sphere[i * 3 + 2] = r * Math.cos(phi);
    }

    // 2. Cube (hollow outer faces)
    for (let i = 0; i < particleCount; i++) {
        const face = i % 6;
        const s = 90;
        const u = (Math.random() - 0.5) * 180;
        const v = (Math.random() - 0.5) * 180;
        if (face === 0) {
            shapes.cube[i * 3] = u; shapes.cube[i * 3 + 1] = s; shapes.cube[i * 3 + 2] = v;
        } else if (face === 1) {
            shapes.cube[i * 3] = u; shapes.cube[i * 3 + 1] = -s; shapes.cube[i * 3 + 2] = v;
        } else if (face === 2) {
            shapes.cube[i * 3] = u; shapes.cube[i * 3 + 1] = v; shapes.cube[i * 3 + 2] = s;
        } else if (face === 3) {
            shapes.cube[i * 3] = u; shapes.cube[i * 3 + 1] = v; shapes.cube[i * 3 + 2] = -s;
        } else if (face === 4) {
            shapes.cube[i * 3] = s; shapes.cube[i * 3 + 1] = u; shapes.cube[i * 3 + 2] = v;
        } else {
            shapes.cube[i * 3] = -s; shapes.cube[i * 3 + 1] = u; shapes.cube[i * 3 + 2] = v;
        }
    }

    // 3. Torus
    for (let i = 0; i < particleCount; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        const R = 110;
        const r = 35;
        shapes.torus[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
        shapes.torus[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
        shapes.torus[i * 3 + 2] = r * Math.sin(v);
    }

    // 4. Helix (Double Helix)
    for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount;
        const theta = t * Math.PI * 2 * 6; // 6 rotations
        const R = 60;
        const H = 220;
        const strandOffset = (i % 2 === 0) ? 0 : Math.PI;
        shapes.helix[i * 3] = R * Math.cos(theta + strandOffset);
        shapes.helix[i * 3 + 1] = (t - 0.5) * H;
        shapes.helix[i * 3 + 2] = R * Math.sin(theta + strandOffset);
    }

    // 5. Torus Knot
    for (let i = 0; i < particleCount; i++) {
        const theta = (i / particleCount) * Math.PI * 2 * 3;
        const p = 2;
        const q = 3;
        const r = Math.cos(q * theta) + 2.2;
        const scale = 40;
        shapes.knot[i * 3] = r * Math.cos(p * theta) * scale;
        shapes.knot[i * 3 + 1] = r * Math.sin(p * theta) * scale;
        shapes.knot[i * 3 + 2] = -Math.sin(q * theta) * scale;
    }

    // 6. Grid (Stacked Server Nodes)
    const layers = 5;
    const ptsPerLayer = particleCount / layers;
    for (let i = 0; i < particleCount; i++) {
        const layer = Math.floor(i / ptsPerLayer);
        const indexInLayer = i % ptsPerLayer;
        const cols = 20;
        const col = indexInLayer % cols;
        const row = Math.floor(indexInLayer / cols);
        
        const w = 180;
        const h = 140;
        const d = 180;
        
        shapes.grid[i * 3] = (col / (cols - 1) - 0.5) * w;
        shapes.grid[i * 3 + 1] = (layer / (layers - 1) - 0.5) * h;
        shapes.grid[i * 3 + 2] = (row / (ptsPerLayer / cols - 1) - 0.5) * d;
    }

    // 7. Network topology (Mesh layout)
    for (let i = 0; i < particleCount; i++) {
        if (i < particleCount * 0.1) {
            const hub = hubs[i % hubs.length];
            shapes.network[i * 3] = hub.x;
            shapes.network[i * 3 + 1] = hub.y;
            shapes.network[i * 3 + 2] = hub.z;
        } else if (i < particleCount * 0.5) {
            const hubStart = hubs[i % hubs.length];
            const hubEnd = hubs[(i + 1) % hubs.length];
            const t = Math.random();
            shapes.network[i * 3] = THREE.MathUtils.lerp(hubStart.x, hubEnd.x, t);
            shapes.network[i * 3 + 1] = THREE.MathUtils.lerp(hubStart.y, hubEnd.y, t);
            shapes.network[i * 3 + 2] = THREE.MathUtils.lerp(hubStart.z, hubEnd.z, t);
        } else {
            const hub = hubs[i % hubs.length];
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const dist = 30 + Math.random() * 45;
            shapes.network[i * 3] = hub.x + dist * Math.cos(theta) * Math.sin(phi);
            shapes.network[i * 3 + 1] = hub.y + dist * Math.sin(theta) * Math.sin(phi);
            shapes.network[i * 3 + 2] = hub.z + dist * Math.cos(phi);
        }
    }
}

// Parallax target variables
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Check which section is in focus to morph shapes
function checkActiveSection() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    
    // Check if we are in Hero
    if (scrollY < vh * 0.5) {
        currentShape = 'sphere';
        targetColor.set('#00d2ff');
        return;
    }

    // Check if we are in Services
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
        const rect = servicesSection.getBoundingClientRect();
        if (rect.top < vh && rect.bottom > 0) {
            // Find which card is closest to screen center
            const cards = document.querySelectorAll('.service-card');
            let closestCard = null;
            let minDistance = Infinity;

            cards.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.top + cardRect.height / 2;
                const distance = Math.abs(cardCenter - vh / 2);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestCard = card;
                }
            });

            if (closestCard) {
                const shape = closestCard.getAttribute('data-shape');
                const colorHex = closestCard.getAttribute('data-color');
                if (shape && shapes[shape]) {
                    currentShape = shape;
                }
                if (colorHex) {
                    targetColor.set(colorHex);
                }
                return;
            }
        }
    }

    // Default for About & Contact sections
    currentShape = 'sphere';
    targetColor.set('#bd00ff');
}

// Active Nav Link highlight on scroll
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentId = 'home';
    sections.forEach(sec => {
        const top = sec.offsetTop - 120;
        const height = sec.offsetHeight;
        if (window.scrollY >= top && window.scrollY < top + height) {
            currentId = sec.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentId}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink);

// Animation Tick Loop
function animate() {
    requestAnimationFrame(animate);

    const timeVal = Date.now() * 0.001;
    const isMobile = window.innerWidth < 768;
    const vh = window.innerHeight;

    // 1. Move camera with subtle mouse parallax
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;
    
    camera.position.x = targetX * 15;
    camera.position.y = -targetY * 15;
    camera.lookAt(scene.position);

    // 2. Rotate particle system slowly in the background
    if (particleSystem) {
        const rotSpeed = (currentShape === 'grid' || currentShape === 'network') ? 0.0008 : 0.0025;
        particleSystem.rotation.y += rotSpeed;
        particleSystem.rotation.x += rotSpeed * 0.3;
    }

    // 3. Interpolate BASE positions toward current static target shape
    if (particleBasePositions) {
        const targetPositions = shapes[currentShape];
        for (let i = 0; i < particleBasePositions.length; i++) {
            const diff = targetPositions[i] - particleBasePositions[i];
            if (Math.abs(diff) > 0.01) {
                particleBasePositions[i] += diff * 0.075;
            } else {
                particleBasePositions[i] = targetPositions[i];
            }
        }
    }

    // 4. Apply dynamic animated offsets on top of base positions to WebGL buffer
    if (particleGeometry && particleBasePositions) {
        const positions = particleGeometry.attributes.position.array;
        
        for (let i = 0; i < particleCount; i++) {
            const px = particleBasePositions[i * 3];
            const py = particleBasePositions[i * 3 + 1];
            const pz = particleBasePositions[i * 3 + 2];

            if (currentShape === 'sphere') {
                const dist = Math.sqrt(px*px + py*py + pz*pz);
                if (dist > 0) {
                    const wave = 1 + Math.sin(timeVal * 2.2 + dist * 0.02 + i * 0.05) * 0.05;
                    positions[i * 3] = px * wave;
                    positions[i * 3 + 1] = py * wave;
                    positions[i * 3 + 2] = pz * wave;
                } else {
                    positions[i * 3] = px; positions[i * 3 + 1] = py; positions[i * 3 + 2] = pz;
                }
            } 
            else if (currentShape === 'cube') {
                const h = 180;
                const speed = 110;
                const fallingY = -((timeVal * speed + (i % 40) * 10) % h) + h/2;
                positions[i * 3] = px;
                positions[i * 3 + 1] = THREE.MathUtils.lerp(py, fallingY, 0.95);
                positions[i * 3 + 2] = pz;
            } 
            else if (currentShape === 'torus') {
                const rotateAngle = timeVal * 1.2;
                positions[i * 3] = px * Math.cos(rotateAngle) - pz * Math.sin(rotateAngle);
                positions[i * 3 + 1] = py + Math.sin(timeVal * 4 + px * 0.04) * 4.5;
                positions[i * 3 + 2] = px * Math.sin(rotateAngle) + pz * Math.cos(rotateAngle);
            } 
            else if (currentShape === 'helix') {
                const dir = (i % 2 === 0) ? 1 : -1;
                const spinAngle = timeVal * 1.8 * dir;
                positions[i * 3] = px * Math.cos(spinAngle) - pz * Math.sin(spinAngle);
                positions[i * 3 + 1] = py + Math.sin(timeVal * 5.5 + py * 0.08) * 6;
                positions[i * 3 + 2] = px * Math.sin(spinAngle) + pz * Math.cos(spinAngle);
            } 
            else if (currentShape === 'knot') {
                const twist = Math.sin(timeVal * 2.8 + i * 0.08) * 3.5;
                positions[i * 3] = px + twist * 0.7;
                positions[i * 3 + 1] = py + twist * 0.7;
                positions[i * 3 + 2] = pz + twist * 1.4;
            } 
            else if (currentShape === 'grid') {
                const speed = 4.5;
                const dialValue = Math.sin(timeVal * speed + px * 0.06 + pz * 0.06) * 6;
                positions[i * 3] = px;
                positions[i * 3 + 1] = py + dialValue;
                positions[i * 3 + 2] = pz;
            } 
            else if (currentShape === 'network') {
                if (i < particleCount * 0.1) {
                    positions[i * 3] = px + Math.sin(timeVal * 8 + i) * 1.2;
                    positions[i * 3 + 1] = py + Math.cos(timeVal * 8 + i) * 1.2;
                    positions[i * 3 + 2] = pz;
                } else if (i < particleCount * 0.5) {
                    const fiberWave = Math.sin(timeVal * 6 + px * 0.08 + py * 0.08) * 3.5;
                    positions[i * 3] = px + fiberWave * 0.4;
                    positions[i * 3 + 1] = py + fiberWave * 0.4;
                    positions[i * 3 + 2] = pz;
                } else {
                    const hub = hubs[i % hubs.length];
                    const dx = px - hub.x;
                    const dy = py - hub.y;
                    const dz = pz - hub.z;
                    const angle = timeVal * 0.6;
                    
                    positions[i * 3] = hub.x + (dx * Math.cos(angle) - dy * Math.sin(angle));
                    positions[i * 3 + 1] = hub.y + (dx * Math.sin(angle) + dy * Math.cos(angle));
                    positions[i * 3 + 2] = hub.z + dz;
                }
            }
        }
        particleGeometry.attributes.position.needsUpdate = true;
    }

    // 5. Interpolate particle color theme
    if (particleMaterial) {
        currentColor.lerp(targetColor, 0.05);
        particleMaterial.color.copy(currentColor);
    }

    // 6. SCROLL-DRIVEN 3D FLIGHT TIMELINE ENGINE FOR MAJOR MODELS
    // As the user scrolls, each 3D object flies in from off-screen depth, settles, sways, and then flies out.
    scrollModels.forEach(obj => {
        const rect = obj.element.getBoundingClientRect();
        
        // Calculate the element's position relative to the viewport center
        const elementCenter = rect.top + rect.height / 2;
        const distance = elementCenter - vh / 2;
        
        // Normalize distance: ranges from -1 (above viewport) to 1 (below viewport)
        const normalizedDist = distance / (vh * 1.1);
        
        // Layout coordinates: model flies in from right side, settles at center-right
        const activeX = isMobile ? 0 : 95;
        const activeY = isMobile ? -20 : 5;
        const activeZ = isMobile ? -30 : 50;
        const targetScale = isMobile ? (obj.activeScale * 0.65) : obj.activeScale;
        const rotFreqX = obj.rotFreqX || 1.0;
        const rotFreqZ = obj.rotFreqZ || 0.8;

        // Spin fans on PC tower
        obj.mesh.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'TorusGeometry') {
                child.rotation.z += 0.06;
            }
        });

        if (normalizedDist > 1.0) {
            // 1. HIDDEN BELOW: Far off-screen, scale zero
            obj.mesh.position.set(320, -200, -300);
            obj.mesh.scale.setScalar(0.001);
        } 
        else if (normalizedDist > 0.0) {
            // 2. FLYING IN: Zoom from deep behind/right toward active center
            const t = 1.0 - normalizedDist; // 0.0 -> 1.0
            const ease = t * t * (3 - 2 * t);
            
            obj.mesh.position.x = THREE.MathUtils.lerp(320, activeX, ease);
            obj.mesh.position.y = THREE.MathUtils.lerp(-200, activeY, ease);
            obj.mesh.position.z = THREE.MathUtils.lerp(-300, activeZ, ease);
            obj.mesh.scale.setScalar(THREE.MathUtils.lerp(0.001, targetScale, ease));
            
            // Entry spin + active sway
            obj.mesh.rotation.y = timeVal * 1.2 + (1.0 - ease) * Math.PI * 2;
            obj.mesh.rotation.x = Math.sin(timeVal * rotFreqX) * 0.4;
            obj.mesh.rotation.z = Math.cos(timeVal * rotFreqZ) * 0.28;
        } 
        else if (normalizedDist > -1.0) {
            // 3. SETTLED + FLYING OUT: Idle sway then zoom out to left/above
            const t = -normalizedDist; // 0.0 -> 1.0
            const ease = t * t * (3 - 2 * t);
            
            // When ease < 0.15, object is "settled" — just floating/swaying
            const swayX = Math.sin(timeVal * 0.9 + obj.phaseOffset) * 6;
            const swayY = Math.cos(timeVal * 0.7 + obj.phaseOffset) * 5;

            obj.mesh.position.x = THREE.MathUtils.lerp(activeX + swayX * (1 - ease), -320, ease);
            obj.mesh.position.y = THREE.MathUtils.lerp(activeY + swayY * (1 - ease), 200, ease);
            obj.mesh.position.z = THREE.MathUtils.lerp(activeZ, -250, ease);
            obj.mesh.scale.setScalar(THREE.MathUtils.lerp(targetScale, 0.001, ease));
            
            // Exit spin
            obj.mesh.rotation.y = timeVal * 1.2 - ease * Math.PI * 2;
            obj.mesh.rotation.x = Math.sin(timeVal * rotFreqX) * 0.4;
            obj.mesh.rotation.z = Math.cos(timeVal * rotFreqZ) * 0.28;
        } 
        else {
            // 4. HIDDEN ABOVE: Off-screen above, scale zero
            obj.mesh.position.set(-320, 200, -250);
            obj.mesh.scale.setScalar(0.001);
        }

        // Real-time wireframe color follows active section color
        obj.mesh.traverse(child => {
            if (child.isMesh && child.material && child.material.wireframe) {
                child.material.color.lerp(currentColor, 0.05);
            }
        });
    });

    renderer.render(scene, camera);
}

// Initialize Three.js on page load
window.addEventListener('DOMContentLoaded', () => {
    // If Three.js script isn't loaded (e.g. offline fallback), hide loading screen manually
    if (typeof THREE === 'undefined') {
        console.warn('Three.js is not loaded. Skipping 3D initialization.');
        const loading = document.getElementById('loading');
        if (loading) loading.classList.add('hidden');
        return;
    }

    initThree();
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
