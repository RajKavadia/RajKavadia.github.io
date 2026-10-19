/**
 * Interactive 3D Software Developer Avatar (Three.js + WebGL with 3D Canvas fallback)
 * Built for Raj Kavadia's Portfolio — Senior Mobile Engineer (Android, Flutter, Kotlin, Dart, MCP)
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

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe0a97f,
      roughness: 0.48,
      metalness: 0.05
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.6,
      metalness: 0.1
    });
    const hoodieMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.4,
      metalness: 0.15
    });
    const hoodieAccentMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.25
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
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.4
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

    // Developer Character Group
    const devGroup = new THREE.Group();
    devGroup.position.set(0, -0.18, -0.35);
    stageGroup.add(devGroup);

    // Torso (Hoodie)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.55, 0);
    devGroup.add(torsoGroup);

    const torsoMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.5, 0.92, 24),
      hoodieMat
    );
    torsoMesh.castShadow = true;
    torsoGroup.add(torsoMesh);

    // Shoulders
    const leftShoulderCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      hoodieMat
    );
    leftShoulderCap.position.set(-0.44, 0.32, 0);
    torsoGroup.add(leftShoulderCap);

    const rightShoulderCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      hoodieMat
    );
    rightShoulderCap.position.set(0.44, 0.32, 0);
    torsoGroup.add(rightShoulderCap);

    // Hoodie collar & drawstrings
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.07, 14, 28),
      hoodieAccentMat
    );
    collar.rotation.x = Math.PI / 2 + 0.15;
    collar.position.set(0, 0.45, 0.03);
    torsoGroup.add(collar);

    // Chest code logo badge (`</>`)
    const chestBadge = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.12, 0.04),
      glowBlueMat
    );
    chestBadge.position.set(0, 0.18, 0.44);
    torsoGroup.add(chestBadge);

    // Neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.22, 16),
      skinMat
    );
    neck.position.set(0, 0.56, 0);
    torsoGroup.add(neck);

    // Head Group (tracks cursor)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.92, 0.02);
    torsoGroup.add(headGroup);

    const headSkull = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 32, 32),
      skinMat
    );
    headSkull.scale.set(0.95, 1.06, 0.95);
    headSkull.castShadow = true;
    headGroup.add(headSkull);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.36, -0.02, 0);
    headGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.36, -0.02, 0);
    headGroup.add(rightEar);

    // Stylized Hair & Beard
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.395, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hairCap.scale.set(0.97, 1.05, 0.98);
    hairCap.rotation.x = -0.18;
    hairCap.position.set(0, 0.04, -0.02);
    headGroup.add(hairCap);

    // Front hair quiff waves
    for (let i = -2; i <= 2; i++) {
      const tuft = new THREE.Mesh(
        new THREE.CapsuleGeometry
          ? new THREE.CapsuleGeometry(0.075, 0.16, 8, 12)
          : new THREE.SphereGeometry(0.11, 12, 12),
        hairMat
      );
      tuft.position.set(i * 0.09, 0.34, 0.25 - Math.abs(i) * 0.03);
      tuft.rotation.z = -0.35 + i * 0.12;
      tuft.rotation.x = 0.4;
      headGroup.add(tuft);
    }

    // Subtle groomed beard/jawline
    const beard = new THREE.Mesh(
      new THREE.SphereGeometry(0.355, 24, 24, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.42),
      hairMat
    );
    beard.scale.set(0.93, 0.95, 0.96);
    beard.position.set(0, -0.04, 0.03);
    headGroup.add(beard);

    // Smile
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.016, 8, 20, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    smile.rotation.x = Math.PI;
    smile.position.set(0, -0.12, 0.345);
    headGroup.add(smile);

    // Eyes (with pupils that track pointer)
    const eyeWhiteGeo = new THREE.SphereGeometry(0.058, 16, 16);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.03, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const leftEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEye.position.set(-0.13, 0.05, 0.33);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEye.position.set(0.13, 0.05, 0.33);
    headGroup.add(rightEye);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.042);
    leftEye.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0, 0, 0.042);
    rightEye.add(rightPupil);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.11, 0.025, 0.025);
    const leftBrow = new THREE.Mesh(browGeo, hairMat);
    leftBrow.position.set(-0.13, 0.145, 0.35);
    leftBrow.rotation.z = 0.06;
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, hairMat);
    rightBrow.position.set(0.13, 0.145, 0.35);
    rightBrow.rotation.z = -0.06;
    headGroup.add(rightBrow);

    // Developer Glasses
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.05, 0.365);
    headGroup.add(glassesGroup);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8
    });
    const lensMat = new THREE.MeshPhysicalMaterial
      ? new THREE.MeshPhysicalMaterial({
          color: 0x60a5fa,
          transparent: true,
          opacity: 0.28,
          roughness: 0.1,
          metalness: 0.1
        })
      : new THREE.MeshBasicMaterial({
          color: 0x60a5fa,
          transparent: true,
          opacity: 0.28
        });

    const leftRim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.014, 12, 28), frameMat);
    leftRim.position.set(-0.135, 0, 0);
    glassesGroup.add(leftRim);

    const rightRim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.014, 12, 28), frameMat);
    rightRim.position.set(0.135, 0, 0);
    glassesGroup.add(rightRim);

    const leftLens = new THREE.Mesh(new THREE.CircleGeometry(0.088, 24), lensMat);
    leftLens.position.set(-0.135, 0, 0.005);
    glassesGroup.add(leftLens);

    const rightLens = new THREE.Mesh(new THREE.CircleGeometry(0.088, 24), lensMat);
    rightLens.position.set(0.135, 0, 0.005);
    glassesGroup.add(rightLens);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.016, 0.016), frameMat);
    bridge.position.set(0, 0.01, 0);
    glassesGroup.add(bridge);

    // Studio Headphones with Glowing LED Rings
    const headphoneBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.41, 0.032, 14, 36, Math.PI),
      darkMetalMat
    );
    headphoneBand.position.set(0, 0.02, -0.02);
    headGroup.add(headphoneBand);

    const cupGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.09, 24);
    const leftCup = new THREE.Mesh(cupGeo, darkMetalMat);
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(-0.4, 0.0, -0.02);
    headGroup.add(leftCup);

    const rightCup = new THREE.Mesh(cupGeo, darkMetalMat);
    rightCup.rotation.z = Math.PI / 2;
    rightCup.position.set(0.4, 0.0, -0.02);
    headGroup.add(rightCup);

    const cupGlowGeo = new THREE.TorusGeometry(0.095, 0.012, 10, 24);
    const leftCupGlow = new THREE.Mesh(cupGlowGeo, glowBlueMat);
    leftCupGlow.rotation.y = Math.PI / 2;
    leftCupGlow.position.set(-0.448, 0.0, -0.02);
    headGroup.add(leftCupGlow);

    const rightCupGlow = new THREE.Mesh(cupGlowGeo, glowBlueMat);
    rightCupGlow.rotation.y = Math.PI / 2;
    rightCupGlow.position.set(0.448, 0.0, -0.02);
    headGroup.add(rightCupGlow);

    // Articulated Arms & Hands
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.46, 0.3, 0);
    torsoGroup.add(leftArmPivot);

    const leftForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.085, 0.56, 16),
      hoodieMat
    );
    leftForearm.position.set(-0.04, -0.22, 0.22);
    leftForearm.rotation.x = 1.05;
    leftForearm.rotation.z = -0.22;
    leftArmPivot.add(leftForearm);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), skinMat);
    leftHand.position.set(-0.12, -0.36, 0.48);
    leftArmPivot.add(leftHand);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.46, 0.3, 0);
    torsoGroup.add(rightArmPivot);

    const rightForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.085, 0.56, 16),
      hoodieMat
    );
    rightForearm.position.set(0.04, -0.22, 0.22);
    rightForearm.rotation.x = 1.05;
    rightForearm.rotation.z = 0.22;
    rightArmPivot.add(rightForearm);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), skinMat);
    rightHand.position.set(0.12, -0.36, 0.48);
    rightArmPivot.add(rightHand);

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

    const techNodes = [
      { mesh: new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), glowGreenMat), angle: 0, radius: 1.55, yOffset: 0.45 },
      { mesh: new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), glowBlueMat), angle: Math.PI * 0.65, radius: 1.6, yOffset: -0.1 },
      { mesh: new THREE.Mesh(new THREE.TetrahedronGeometry(0.14, 0), glowPurpleMat), angle: Math.PI * 1.25, radius: 1.5, yOffset: 0.35 },
      { mesh: new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), glowAmberMat), angle: Math.PI * 1.75, radius: 1.55, yOffset: 0.65 }
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

      // Breathing torso animation
      torsoGroup.position.y = 0.55 + Math.sin(t * 2.2) * 0.018;

      // Head & pupils smoothly track pointer
      const targetHeadYaw = pointerX * 0.42 + (currentMode === "mcp" ? 0.35 : 0);
      const targetHeadPitch = -pointerY * 0.25 + (currentMode === "coding" ? 0.14 : 0);
      headGroup.rotation.y += (targetHeadYaw - headGroup.rotation.y) * 0.12;
      headGroup.rotation.x += (targetHeadPitch - headGroup.rotation.x) * 0.12;

      leftPupil.position.x = pointerX * 0.018;
      leftPupil.position.y = pointerY * 0.015;
      rightPupil.position.x = pointerX * 0.018;
      rightPupil.position.y = pointerY * 0.015;

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

      // Cyber Desk Halo
      const deskGrad = ctx.createRadialGradient(cx, cy + 105, 10, cx, cy + 105, 150);
      deskGrad.addColorStop(0, "rgba(59, 130, 246, 0.38)");
      deskGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = deskGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 105, 145, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Desk Platform
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 95, 128, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Torso (Developer Hoodie)
      const hoodieGrad = ctx.createLinearGradient(cx - 55, cy - 20, cx + 55, cy + 85);
      hoodieGrad.addColorStop(0, "#2563eb");
      hoodieGrad.addColorStop(1, "#1e3a8a");
      ctx.fillStyle = hoodieGrad;
      ctx.beginPath();
      ctx.roundRect(cx - 56, cy - 12, 112, 92, [34, 34, 16, 16]);
      ctx.fill();

      // Waving or Typing Arms
      ctx.strokeStyle = "#1d4ed8";
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

      // Headphones Band
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(hx, hy - 2, 46, Math.PI, 0);
      ctx.stroke();

      // Headphone Cups
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(hx - 54, hy - 14, 14, 30, 6);
      ctx.roundRect(hx + 40, hy - 14, 14, 30, 6);
      ctx.fill();
      ctx.stroke();

      // Face
      ctx.fillStyle = "#e0a97f";
      ctx.beginPath();
      ctx.arc(hx, hy, 40, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      ctx.arc(hx, hy - 8, 41, Math.PI * 0.92, Math.PI * 2.08);
      ctx.fill();

      // Glasses & Eyes
      const ex = state.pointerX * 4;
      const ey = -state.pointerY * 3;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(hx - 14, hy - 2, 7, 0, Math.PI * 2);
      ctx.arc(hx + 14, hy - 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(hx - 14 + ex, hy - 2 + ey, 3.5, 0, Math.PI * 2);
      ctx.arc(hx + 14 + ex, hy - 2 + ey, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(hx - 26, hy - 11, 22, 16);
      ctx.strokeRect(hx + 4, hy - 11, 22, 16);
      ctx.beginPath();
      ctx.moveTo(hx - 4, hy - 3);
      ctx.lineTo(hx + 4, hy - 3);
      ctx.stroke();

      // Smile
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(hx, hy + 12, 9, 0.15 * Math.PI, 0.85 * Math.PI);
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
