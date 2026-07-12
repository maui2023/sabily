// ============================================================
// SABILY ENTERPRISE — Three.js Electronic Circuit Board Background
// ============================================================

// ---- Mobile Menu ----
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.getElementById('navMenu');
if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// ---- Header Scroll Effect ----
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 80);
});

// ---- Intersection Observer (Scroll Reveals) ----
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.animate-on-scroll').forEach(el => revealObserver.observe(el));

// ---- Contact Form ----
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(contactForm));
        alert('Thank you, ' + data.name + '! We have received your inquiry and will respond shortly.');
        contactForm.reset();
    });
}

// ---- Active Nav Link ----
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    let currentId = 'home';
    sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 120) currentId = sec.id;
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
    });
}
window.addEventListener('scroll', updateActiveNavLink);


// ============================================================
// THREE.JS ENGINE — ELECTRONIC CIRCUIT BOARD BACKGROUND
// ============================================================

let scene, camera, renderer;
const scrollModels = [];

// Colour system
let currentColor = new THREE.Color('#00ff88');
let targetColor  = new THREE.Color('#00ff88');

// Mouse parallax
let mouseX = 0, mouseY = 0, camTargetX = 0, camTargetY = 0;

// ============================================================
// CIRCUIT BOARD CONFIG
// ============================================================
const CB = {
    cols: 22,
    rows: 14,
    sx:   25,
    sy:   20,
    dz:   110,
};

// Shared materials (colours updated each frame)
let matTrace = null;
let matEdge  = null;
let matPad   = null;
let matDark  = null;

let circuitGroup  = null;
let circuitTraces = [];
let signalPulses  = [];

// ============================================================
// CIRCUIT BOARD BUILDER
// ============================================================

function buildCircuitBoard() {
    circuitGroup = new THREE.Group();

    matTrace = new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.30 });
    matEdge  = new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.85 });
    matPad   = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.85 });
    matDark  = new THREE.MeshBasicMaterial({ color: 0x001a08, transparent: true, opacity: 0.94 });

    // 1. Node positions
    var nodes = [];
    for (var r = 0; r < CB.rows; r++) {
        for (var c = 0; c < CB.cols; c++) {
            var x = (c - CB.cols / 2) * CB.sx + (Math.random() - 0.5) * 9;
            var y = (r - CB.rows / 2) * CB.sy + (Math.random() - 0.5) * 7;
            var z = (Math.random() - 0.5) * CB.dz;
            nodes.push(new THREE.Vector3(x, y, z));
        }
    }

    // 2. Solder pads
    nodes.forEach(function(pos, i) {
        var isLarge = (i % 9 === 0);
        var sz = isLarge ? 4.5 : 2.5;
        var pad = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, 0.8), matPad);
        pad.position.copy(pos);
        circuitGroup.add(pad);
    });

    // 3. Electronic components
    nodes.forEach(function(pos, i) {
        if (i % 11 === 5) addICChip(pos);
        if (i % 17 === 3) addResistor(pos);
        if (i % 23 === 7) addCapacitor(pos);
        if (i % 6  === 0) addViaHole(pos);
    });

    // 4. Manhattan traces
    for (var row = 0; row < CB.rows; row++) {
        for (var col = 0; col < CB.cols; col++) {
            var idx = row * CB.cols + col;
            var a = nodes[idx];
            if (col + 1 < CB.cols && Math.random() < 0.88)
                addTrace(a, nodes[idx + 1]);
            if (row + 1 < CB.rows && Math.random() < 0.82)
                addTrace(a, nodes[idx + CB.cols]);
            if (col + 2 < CB.cols && Math.random() < 0.10)
                addTrace(a, nodes[idx + 2]);
            if (row + 2 < CB.rows && Math.random() < 0.08)
                addTrace(a, nodes[idx + CB.cols * 2]);
        }
    }

    scene.add(circuitGroup);
}

function addTrace(a, b) {
    var goHorizFirst = Math.random() < 0.5;
    var corner = new THREE.Vector3(
        goHorizFirst ? b.x : a.x,
        goHorizFirst ? a.y : b.y,
        (a.z + b.z) / 2
    );
    var seg1Len = a.distanceTo(corner);
    var total   = seg1Len + corner.distanceTo(b);
    if (total < 2) return;

    var pts = [a.clone(), corner.clone(), b.clone()];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    circuitGroup.add(new THREE.Line(geo, matTrace));
    circuitTraces.push({ points: pts, seg1Frac: seg1Len / total });
}

