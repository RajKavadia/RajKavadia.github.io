/**
 * Interactive iOS Memoji-style 3D person avatar (Three.js + WebGL with Canvas fallback).
 * A friendly, rounded person — expressive face, blinking eyes, soft sweater,
 * AirPods-style earbuds, MacBook-style laptop and iPhone — who tracks the
 * cursor, types, inspects, and waves. Built for Raj Kavadia's portfolio.
 */
(function () {
  const STATUS_MESSAGES = [
    "flutter_ai_whisper: VM connected!",
    "Release APK size reduced by 40%!",
    "Jetpack Compose @ 60 FPS locked!",
    "Impact Analyzer: 0 high-risk files",
    "VAPT Audit: 0 critical findings!",
    "GitHub Actions: shipped in 3 days!"
  ];

  function initDeveloperAvatar3D() {
    const container = document.getElementById("avatar-3d-stage");
    const canvas = document.getElementById("avatar-3d-canvas");
    const statusToast = document.getElementById("avatar-status-toast");
    const modeButtons = document.querySelectorAll("[data-avatar-mode]");

    if (!container || !canvas) return;

    let currentMode = "coding"; // "coding" | "mcp" | "shipping"
    let waveTimer = 0;
    let statusIdx = 0;
    let pointerX = 0;
    let pointerY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let userRotationY = 0;
    let targetRotationY = -0.22;

    function triggerStatusToast(customText) {
      if (!statusToast) return;
      const msg = customText || STATUS_MESSAGES[statusIdx % STATUS_MESSAGES.length];
      statusIdx++;
      statusToast.textContent = msg;
      statusToast.classList.remove("opacity-0", "translate-y-2");
      statusToast.classList.add("opacity-100", "translate-y-0");
      clearTimeout(statusToast._hideTimer);
      statusToast._hideTimer = setTimeout(() => {
        statusToast.classList.add("opacity-0", "translate-y-2");
        statusToast.classList.remove("opacity-100", "translate-y-0");
      }, 2800);
    }

    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-avatar-mode");
        if (!mode) return;
        currentMode = mode;
        modeButtons.forEach((b) => {
          const active = b.getAttribute("data-avatar-mode") === mode;
          b.classList.toggle("active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });
        if (mode === "coding") {
          triggerStatusToast("Mode: Kotlin & Flutter Coding");
        } else if (mode === "mcp") {
          triggerStatusToast("Mode: Live MCP State Inspection");
        } else if (mode === "shipping") {
          waveTimer = 2.4;
          triggerStatusToast("Mode: CI/CD Play Store Release!");
        }
      });
    });

    // Pointer / touch interaction
    function onPointerMove(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      const nx = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ny = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      pointerX = Math.max(-1, Math.min(1, nx));
      pointerY = Math.max(-1, Math.min(1, ny));

      if (isDragging) {
        const deltaX = clientX - dragStartX;
        dragStartX = clientX;
        targetRotationY += deltaX * 0.01;
      }
    }

    container.addEventListener("mousemove", (e) => onPointerMove(e.clientX, e.clientY));
    container.addEventListener("mousedown", (e) => {
      isDragging = true;
      dragStartX = e.clientX;
    });
    window.addEventListener("mouseup", () => {
      isDragging = false;
    });
    container.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 0) {
          onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );
    container.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length > 0) {
          isDragging = true;
          dragStartX = e.touches[0].clientX;
        }
      },
      { passive: true }
    );
    window.addEventListener("touchend", () => {
      isDragging = false;
    });

    canvas.addEventListener("click", () => {
      waveTimer = 2.2;
      triggerStatusToast();
    });

    // Try Three.js WebGLRenderer first
    let renderer = null;
    if (window.THREE) {
      try {
        renderer = new window.THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        });
      } catch (err) {
        renderer = null;
      }
    }

    if (!renderer) {
      startFallback3DCanvas(canvas, container, () => ({
        currentMode,
        waveTimer: (dt) => {
          if (waveTimer > 0) waveTimer = Math.max(0, waveTimer - dt);
          return waveTimer;
        },
        pointerX,
        pointerY,
        targetRotationY
      }));
      return;
    }

    const THREE = window.THREE;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 1.35, 6.2);
    camera.lookAt(0, 0.35, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.15);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.25);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const screenGlow = new THREE.PointLight(0x60a5fa, 1.4, 4);
    screenGlow.position.set(0, 0.45, 0.65);
    scene.add(screenGlow);

    // Root stage group
    const stageGroup = new THREE.Group();
    stageGroup.rotation.y = targetRotationY;
    scene.add(stageGroup);

    // Materials — soft, matte, Memoji-like shading (no metallic robot surfaces)
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf0ad7e,
      roughness: 0.65,
      metalness: 0.0
    });
    const skinShadowMat = new THREE.MeshStandardMaterial({
      color: 0xdd9663,
      roughness: 0.7,
      metalness: 0.0
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a20,
      roughness: 0.75,
      metalness: 0.0
    });
    const hairLightMat = new THREE.MeshStandardMaterial({
      color: 0x5a4230,
      roughness: 0.7,
      metalness: 0.0
    });
    const beardMat = new THREE.MeshStandardMaterial({
      color: 0x38271c,
      roughness: 0.85,
      metalness: 0.0
    });
    // Navy blazer (main torso), blue collared shirt, white tee underneath
    const hoodieMat = new THREE.MeshStandardMaterial({
      color: 0x263142,
      roughness: 0.85,
      metalness: 0.0
    });
    const hoodieAccentMat = new THREE.MeshStandardMaterial({
      color: 0x4a86d9,
      roughness: 0.8,
      metalness: 0.0
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x4a86d9,
      roughness: 0.85,
      metalness: 0.0
    });
    const teeMat = new THREE.MeshStandardMaterial({
      color: 0xf4f6f8,
      roughness: 0.9,
      metalness: 0.0
    });
    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xf49a8a,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.55
    });
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xa85f4d,
      roughness: 0.6,
      metalness: 0.0
    });
    const earbudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.05
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.7
    });
    const silverMetalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.8
    });
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x33415e,
      roughness: 0.6,
      metalness: 0.1
    });
    const glowBlueMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const glowGreenMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const glowPurpleMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa });
    const glowAmberMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    // Floating Cyber Desk Platform
    const deskGroup = new THREE.Group();
    stageGroup.add(deskGroup);

    const deskTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 1.95, 0.12, 48),
      deskMat
    );
    deskTop.position.set(0, -0.25, 0);
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    const deskRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.91, 0.025, 16, 64),
      glowBlueMat
    );
    deskRim.rotation.x = Math.PI / 2;
    deskRim.position.set(0, -0.25, 0);
    deskGroup.add(deskRim);

    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.018, 12, 48),
      glowPurpleMat
    );
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.set(0, -0.58, 0);
    deskGroup.add(baseRing);

    // Soft mint halo disc behind the portrait, like the reference backdrop.
    // Parented to the stage so it parallaxes gently when the avatar rotates.
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 48),
      new THREE.MeshBasicMaterial({
        color: 0xc4eef0,
        transparent: true,
        opacity: 0.95
      })
    );
    halo.position.set(0, 0.82, -1.0);
    stageGroup.add(halo);

    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.015, 10, 64),
      new THREE.MeshBasicMaterial({
        color: 0xe6fbfa,
        transparent: true,
        opacity: 0.8
      })
    );
    haloRing.position.copy(halo.position);
    stageGroup.add(haloRing);

    // Rainbow arc behind the character, Krikey-style colorful scene
    const rainbowColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0x8b5cf6];
    rainbowColors.forEach(function (color, index) {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(1.25 - index * 0.045, 0.03, 8, 64, Math.PI),
        new THREE.MeshBasicMaterial({ color: color })
      );
      arc.rotation.z = Math.PI;
      arc.position.set(0, 0.72, -0.72);
      stageGroup.add(arc);
    });

    // Person Character Group — scaled up so the face is the hero of the stage
    const devGroup = new THREE.Group();
    devGroup.position.set(0, -0.3, -0.35);
    devGroup.scale.setScalar(1.16);
    stageGroup.add(devGroup);

    // Torso (Hoodie)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.55, 0);
    devGroup.add(torsoGroup);

    // Rounded sweater torso — one soft, squashed sphere like a Memoji body
    const torsoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 32, 32),
      hoodieMat
    );
    torsoMesh.scale.set(1.02, 1.08, 0.8);
    torsoMesh.position.set(0, -0.02, 0);
    torsoMesh.castShadow = true;
    torsoGroup.add(torsoMesh);

    // Shirt and tee as flat triangular neckline panels, like the reference's
    // open blazer over a blue shirt over a white tee (no oval badge shapes)
    function trianglePanel(halfWidth, topY, bottomY, z, mat) {
      const shape = new THREE.Shape();
      shape.moveTo(-halfWidth, topY);
      shape.lineTo(halfWidth, topY);
      shape.lineTo(0, bottomY);
      shape.closePath();
      const mesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshStandardMaterial({
          color: mat.color,
          roughness: 0.85,
          metalness: 0.0,
          side: THREE.DoubleSide
        })
      );
      mesh.position.z = z;
      torsoGroup.add(mesh);
      return mesh;
    }
    trianglePanel(0.2, 0.44, 0.0, 0.445, shirtMat);
    trianglePanel(0.115, 0.42, 0.1, 0.46, teeMat);

    // Blazer lapels — two angled panels forming the open V
    function makeLapel(side) {
      const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.46, 0.035), hoodieMat);
      lapel.position.set(side * 0.17, 0.14, 0.435);
      lapel.rotation.z = side * -0.38;
      lapel.rotation.y = side * 0.25;
      torsoGroup.add(lapel);
    }
    makeLapel(-1);
    makeLapel(1);

    // Shirt collar points over the tee
    function makeCollarPoint(side) {
      const point = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.03), shirtMat);
      point.position.set(side * 0.085, 0.42, 0.42);
      point.rotation.z = side * 0.5;
      point.rotation.x = -0.15;
      torsoGroup.add(point);
    }
    makeCollarPoint(-1);
    makeCollarPoint(1);

    // Neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.22, 16),
      skinMat
    );
    neck.position.set(0, 0.56, 0);
    torsoGroup.add(neck);

    // Head Group (tracks cursor) — adult proportions: longer face, defined jaw
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.0, 0.02);
    headGroup.scale.setScalar(0.96);
    torsoGroup.add(headGroup);

    const headSkull = new THREE.Mesh(
      new THREE.SphereGeometry(0.43, 40, 40),
      skinMat
    );
    headSkull.scale.set(0.9, 1.1, 0.93);
    headSkull.castShadow = true;
    headGroup.add(headSkull);

    // Defined jaw and chin
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 28), skinMat);
    jaw.scale.set(0.88, 0.78, 0.85);
    jaw.position.set(0, -0.26, 0.05);
    headGroup.add(jaw);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.085, 14, 14);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.scale.set(0.55, 1, 0.8);
    leftEar.position.set(-0.41, -0.03, 0);
    headGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.scale.set(0.55, 1, 0.8);
    rightEar.position.set(0.41, -0.03, 0);
    headGroup.add(rightEar);

    // Sculpted swept-back hair like the reference: a fitted cap plus
    // individual wavy strands flowing from the hairline towards the back
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hairCap.scale.set(0.93, 1.08, 0.97);
    hairCap.rotation.x = -0.28;
    hairCap.position.set(0, 0.07, -0.04);
    headGroup.add(hairCap);

    for (let i = -3; i <= 3; i++) {
      const strand = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.042, 0.3, 6, 12),
        i % 2 === 0 ? hairMat : hairLightMat
      );
      strand.position.set(
        i * 0.085,
        0.42 - Math.abs(i) * 0.012,
        0.16 - Math.abs(i) * 0.02
      );
      strand.rotation.x = 1.15 + Math.abs(i) * 0.06;
      strand.rotation.z = i * -0.07;
      strand.rotation.y = i * 0.1;
      headGroup.add(strand);
    }

    // Swept fringe wave across the front hairline
    for (let i = -2; i <= 2; i++) {
      const wave = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 18), i % 2 ? hairLightMat : hairMat);
      wave.scale.set(1.25, 0.62, 0.85);
      wave.position.set(i * 0.1 - 0.03, 0.36 - Math.abs(i) * 0.014, 0.3 - Math.abs(i) * 0.03);
      wave.rotation.z = -0.35 + i * 0.08;
      headGroup.add(wave);
    }

    // Subtle cheek warmth (very light, adult portrait — not rosy cartoon cheeks)
    const cheekGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.scale.set(1.1, 0.7, 0.3);
    leftCheek.position.set(-0.2, -0.1, 0.33);
    headGroup.add(leftCheek);
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.scale.set(1.1, 0.7, 0.3);
    rightCheek.position.set(0.2, -0.1, 0.33);
    headGroup.add(rightCheek);

    // Defined nose: bridge plus rounded tip
    const noseBridge = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.028, 0.09, 6, 10),
      skinShadowMat
    );
    noseBridge.position.set(0, 0.0, 0.395);
    noseBridge.rotation.x = 0.25;
    headGroup.add(noseBridge);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), skinShadowMat);
    nose.scale.set(0.95, 0.85, 0.75);
    nose.position.set(0, -0.075, 0.4);
    headGroup.add(nose);

    // Trimmed beard along the jaw, moustache, and chin goatee (reference look)
    const beard = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 36, 36, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.36),
      beardMat
    );
    beard.scale.set(0.92, 1.08, 0.94);
    beard.position.set(0, -0.03, 0.015);
    headGroup.add(beard);

    function makeSideburn(side) {
      const burn = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.032, 0.12, 6, 10),
        beardMat
      );
      burn.position.set(side * 0.365, -0.08, 0.13);
      burn.rotation.z = side * 0.08;
      headGroup.add(burn);
    }
    makeSideburn(-1);
    makeSideburn(1);

    // Closed-lip subtle smile, framed by the moustache
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.017, 10, 24, Math.PI),
      lipMat
    );
    smile.rotation.x = Math.PI;
    smile.position.set(0, -0.165, 0.385);
    headGroup.add(smile);

    // Inner mouth that opens and closes so the avatar talks, Krikey-style
    const talkMouth = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x4a2420 })
    );
    talkMouth.scale.set(1.05, 0.18, 0.32);
    talkMouth.position.set(0, -0.2, 0.355);
    headGroup.add(talkMouth);

    const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 14), lipMat);
    lowerLip.scale.set(1.35, 0.5, 0.5);
    lowerLip.position.set(0, -0.225, 0.365);
    headGroup.add(lowerLip);

    function makeMoustache(side) {
      const mo = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.02, 0.075, 6, 10),
        beardMat
      );
      mo.position.set(side * 0.048, -0.135, 0.395);
      mo.rotation.z = Math.PI / 2 + side * -0.28;
      mo.rotation.y = side * 0.25;
      headGroup.add(mo);
    }
    makeMoustache(-1);
    makeMoustache(1);

    // Chin goatee patch below the lower lip
    const goatee = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), beardMat);
    goatee.scale.set(0.85, 1.15, 0.5);
    goatee.position.set(0, -0.3, 0.335);
    headGroup.add(goatee);

    // Big expressive Memoji eyes — white, brown iris, pupil and a catchlight.
    // Each eye is a group so it can blink (scale Y) while the iris tracks the cursor.
    function makeEye(x) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, 0.03, 0.355);

      const white = new THREE.Mesh(
        new THREE.SphereGeometry(0.078, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
      );
      white.scale.set(1.05, 1.22, 0.5);
      eyeGroup.add(white);

      const iris = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x4a2c14, roughness: 0.35 })
      );
      iris.scale.set(1, 1.15, 0.5);
      iris.position.set(0, 0.004, 0.032);
      eyeGroup.add(iris);

      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x140b06 })
      );
      pupil.position.set(0, 0.004, 0.052);
      eyeGroup.add(pupil);

      const catchlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      catchlight.position.set(0.014, 0.022, 0.058);
      eyeGroup.add(catchlight);

      headGroup.add(eyeGroup);
      return { group: eyeGroup, iris: iris, pupil: pupil, catchlight: catchlight };
    }

    const leftEyeObj = makeEye(-0.138);
    const rightEyeObj = makeEye(0.138);
    const leftEye = leftEyeObj.group;
    const rightEye = rightEyeObj.group;

    // Thick, straight sculpted eyebrows like the reference
    function makeBrow(x, tilt) {
      const brow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.024, 0.1, 6, 12),
        beardMat
      );
      brow.rotation.z = Math.PI / 2 + tilt;
      brow.position.set(x, 0.175, 0.375);
      headGroup.add(brow);
      return brow;
    }
    const leftBrow = makeBrow(-0.138, 0.06);
    const rightBrow = makeBrow(0.138, -0.06);
    // Clean ears with no earbuds/headphones, matching the portrait reference

    // Articulated Arms & Hands
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.46, 0.3, 0);
    torsoGroup.add(leftArmPivot);

    const leftForearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.095, 0.38, 8, 16),
      hoodieMat
    );
    leftForearm.position.set(-0.04, -0.22, 0.22);
    leftForearm.rotation.x = 1.05;
    leftForearm.rotation.z = -0.22;
    leftArmPivot.add(leftForearm);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 18), skinMat);
    leftHand.scale.set(0.9, 1.05, 0.95);
    leftHand.position.set(-0.12, -0.36, 0.48);
    leftArmPivot.add(leftHand);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.46, 0.3, 0);
    torsoGroup.add(rightArmPivot);

    const rightForearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.095, 0.38, 8, 16),
      hoodieMat
    );
    rightForearm.position.set(0.04, -0.22, 0.22);
    rightForearm.rotation.x = 1.05;
    rightForearm.rotation.z = 0.22;
    rightArmPivot.add(rightForearm);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 18), skinMat);
    rightHand.scale.set(0.9, 1.05, 0.95);
    rightHand.position.set(0.12, -0.36, 0.48);
    rightArmPivot.add(rightHand);

    // Little thumbs so the hands read as hands, not balls
    const leftThumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.026, 0.05, 6, 10),
      skinMat
    );
    leftThumb.position.set(-0.045, -0.33, 0.53);
    leftThumb.rotation.set(0.6, 0, -0.7);
    leftArmPivot.add(leftThumb);

    const rightThumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.026, 0.05, 6, 10),
      skinMat
    );
    rightThumb.position.set(0.045, -0.33, 0.53);
    rightThumb.rotation.set(0.6, 0, 0.7);
    rightArmPivot.add(rightThumb);

    // Laptop & Mechanical Keyboard on Desk
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(0, -0.17, 0.42);
    stageGroup.add(laptopGroup);

    const laptopBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.045, 0.62),
      silverMetalMat
    );
    laptopBase.castShadow = true;
    laptopGroup.add(laptopBase);

    // Animated RGB Keycaps on Laptop Base
    const keycaps = [];
    const keyColors = [0x38bdf8, 0x34d399, 0xa78bfa, 0x60a5fa];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 7; c++) {
        const keyMat = new THREE.MeshBasicMaterial({
          color: keyColors[(r + c) % keyColors.length]
        });
        const key = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 0.08), keyMat);
        key.position.set(-0.3 + c * 0.1, 0.028, -0.12 + r * 0.1);
        laptopGroup.add(key);
        keycaps.push(key);
      }
    }

    // Laptop Lid / Screen
    const laptopLidPivot = new THREE.Group();
    laptopLidPivot.position.set(0, 0.02, 0.29);
    laptopLidPivot.rotation.x = -0.38;
    laptopGroup.add(laptopLidPivot);

    const laptopScreenBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.6, 0.035),
      silverMetalMat
    );
    laptopScreenBack.position.set(0, 0.3, 0);
    laptopLidPivot.add(laptopScreenBack);

    // Glowing code lines facing the developer
    const laptopDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.52),
      new THREE.MeshBasicMaterial({ color: 0x090d16 })
    );
    laptopDisplay.rotation.y = Math.PI;
    laptopDisplay.position.set(0, 0.3, -0.019);
    laptopLidPivot.add(laptopDisplay);

    for (let i = 0; i < 5; i++) {
      const barWidth = 0.25 + ((i * 17) % 35) * 0.012;
      const codeLine = new THREE.Mesh(
        new THREE.PlaneGeometry(barWidth, 0.032),
        i % 2 === 0 ? glowBlueMat : glowGreenMat
      );
      codeLine.rotation.y = Math.PI;
      codeLine.position.set(0.32 - barWidth / 2, 0.46 - i * 0.08, -0.021);
      laptopLidPivot.add(codeLine);
    }

    // Back of Laptop Logo (Glowing Flutter/Kotlin Diamond)
    const lidLogo = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.075, 0),
      glowBlueMat
    );
    lidLogo.position.set(0, 0.3, 0.025);
    lidLogo.scale.set(1, 1, 0.3);
    laptopLidPivot.add(lidLogo);

    // Floating 3D Smartphone (Android / Flutter Live Device with MCP Inspection Beam)
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(1.28, 0.62, 0.35);
    phoneGroup.rotation.y = -0.45;
    phoneGroup.rotation.z = 0.06;
    stageGroup.add(phoneGroup);

    const phoneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 1.02, 0.06),
      darkMetalMat
    );
    phoneBody.castShadow = true;
    phoneGroup.add(phoneBody);

    const phoneScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.94),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    phoneScreen.position.set(0, 0, 0.032);
    phoneGroup.add(phoneScreen);

    // App UI Cards on the 3D Smartphone Screen
    const uiHeader = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x1d4ed8 })
    );
    uiHeader.position.set(0, 0.34, 0.035);
    phoneGroup.add(uiHeader);

    const uiCard1 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.22),
      new THREE.MeshBasicMaterial({ color: 0x1e293b })
    );
    uiCard1.position.set(0, 0.11, 0.035);
    phoneGroup.add(uiCard1);

    const uiAccentBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.045),
      glowGreenMat
    );
    uiAccentBar.position.set(-0.02, 0.14, 0.038);
    phoneGroup.add(uiAccentBar);

    const uiCard2 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.28),
      new THREE.MeshBasicMaterial({ color: 0x1e293b })
    );
    uiCard2.position.set(0, -0.18, 0.035);
    phoneGroup.add(uiCard2);

    const uiFab = new THREE.Mesh(
      new THREE.CircleGeometry(0.055, 20),
      glowBlueMat
    );
    uiFab.position.set(0.12, -0.36, 0.038);
    phoneGroup.add(uiFab);

    // MCP Inspection Scan Ring around the Phone
    const mcpScanRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.014, 12, 36),
      glowAmberMat
    );
    mcpScanRing.rotation.x = Math.PI / 2;
    mcpScanRing.position.set(0, 0, 0);
    phoneGroup.add(mcpScanRing);

    // MCP Telemetry Beam connecting Laptop to Floating Phone
    const beamCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.35, 0.1, 0.42),
      new THREE.Vector3(0.85, 0.65, 0.65),
      new THREE.Vector3(1.25, 0.55, 0.35)
    );
    const beamGeo = new THREE.TubeGeometry(beamCurve, 24, 0.014, 8, false);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65
    });
    const mcpBeam = new THREE.Mesh(beamGeo, beamMat);
    stageGroup.add(mcpBeam);

    // Orbiting Tech Nodes (Android Green, Flutter Blue, Kotlin Purple, MCP Gold)
    const orbitGroup = new THREE.Group();
    orbitGroup.position.set(0, 0.55, 0);
    stageGroup.add(orbitGroup);

    // Soft glossy pastel bubbles orbiting the person (iOS-like, not crystals)
    function bubble(color, size) {
      return new THREE.Mesh(
        new THREE.SphereGeometry(size, 24, 24),
        new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.25,
          metalness: 0.0,
          transparent: true,
          opacity: 0.92
        })
      );
    }
    const techNodes = [
      { mesh: bubble(0x34d399, 0.115), angle: 0, radius: 1.55, yOffset: 0.45 },
      { mesh: bubble(0x38bdf8, 0.105), angle: Math.PI * 0.65, radius: 1.6, yOffset: -0.1 },
      { mesh: bubble(0xa78bfa, 0.12), angle: Math.PI * 1.25, radius: 1.5, yOffset: 0.35 },
      { mesh: bubble(0xfbbf24, 0.095), angle: Math.PI * 1.75, radius: 1.55, yOffset: 0.65 }
    ];
    techNodes.forEach((node) => {
      orbitGroup.add(node.mesh);
    });

    // Resize handling
    function updateSize() {
      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 280);
      const height = Math.max(rect.height, 320);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    updateSize();
    window.addEventListener("resize", updateSize);

    // Animation Loop
    let lastTime = performance.now();
    function animate(now) {
      requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const t = now * 0.001;

      if (waveTimer > 0) {
        waveTimer = Math.max(0, waveTimer - dt);
      }

      // Smoothly interpolate stage rotation
      const modeRotOffset =
        currentMode === "mcp" ? -0.35 : currentMode === "shipping" ? 0.18 : -0.18;
      userRotationY += (targetRotationY + modeRotOffset - userRotationY) * 0.08;
      stageGroup.rotation.y = userRotationY + Math.sin(t * 0.7) * 0.05;

      // Krikey-like lively idle: a small bounce plus breathing
      devGroup.position.y = -0.3 + Math.sin(t * 2.6) * 0.028;
      torsoGroup.position.y = 0.55 + Math.sin(t * 2.2) * 0.018;

      // Talking mouth — opens in a speech rhythm, wider while waving or shipping
      const talkRate = currentMode === "shipping" || waveTimer > 0 ? 11 : 6.5;
      const talkOpen = Math.abs(Math.sin(t * talkRate));
      talkMouth.scale.y = 0.12 + talkOpen * (currentMode === "coding" ? 0.55 : 0.85);
      lowerLip.position.y = -0.225 - talkOpen * 0.03;

      // Head & eyes smoothly track pointer, with a gentle Memoji-like bob and tilt
      const targetHeadYaw = pointerX * 0.42 + (currentMode === "mcp" ? 0.35 : 0);
      const targetHeadPitch = -pointerY * 0.25 + (currentMode === "coding" ? 0.14 : 0);
      headGroup.rotation.y += (targetHeadYaw - headGroup.rotation.y) * 0.12;
      headGroup.rotation.x += (targetHeadPitch - headGroup.rotation.x) * 0.12;
      headGroup.rotation.z = Math.sin(t * 1.35) * 0.035 + pointerX * -0.04;
      headGroup.position.y = 1.0 + Math.sin(t * 2.2) * 0.012;

      // Irises (with pupil + catchlight) follow the cursor
      [leftEyeObj, rightEyeObj].forEach(function (eye) {
        eye.iris.position.x = pointerX * 0.016;
        eye.iris.position.y = 0.004 + pointerY * 0.012;
        eye.pupil.position.x = pointerX * 0.016;
        eye.pupil.position.y = 0.004 + pointerY * 0.012;
        eye.catchlight.position.x = 0.014 + pointerX * 0.016;
        eye.catchlight.position.y = 0.022 + pointerY * 0.012;
      });

      // Natural blink every ~3.4s, plus a happy squint while waving/shipping
      const blinkCycle = t % 3.4;
      let eyeScaleY = 1;
      if (blinkCycle < 0.16) {
        eyeScaleY = 0.1 + Math.abs(blinkCycle - 0.08) / 0.08 * 0.9;
      }
      if (waveTimer > 0 || currentMode === "shipping") {
        eyeScaleY = Math.min(eyeScaleY, 0.55);
      }
      leftEye.scale.y += (eyeScaleY - leftEye.scale.y) * 0.55;
      rightEye.scale.y += (eyeScaleY - rightEye.scale.y) * 0.55;

      // Brows lift a little while waving
      const browLift = waveTimer > 0 || currentMode === "shipping" ? 0.035 : 0;
      leftBrow.position.y = 0.175 + browLift;
      rightBrow.position.y = 0.175 + browLift;

      // Hands typing or waving
      const typingSpeed = currentMode === "coding" ? 15 : 8;
      leftArmPivot.rotation.x = Math.sin(t * typingSpeed) * 0.11;
      leftHand.position.y = -0.36 + Math.abs(Math.sin(t * typingSpeed)) * 0.045;

      if (waveTimer > 0 || currentMode === "shipping") {
        // Friendly wave with right arm
        rightArmPivot.rotation.z = 1.95 + Math.sin(t * 10) * 0.28;
        rightArmPivot.rotation.x = -0.35;
      } else if (currentMode === "mcp") {
        // Pointing/inspecting floating mobile device
        rightArmPivot.rotation.z = 0.65 + Math.sin(t * 3) * 0.06;
        rightArmPivot.rotation.x = 0.25;
      } else {
        rightArmPivot.rotation.z += (0 - rightArmPivot.rotation.z) * 0.15;
        rightArmPivot.rotation.x = Math.cos(t * typingSpeed) * 0.11;
        rightHand.position.y = -0.36 + Math.abs(Math.cos(t * typingSpeed)) * 0.045;
      }

      // Keycap ripple
      keycaps.forEach((key, idx) => {
        const active = Math.sin(t * typingSpeed + idx * 1.3) > 0.65;
        key.position.y = active ? 0.021 : 0.028;
      });

      // Floating 3D Phone & MCP Scan Ring
      phoneGroup.position.y = 0.62 + Math.sin(t * 2.0) * 0.07;
      phoneGroup.rotation.y = -0.45 + Math.sin(t * 1.3) * 0.08;
      mcpScanRing.position.y = Math.sin(t * 3.2) * 0.42;
      mcpScanRing.scale.setScalar(currentMode === "mcp" ? 1.18 : 0.95);
      beamMat.opacity = currentMode === "mcp" ? 0.9 : 0.45 + Math.sin(t * 4) * 0.2;

      // Orbiting 3D crystals
      const orbitSpeed = currentMode === "shipping" ? 1.6 : 0.65;
      techNodes.forEach((node, idx) => {
        const a = node.angle + t * orbitSpeed;
        node.mesh.position.set(
          Math.cos(a) * node.radius,
          node.yOffset + Math.sin(t * 2.3 + idx) * 0.12,
          Math.sin(a) * (node.radius * 0.55)
        );
        node.mesh.rotation.x = t * 1.4 + idx;
        node.mesh.rotation.y = t * 1.8 + idx;
      });

      lidLogo.rotation.y = t * 2.0;

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
  }

  // High-DPI 3D Perspective Canvas2D Renderer Fallback (for environments without WebGL context)
  function startFallback3DCanvas(canvas, container, getState) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(rect.width, 300) * dpr;
      canvas.height = Math.max(rect.height, 340) * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    function draw(now) {
      requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const t = now * 0.001;
      const state = getState();
      const waving = state.waveTimer(dt) > 0 || state.currentMode === "shipping";

      const w = canvas.width / Math.min(window.devicePixelRatio || 1, 2);
      const h = canvas.height / Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.46 + state.pointerX * 8;
      const cy = h * 0.54 + Math.sin(t * 2.2) * 4;

      // Sky scene with a rainbow arc, Krikey-style
      const rainbow = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#8b5cf6"];
      rainbow.forEach(function (color, index) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(cx, cy + 20, 150 - index * 8, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
      });

      const deskGrad = ctx.createRadialGradient(cx, cy + 105, 10, cx, cy + 105, 150);
      deskGrad.addColorStop(0, "rgba(59, 130, 246, 0.38)");
      deskGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = deskGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 105, 145, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Desk Platform
      ctx.fillStyle = "#33415e";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 95, 128, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Navy blazer torso with a blue shirt and white tee V
      const blazerGrad = ctx.createLinearGradient(cx - 55, cy - 20, cx + 55, cy + 85);
      blazerGrad.addColorStop(0, "#2e3c55");
      blazerGrad.addColorStop(1, "#1c2637");
      ctx.fillStyle = blazerGrad;
      ctx.beginPath();
      ctx.roundRect(cx - 58, cy - 12, 116, 92, [38, 38, 16, 16]);
      ctx.fill();
      ctx.fillStyle = "#4a86d9";
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 10);
      ctx.lineTo(cx + 20, cy - 10);
      ctx.lineTo(cx, cy + 52);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f4f6f8";
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy - 8);
      ctx.lineTo(cx + 11, cy - 8);
      ctx.lineTo(cx, cy + 38);
      ctx.closePath();
      ctx.fill();

      // Waving or Typing Arms (blazer sleeves)
      ctx.strokeStyle = "#263142";
      ctx.lineWidth = 18;
      ctx.lineCap = "round";
      if (waving) {
        const waveAngle = Math.sin(t * 10) * 14;
        ctx.beginPath();
        ctx.moveTo(cx + 48, cy + 8);
        ctx.lineTo(cx + 88 + waveAngle, cy - 46);
        ctx.stroke();
        ctx.fillStyle = "#e0a97f";
        ctx.beginPath();
        ctx.arc(cx + 88 + waveAngle, cy - 46, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head
      const hx = cx + state.pointerX * 12;
      const hy = cy - 58 - state.pointerY * 8;

      // Face — adult proportions: taller oval head
      ctx.fillStyle = "#f0ad7e";
      ctx.beginPath();
      ctx.ellipse(hx, hy, 40, 48, 0, 0, Math.PI * 2);
      ctx.fill();

      // Clean ears (no earbuds, matching the portrait reference)
      ctx.fillStyle = "#f0ad7e";
      ctx.beginPath();
      ctx.ellipse(hx - 40, hy + 4, 6, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(hx + 40, hy + 4, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trimmed beard along the jaw + chin goatee
      ctx.fillStyle = "#38271c";
      ctx.beginPath();
      ctx.ellipse(hx, hy + 26, 30, 22, 0, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(hx, hy + 34, 10, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Moustache above the lip line
      ctx.strokeStyle = "#38271c";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hx - 13, hy + 20);
      ctx.quadraticCurveTo(hx - 5, hy + 16, hx, hy + 20);
      ctx.quadraticCurveTo(hx + 5, hy + 16, hx + 13, hy + 20);
      ctx.stroke();

      // Nose
      ctx.fillStyle = "#dd9663";
      ctx.beginPath();
      ctx.ellipse(hx, hy + 8, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swept-back wavy hair: cap plus strand strokes flowing backwards
      ctx.fillStyle = "#3a2a20";
      ctx.beginPath();
      ctx.arc(hx, hy - 10, 41, Math.PI * 0.92, Math.PI * 2.08);
      ctx.fill();
      ctx.strokeStyle = "#3a2a20";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      for (let s = -2; s <= 2; s++) {
        ctx.beginPath();
        ctx.moveTo(hx + s * 13 - 6, hy - 38 + Math.abs(s) * 2);
        ctx.quadraticCurveTo(hx + s * 14, hy - 52, hx + s * 12 + 10, hy - 46);
        ctx.stroke();
      }
      ctx.strokeStyle = "#5a4230";
      ctx.lineWidth = 3;
      for (let s = -1; s <= 1; s++) {
        ctx.beginPath();
        ctx.moveTo(hx + s * 13 - 4, hy - 40);
        ctx.quadraticCurveTo(hx + s * 14, hy - 50, hx + s * 12 + 8, hy - 45);
        ctx.stroke();
      }

      // Expressive eyes — blink every ~3.4s; irises track the cursor
      const ex = state.pointerX * 4;
      const ey = -state.pointerY * 3;
      const blinkCycle = t % 3.4;
      const blinking = blinkCycle < 0.16;
      if (blinking) {
        ctx.strokeStyle = "#2a201b";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(hx - 21, hy - 2);
        ctx.lineTo(hx - 7, hy - 2);
        ctx.moveTo(hx + 7, hy - 2);
        ctx.lineTo(hx + 21, hy - 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(hx - 14, hy - 2, 8, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(hx + 14, hy - 2, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4a2c14";
        ctx.beginPath();
        ctx.arc(hx - 14 + ex, hy - 2 + ey, 4.5, 0, Math.PI * 2);
        ctx.arc(hx + 14 + ex, hy - 2 + ey, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#140b06";
        ctx.beginPath();
        ctx.arc(hx - 14 + ex, hy - 2 + ey, 2.2, 0, Math.PI * 2);
        ctx.arc(hx + 14 + ex, hy - 2 + ey, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(hx - 12 + ex, hy - 5 + ey, 1.4, 0, Math.PI * 2);
        ctx.arc(hx + 16 + ex, hy - 5 + ey, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Thick straight eyebrows
      ctx.strokeStyle = "#38271c";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hx - 22, hy - 16);
      ctx.quadraticCurveTo(hx - 14, hy - 20, hx - 6, hy - 16);
      ctx.moveTo(hx + 6, hy - 16);
      ctx.quadraticCurveTo(hx + 14, hy - 20, hx + 22, hy - 16);
      ctx.stroke();

      // Subtle closed-lip smile between moustache and goatee
      ctx.strokeStyle = "#a85f4d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx, hy + 18, 9, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();

      // Laptop on Desk
      ctx.fillStyle = "#cbd5e1";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - 48, cy + 32, 96, 56, 8);
      ctx.fill();
      ctx.stroke();

      // Glowing Logo on Laptop
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(cx, cy + 60, 7, 0, Math.PI * 2);
      ctx.fill();

      // Floating 3D Phone with MCP Beam
      const px = cx + 115;
      const py = cy - 28 + Math.sin(t * 2.2) * 7;

      ctx.strokeStyle = state.currentMode === "mcp" ? "#fbbf24" : "rgba(56, 189, 248, 0.65)";
      ctx.lineWidth = state.currentMode === "mcp" ? 3 : 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx + 42, cy + 45);
      ctx.quadraticCurveTo(cx + 85, cy + 5, px - 22, py + 15);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(px - 24, py - 44, 48, 88, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(px - 18, py - 34, 36, 14);
      ctx.fillStyle = "#34d399";
      ctx.fillRect(px - 18, py - 14, 28, 8);
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(px - 18, py, 36, 22);
    }

    requestAnimationFrame(draw);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDeveloperAvatar3D);
  } else {
    initDeveloperAvatar3D();
  }
})();