function addICChip(pos) {
    var w = 18, h = 10, d = 1.5;
    var body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matDark);
    body.position.copy(pos);
    circuitGroup.add(body);

    var edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), matEdge);
    edges.position.copy(pos);
    circuitGroup.add(edges);

    var dot = new THREE.Mesh(new THREE.CircleGeometry(0.9, 8), matPad);
    dot.position.set(pos.x - w / 2 + 2.2, pos.y + h / 2 - 2.2, pos.z + d / 2 + 0.1);
    circuitGroup.add(dot);

    var pinH = 3.5, pinW = 0.9;
    var pinGeo = new THREE.BoxGeometry(pinH, pinW, 0.4);
    for (var p = 0; p < 4; p++) {
        var py = pos.y - (h / 2 - 1.2) + p * (h - 2.4) / 3;
        var pL = new THREE.Mesh(pinGeo, matPad);
        pL.position.set(pos.x - w / 2 - pinH / 2, py, pos.z);
        circuitGroup.add(pL);
        var pR = new THREE.Mesh(pinGeo, matPad);
        pR.position.set(pos.x + w / 2 + pinH / 2, py, pos.z);
        circuitGroup.add(pR);
    }
}

function addResistor(pos) {
    var w = 8, h = 3.2, d = 1;
    var body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matDark);
    body.position.copy(pos);
    circuitGroup.add(body);

    var edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), matEdge);
    edges.position.copy(pos);
    circuitGroup.add(edges);

    [-1, 1].forEach(function(side) {
        var pts = [
            new THREE.Vector3(pos.x + side * (w / 2), pos.y, pos.z),
            new THREE.Vector3(pos.x + side * (w / 2 + 4), pos.y, pos.z)
        ];
        circuitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), matTrace));
    });
}

function addCapacitor(pos) {
    var capMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5, 8), matDark);
    capMesh.rotation.z = Math.PI / 2;
    capMesh.position.copy(pos);
    circuitGroup.add(capMesh);

    var capEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(2.2, 2.2, 5, 8)), matEdge);
    capEdges.rotation.z = Math.PI / 2;
    capEdges.position.copy(pos);
    circuitGroup.add(capEdges);

    [-1, 1].forEach(function(side) {
        var pts = [
            new THREE.Vector3(pos.x + side * 2.5, pos.y, pos.z),
            new THREE.Vector3(pos.x + side * 6,   pos.y, pos.z)
        ];
        circuitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), matTrace));
    });
}

function addViaHole(pos) {
    var via = new THREE.Mesh(new THREE.RingGeometry(1.1, 2.2, 10), matPad);
    via.position.set(pos.x, pos.y, pos.z + 1);
    circuitGroup.add(via);
}

// ============================================================
// SIGNAL PULSES
// ============================================================

function spawnSignalPulse() {
    if (circuitTraces.length === 0) return;
    var trace = circuitTraces[Math.floor(Math.random() * circuitTraces.length)];
    var geo   = new THREE.SphereGeometry(2, 6, 6);
    var mat   = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    var mesh  = new THREE.Mesh(geo, mat);
    mesh.position.copy(trace.points[0]);
    circuitGroup.add(mesh);
    signalPulses.push({ mesh: mesh, trace: trace, progress: 0, speed: 0.007 + Math.random() * 0.013 });
}

function updateSignalPulses() {
    if (Math.random() < 0.07 && signalPulses.length < 50) spawnSignalPulse();

    for (var i = signalPulses.length - 1; i >= 0; i--) {
        var sp = signalPulses[i];
        sp.progress += sp.speed;

        if (sp.progress >= 1.0) {
            circuitGroup.remove(sp.mesh);
            signalPulses.splice(i, 1);
            continue;
        }

        var pts      = sp.trace.points;
        var seg1Frac = sp.trace.seg1Frac;

        if (sp.progress < seg1Frac) {
            var t1 = sp.progress / (seg1Frac || 0.001);
            sp.mesh.position.lerpVectors(pts[0], pts[1], t1);
        } else {
            var t2 = (sp.progress - seg1Frac) / (1 - seg1Frac + 0.0001);
            sp.mesh.position.lerpVectors(pts[1], pts[2], Math.min(t2, 1));
        }

        sp.mesh.material.opacity = sp.progress > 0.75
            ? ((1 - sp.progress) / 0.25) * 0.95
            : 0.95;
    }
}

// ============================================================
// PROCEDURAL 3D SCROLL MODELS
// ============================================================

function createLaptopModel() {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: currentColor, wireframe: true, roughness: 0.3, metalness: 0.8 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(24, 1.2, 16), mat);
    base.position.y = -0.6; g.add(base);
    var screen = new THREE.Mesh(new THREE.BoxGeometry(24, 16, 1), mat);
    screen.position.set(0, 8, -8); screen.rotation.x = -0.25; g.add(screen);
    return g;
}

function createServerModel() {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: currentColor, wireframe: true });
    var lm  = new THREE.MeshBasicMaterial({ color: 0x39ff14, toneMapped: false });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(16, 32, 16), mat));
    for (var y = -12; y <= 12; y += 6) {
        var slot = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 15.8), mat);
        slot.position.y = y; g.add(slot);
        var bl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.8), lm);
        bl.position.set(-4.5, y, 8.1); g.add(bl);
    }
    return g;
}

function createChipModel() {
    var g = new THREE.Group();
    var bm = new THREE.MeshStandardMaterial({ color: currentColor, wireframe: true });
    var pm = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, wireframe: true });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(16, 2, 16), bm));
    var pg = new THREE.BoxGeometry(4, 0.5, 1);
    for (var z = -6; z <= 6; z += 3) {
        var pL = new THREE.Mesh(pg, pm); pL.position.set(-9.5, -0.5, z); g.add(pL);
        var pR = new THREE.Mesh(pg, pm); pR.position.set( 9.5, -0.5, z); g.add(pR);
    }
    return g;
}

function createRouterModel() {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: currentColor, wireframe: true });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 3, 10), mat));
    var ag = new THREE.CylinderGeometry(0.4, 0.4, 14, 4);
    var a1 = new THREE.Mesh(ag, mat); a1.position.set(-5, 7, -6); a1.rotation.z =  0.15; g.add(a1);
    var a2 = new THREE.Mesh(ag, mat); a2.position.set( 5, 7, -6); a2.rotation.z = -0.15; g.add(a2);
    return g;
}

function createCodeModel() {
    var g = new THREE.Group();
    var cvs = document.createElement('canvas');
    cvs.width = cvs.height = 256;
    var ctx = cvs.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 256, 256);
    ctx.font = 'bold 15px Courier New'; ctx.fillStyle = '#00ff88';
    var lines = ['function main() {', '  let iot = new IoT();', '  iot.connect(Server);', '  OS.debloat();', '  buildSoftware();', '  network.up();', '}'];
    lines.forEach(function(l, i) { ctx.fillText(l, 10, 45 + i * 30); });
    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 24),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvs), transparent: true, side: THREE.DoubleSide })
    );
    g.add(plane);
    return g;
}

function createPcTowerModel() {
    var g = new THREE.Group();
    var cm = new THREE.MeshStandardMaterial({ color: currentColor, wireframe: true });
    var fm = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, wireframe: true });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(14, 26, 22), cm));
    var fg = new THREE.TorusGeometry(4.5, 0.6, 6, 16);
    var f1 = new THREE.Mesh(fg, fm); f1.position.set(0,  5, 2); g.add(f1);
    var f2 = new THREE.Mesh(fg, fm); f2.position.set(0, -5, 2); g.add(f2);
    return g;
}

function createNetworkMeshModel() {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: currentColor, wireframe: true });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8), mat));
    var pts = [
        new THREE.Vector3(-16, 12, 6), new THREE.Vector3(16, -12, -6),
        new THREE.Vector3(-6, -16, 14), new THREE.Vector3(12, 16, -10)
    ];
    pts.forEach(function(pt) {
        var s = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 6), mat);
        s.position.copy(pt); g.add(s);
        g.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pt]),
            new THREE.LineBasicMaterial({ color: currentColor })
        ));
    });
    return g;
}

// ============================================================
// SETUP SCROLL MODELS
// ============================================================

var modelDefs = [
    { factory: createLaptopModel,      activeScale: 2.2, phaseOffset: 0,   rfX: 0.9, rfZ: 0.7, sectionId: 'home' },
    { factory: createCodeModel,        activeScale: 2.0, phaseOffset: 1.0, rfX: 1.1, rfZ: 0.8, cardIdx: 0 },
    { factory: createRouterModel,      activeScale: 1.9, phaseOffset: 2.0, rfX: 0.7, rfZ: 1.2, cardIdx: 1 },
    { factory: createPcTowerModel,     activeScale: 1.8, phaseOffset: 3.0, rfX: 1.3, rfZ: 0.6, cardIdx: 2 },
    { factory: createChipModel,        activeScale: 2.0, phaseOffset: 4.0, rfX: 0.8, rfZ: 1.0, cardIdx: 3 },
    { factory: createServerModel,      activeScale: 1.6, phaseOffset: 5.0, rfX: 1.0, rfZ: 0.9, cardIdx: 4 },
    { factory: createNetworkMeshModel, activeScale: 1.9, phaseOffset: 6.0, rfX: 0.6, rfZ: 1.1, cardIdx: 5 },
];

function setupScrollModels() {
    var cards = document.querySelectorAll('.service-card');
    modelDefs.forEach(function(def) {
        var element = def.sectionId
            ? document.getElementById(def.sectionId)
            : (def.cardIdx < cards.length ? cards[def.cardIdx] : null);
        if (!element) return;

        var obj = Object.assign({}, def, { mesh: def.factory(), element: element });
        scene.add(obj.mesh);
        obj.mesh.scale.setScalar(0.001);
        scrollModels.push(obj);
    });
}

// ============================================================
// ACTIVE SECTION COLOUR
// ============================================================

function checkActiveSection() {
    var vh = window.innerHeight;
    if (window.scrollY < vh * 0.5) { targetColor.set('#00ff88'); return; }

    var servicesSection = document.getElementById('services');
    if (servicesSection) {
        var rect = servicesSection.getBoundingClientRect();
        if (rect.top < vh && rect.bottom > 0) {
            var cards = document.querySelectorAll('.service-card');
            var closestCard = null, minDist = Infinity;
            cards.forEach(function(card) {
                var cr   = card.getBoundingClientRect();
                var dist = Math.abs((cr.top + cr.height / 2) - vh / 2);
                if (dist < minDist) { minDist = dist; closestCard = card; }
            });
            if (closestCard) {
                var col = closestCard.getAttribute('data-color');
                if (col) targetColor.set(col);
                return;
            }
        }
    }
    targetColor.set('#bd00ff');
}
window.addEventListener('scroll', checkActiveSection);

// ============================================================
// THREE.JS INITIALISATION
// ============================================================

function initThree() {
    var canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1500);
    camera.position.z = 340;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(100, 100, 50);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    buildCircuitBoard();
    setupScrollModels();

    window.addEventListener('resize',    onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll',    checkActiveSection);

    animate();
    setTimeout(function() {
        var loading = document.getElementById('loading');
        if (loading) loading.classList.add('hidden');
    }, 300);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(e) {
    mouseX = (e.clientX - window.innerWidth  / 2) / 100;
    mouseY = (e.clientY - window.innerHeight / 2) / 100;
}

// ============================================================
// ANIMATION LOOP
// ============================================================

function animate() {
    requestAnimationFrame(animate);

    var timeVal  = Date.now() * 0.001;
    var isMobile = window.innerWidth < 768;
    var vh       = window.innerHeight;

    // Camera parallax
    camTargetX += (mouseX - camTargetX) * 0.05;
    camTargetY += (mouseY - camTargetY) * 0.05;
    camera.position.x = camTargetX * 12;
    camera.position.y = -camTargetY * 12;
    camera.lookAt(scene.position);

    // Colour lerp
    currentColor.lerp(targetColor, 0.04);

    // Update shared circuit material colours
    if (matTrace) matTrace.color.copy(currentColor);
    if (matEdge)  matEdge.color.copy(currentColor);
    if (matPad)   matPad.color.copy(currentColor);

    // Rotate the circuit board (like the globe)
    if (circuitGroup) {
        circuitGroup.rotation.y += 0.0022;
        circuitGroup.rotation.x  = Math.sin(timeVal * 0.22) * 0.14;
        circuitGroup.rotation.z  = Math.cos(timeVal * 0.17) * 0.055;
    }

    // Signal pulses
    updateSignalPulses();

    // Scroll-driven 3D models
    scrollModels.forEach(function(obj) {
        if (!obj.element) return;

        var rect           = obj.element.getBoundingClientRect();
        var elementCenter  = rect.top + rect.height / 2;
        var normalizedDist = (elementCenter - vh / 2) / (vh * 1.1);

        var activeX  = isMobile ? 0   : 95;
        var activeY  = isMobile ? -20 : 5;
        var activeZ  = isMobile ? -30 : 50;
        var tgtScale = isMobile ? obj.activeScale * 0.65 : obj.activeScale;
        var rfX      = obj.rfX || 1.0;
        var rfZ      = obj.rfZ || 0.8;

        // Spin internal fans
        obj.mesh.children.forEach(function(child) {
            if (child.geometry && child.geometry.type === 'TorusGeometry') child.rotation.z += 0.06;
        });

        if (normalizedDist > 1.0) {
            obj.mesh.position.set(320, -200, -350);
            obj.mesh.scale.setScalar(0.001);

        } else if (normalizedDist > 0.0) {
            var t1   = 1.0 - normalizedDist;
            var ease1 = t1 * t1 * (3 - 2 * t1);
            obj.mesh.position.x = THREE.MathUtils.lerp(320,  activeX, ease1);
            obj.mesh.position.y = THREE.MathUtils.lerp(-200, activeY, ease1);
            obj.mesh.position.z = THREE.MathUtils.lerp(-350, activeZ, ease1);
            obj.mesh.scale.setScalar(THREE.MathUtils.lerp(0.001, tgtScale, ease1));
            obj.mesh.rotation.y = timeVal * 1.2 + (1 - ease1) * Math.PI * 2;
            obj.mesh.rotation.x = Math.sin(timeVal * rfX) * 0.4;
            obj.mesh.rotation.z = Math.cos(timeVal * rfZ) * 0.28;

        } else if (normalizedDist > -1.0) {
            var t2   = -normalizedDist;
            var ease2 = t2 * t2 * (3 - 2 * t2);
            var swX  = Math.sin(timeVal * 0.9 + obj.phaseOffset) * 6;
            var swY  = Math.cos(timeVal * 0.7 + obj.phaseOffset) * 5;
            obj.mesh.position.x = THREE.MathUtils.lerp(activeX + swX * (1 - ease2), -320, ease2);
            obj.mesh.position.y = THREE.MathUtils.lerp(activeY + swY * (1 - ease2),  200, ease2);
            obj.mesh.position.z = THREE.MathUtils.lerp(activeZ, -300, ease2);
            obj.mesh.scale.setScalar(THREE.MathUtils.lerp(tgtScale, 0.001, ease2));
            obj.mesh.rotation.y = timeVal * 1.2 - ease2 * Math.PI * 2;
            obj.mesh.rotation.x = Math.sin(timeVal * rfX) * 0.4;
            obj.mesh.rotation.z = Math.cos(timeVal * rfZ) * 0.28;

        } else {
            obj.mesh.position.set(-320, 200, -300);
            obj.mesh.scale.setScalar(0.001);
        }

        // Sync wireframe colours to current theme
        obj.mesh.traverse(function(child) {
            if (child.isMesh && child.material && child.material.wireframe) {
                child.material.color.lerp(currentColor, 0.05);
            }
            if (child.isLine && child.material && child.material.color) {
                child.material.color.lerp(currentColor, 0.05);
            }
        });
    });

    renderer.render(scene, camera);
}

// ============================================================
// ENTRY POINT
// ============================================================

window.addEventListener('DOMContentLoaded', function() {
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not available. Skipping 3D.');
        var loading = document.getElementById('loading');
        if (loading) loading.classList.add('hidden');
        return;
    }
    initThree();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(r) { console.log('SW registered:', r.scope); })
            .catch(function(e) { console.log('SW failed:', e); });
    });
}
