/**
 * AR Cultural Heritage Guide — Client Application Logic
 * Technology: Vanilla JS, A-Frame, AR.js (Marker Tracking)
 * Scope: Frontend-only MVP for Heritage & Culture Hackathon
 */

// ============================================================================
// 1. HERITAGE DATABASE (Statue of Unity, Rani ki Vav, Modhera Sun Temple)
// ============================================================================
let HERITAGE_DATA = {};

// ============================================================================
// 2. STATE MANAGEMENT
// ============================================================================
let currentMonumentId = "statue_of_unity";
let isMarkerDetected = false;
let isOverlayPinned = false;
let isDemoMode = false;
let audioSpeaking = false;
let speechUtterance = null;
let lostTimeout = null;

// ============================================================================
// 3. DOM ELEMENTS
// ============================================================================
const homeView = document.getElementById("home-view");
const arView = document.getElementById("ar-view");
const monumentsGrid = document.getElementById("monuments-grid");
const arSceneContainer = document.getElementById("ar-scene-container");

// AR HUD Elements
const btnStartAr = document.getElementById("btn-start-ar");
const btnUploadAr = document.getElementById("btn-upload-ar");
const arImageUpload = document.getElementById("ar-image-upload");
const btnCloseAr = document.getElementById("btn-close-ar");
const arStatusBadge = document.getElementById("ar-status-badge");
const statusText = document.getElementById("status-text");
const btnToggleDemo = document.getElementById("btn-toggle-demo");
const demoModeLabel = document.getElementById("demo-mode-label");
const arMonumentPills = document.getElementById("ar-monument-pills");
const arReticle = document.getElementById("ar-reticle");
const arOverlayCard = document.getElementById("ar-overlay-card");

// Overlay Card Elements
const overlayBadgeText = document.getElementById("overlay-badge-text");
const overlayThumb = document.getElementById("overlay-thumb");
const overlayTitle = document.getElementById("overlay-title");
const overlayLocation = document.getElementById("overlay-location");
const overlayDesc = document.getElementById("overlay-desc");
const overlayFactText = document.getElementById("overlay-fact-text");
const btnExploreOverlay = document.getElementById("btn-explore-overlay");
const btnAudioGuide = document.getElementById("btn-audio-guide");
const audioBtnLabel = document.getElementById("audio-btn-label");
const btnPinOverlay = document.getElementById("btn-pin-overlay");
const btnLikeMonument = document.getElementById("btn-like-monument");
const likeCountText = document.getElementById("like-count");

// Modals
const heritageModal = document.getElementById("heritage-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const modalBannerImg = document.getElementById("modal-banner-img");
const modalTag = document.getElementById("modal-tag");
const modalYear = document.getElementById("modal-year");
const modalTitle = document.getElementById("modal-title");
const modalNative = document.getElementById("modal-native");
const modalLocation = document.getElementById("modal-location");
const modalHeight = document.getElementById("modal-height");
const modalArchitect = document.getElementById("modal-architect");
const modalCoords = document.getElementById("modal-coords");
const modalFullDesc = document.getElementById("modal-full-desc");
const modalHighlights = document.getElementById("modal-highlights");
const modalFactsList = document.getElementById("modal-facts-list");
const btnModalSpeech = document.getElementById("btn-modal-speech");
const modalSpeechLabel = document.getElementById("modal-speech-label");
const btnModalLaunchAr = document.getElementById("btn-modal-launch-ar");

// Marker Modal
const markerModal = document.getElementById("marker-modal");
const btnOpenMarkerNav = document.getElementById("btn-open-marker-modal-nav");
const btnShowMarkerHero = document.getElementById("btn-show-marker-hero");
const btnOpenMarkerFromAr = document.getElementById("btn-open-marker-from-ar");
const btnCloseMarkerModal = document.getElementById("btn-close-marker-modal");
const btnPrintMarker = document.getElementById("btn-print-marker");

// ============================================================================
// 4. INITIALIZATION & LANDING PAGE RENDERING
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch('/api/landmarks');
    const result = await res.json();
    if (result.success && result.data) {
      HERITAGE_DATA = result.data;
    }
  } catch (err) {
    console.error("Failed to load heritage data from backend API:", err);
  }

  const keys = Object.keys(HERITAGE_DATA);
  if (keys.length > 0) {
    currentMonumentId = keys[0];
  }

  renderLandmarksGrid();
  renderArMonumentPills();
  setupEventListeners();
  if (keys.length > 0) {
    updateOverlayCardData(currentMonumentId);
  }
});

/**
 * Render the 3 featured heritage cards on the landing page
 */
function renderLandmarksGrid() {
  monumentsGrid.innerHTML = "";

  Object.values(HERITAGE_DATA).forEach((item) => {
    const card = document.createElement("article");
    card.className = "landmark-card";
    card.innerHTML = `
      <div class="card-media-wrapper">
        <img src="${item.image}" alt="${item.name}" class="card-img" loading="lazy">
        <div class="card-media-overlay"></div>
        <span class="card-badge" style="color: ${item.theme3D.color}">${item.badge}</span>
      </div>
      <div class="card-body">
        <div class="card-location-row">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${item.location}</span>
        </div>
        <h3 class="card-title">${item.name}</h3>
        <p class="card-native">${item.nativeName}</p>
        <p class="card-snippet">${item.shortDesc}</p>
        
        <div class="card-stats-row">
          <div class="card-stat">
            <span class="stat-label">Timeline</span>
            <span class="stat-val">${item.builtYear}</span>
          </div>
          <div class="card-stat">
            <span class="stat-label">Category</span>
            <span class="stat-val">${item.category}</span>
          </div>
        </div>

        <div class="card-actions-row">
          <button class="btn-card-ar" data-action="ar" data-id="${item.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>Scan in AR</span>
          </button>
          <button class="btn-card-details" data-action="details" data-id="${item.id}">
            <span>Details</span>
          </button>
        </div>
      </div>
    `;
    monumentsGrid.appendChild(card);
  });
}

/**
 * Render the top monument switcher pills in the AR HUD
 */
function renderArMonumentPills() {
  arMonumentPills.innerHTML = "";
  Object.values(HERITAGE_DATA).forEach((item) => {
    const pill = document.createElement("button");
    pill.className = `ar-pill-btn ${item.id === currentMonumentId ? "active" : ""}`;
    pill.dataset.id = item.id;
    pill.textContent = item.name;
    pill.addEventListener("click", () => {
      selectMonument(item.id);
    });
    arMonumentPills.appendChild(pill);
  });
}

/**
 * Switch the currently selected monument and refresh 3D/overlay
 */
function selectMonument(id) {
  if (!HERITAGE_DATA[id]) return;
  currentMonumentId = id;

  // Update pills UI
  const pills = arMonumentPills.querySelectorAll(".ar-pill-btn");
  pills.forEach((p) => {
    p.classList.toggle("active", p.dataset.id === id);
  });

  // Update AR overlay card data
  updateOverlayCardData(id);

  // Update 3D A-Frame entity if scene is alive
  update3DSceneEntity(id);

  // If marker is detected or in demo mode, update the status badge text
  if (isMarkerDetected || isDemoMode) {
    statusText.textContent = `✓ Active Landmark: ${HERITAGE_DATA[id].name}`;
  }
}

/**
 * Update the DOM contents of the AR HUD Overlay Card
 */
function updateOverlayCardData(id) {
  const data = HERITAGE_DATA[id];
  if (!data) return;

  overlayBadgeText.textContent = data.badge;
  overlayThumb.src = data.image;
  overlayThumb.alt = data.name;
  overlayTitle.textContent = data.name;
  overlayLocation.querySelector("span").textContent = data.location;
  overlayDesc.textContent = data.shortDesc;
  overlayFactText.textContent = data.culturalFacts[0];
  
  if (likeCountText) {
    likeCountText.textContent = data.likes || 0;
  }
}

// ============================================================================
// 5. AR CAMERA EXPERIENCE LIFECYCLE (A-Frame + AR.js)
// ============================================================================

/**
 * Start the AR Experience:
 * Mounts A-Frame scene, asks for webcam permissions, binds marker events
 */
function startArExperience(sourceUrl = null) {
  homeView.classList.remove("active");
  homeView.classList.add("hidden");

  arView.classList.remove("hidden");
  arView.classList.add("active");

  // Reset status
  isMarkerDetected = false;
  arStatusBadge.classList.remove("detected");
  statusText.textContent = "Scanning for Hiro Marker...";
  arReticle.classList.remove("faded");

  if (!isOverlayPinned && !isDemoMode) {
    arOverlayCard.classList.add("hidden");
  }

  // Inject A-Frame AR Scene into DOM
  mountArScene(sourceUrl);
}

/**
 * Mounts the A-Frame AR Scene dynamically
 */
function mountArScene(sourceUrl = null) {
  // Clear any existing scene
  arSceneContainer.innerHTML = "";

  const arjsConfig = sourceUrl 
    ? `sourceType: image; sourceUrl: ${sourceUrl}; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; trackingMethod: best;`
    : `sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; trackingMethod: best;`;

  const sceneHtml = `
    <a-scene embedded
             arjs="${arjsConfig}"
             vr-mode-ui="enabled: false"
             renderer="logarithmicDepthBuffer: true; antialias: true; alpha: true;">
      
      <!-- Lighting -->
      <a-light type="ambient" color="#FFFFFF" intensity="0.8"></a-light>
      <a-light type="directional" color="#FFF8DC" position="1 2 1" intensity="1.2"></a-light>

      <!-- Hiro Target Marker -->
      <a-marker preset="hiro" id="hiro-marker" emitevents="true">
        <!-- Dynamic 3D Root Entity -->
        <a-entity id="ar-3d-root"></a-entity>
      </a-marker>

      <!-- Main Camera -->
      <a-entity camera></a-entity>
    </a-scene>
  `;

  arSceneContainer.innerHTML = sceneHtml;

  // Wait for A-Frame to fully initialize before binding events
  const sceneEl = arSceneContainer.querySelector('a-scene');
  if (sceneEl.hasLoaded) {
    bindMarkerEvents();
    update3DSceneEntity(currentMonumentId);
  } else {
    sceneEl.addEventListener('loaded', () => {
      bindMarkerEvents();
      update3DSceneEntity(currentMonumentId);
    });
  }
}

/**
 * Bind AR.js marker events (markerFound and markerLost)
 */
function bindMarkerEvents() {
  const marker = document.getElementById("hiro-marker");
  if (!marker) return;

  marker.addEventListener("markerFound", () => {
    if (lostTimeout) {
      clearTimeout(lostTimeout);
      lostTimeout = null;
    }
    handleMarkerState(true);
  });

  marker.addEventListener("markerLost", () => {
    // Grace period before hiding overlay to prevent jarring flicker
    lostTimeout = setTimeout(() => {
      handleMarkerState(false);
    }, 1200);
  });
}

/**
 * Handle Marker State Change (Detected vs Lost)
 */
function handleMarkerState(detected) {
  isMarkerDetected = detected;

  if (detected || isDemoMode) {
    arStatusBadge.classList.add("detected");
    statusText.textContent = `✓ Landmark Detected: ${HERITAGE_DATA[currentMonumentId].name}`;
    arReticle.classList.add("faded");
    arOverlayCard.classList.remove("hidden");

    // Increment Scan Count via API
    if (!isDemoMode && detected) {
      fetch(`/api/landmarks/${currentMonumentId}/scan`, { method: 'POST' }).catch(console.error);
    }

    // Play subtle synthesized audio chime
    playSuccessChime();
  } else {
    arStatusBadge.classList.remove("detected");
    statusText.textContent = "Scanning for Hiro Marker...";
    arReticle.classList.remove("faded");

    // Only hide overlay if user hasn't explicitly pinned it
    if (!isOverlayPinned) {
      arOverlayCard.classList.add("hidden");
    }
  }
}

/**
 * Exit AR Mode:
 * Stops webcam stream tracks, frees hardware, removes A-Frame scene, returns home
 */
function exitArExperience() {
  // Stop text-to-speech if talking
  stopSpeechNarration();

  // Stop camera tracks cleanly
  const videos = document.querySelectorAll("video");
  videos.forEach((video) => {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
    video.remove();
  });
  
  // AR.js and A-Frame leave global state and WebGL contexts that break on re-initialization.
  // The most reliable way to reset it for the next run is a clean page reload.
  window.location.reload();
}

// ============================================================================
// 6. DYNAMIC 3D ENTITY BUILDER (A-Frame Custom Holographic Monuments)
// ============================================================================
function update3DSceneEntity(monumentId) {
  const root = document.getElementById("ar-3d-root");
  if (!root) return;

  const data = HERITAGE_DATA[monumentId];
  if (!data) return;

  // Clear previous 3D geometry
  root.innerHTML = "";

  let modelGeometryHtml = "";

  if (monumentId === "statue_of_unity") {
    // 3D Colossal Monument Representation: Ornate Base, Rotating Ashoka Rings & Bronze Spire
    modelGeometryHtml = `
      <!-- Base Lotus Pedestal -->
      <a-cylinder position="0 0.1 0" radius="0.85" height="0.15" 
                  material="color: #4A3525; metalness: 0.6; roughness: 0.4;">
      </a-cylinder>
      <a-cylinder position="0 0.25 0" radius="0.7" height="0.15" 
                  material="color: #D4AF37; metalness: 0.8; roughness: 0.2; emissive: #D4AF37; emissiveIntensity: 0.25;">
      </a-cylinder>

      <!-- Monument Core Structure -->
      <a-box position="0 0.9 0" width="0.35" height="1.2" depth="0.3"
             material="color: #C68B59; metalness: 0.7; roughness: 0.3;">
      </a-box>
      <a-box position="0 1.6 0" width="0.25" height="0.35" depth="0.25"
             material="color: #B27B49; metalness: 0.7; roughness: 0.3;">
      </a-box>

      <!-- Floating Rotating Unity Chakra Ring -->
      <a-torus position="0 1.2 0" radius="0.9" radius-tubular="0.015"
               material="color: #FFB703; emissive: #FF9E00; emissiveIntensity: 0.6;"
               animation="property: rotation; to: 360 360 0; loop: true; dur: 9000; easing: linear;">
      </a-torus>

      <!-- 3D Holographic Monument Billboard -->
      <a-entity position="0 2.2 0" 
                animation="property: position; to: 0 2.3 0; dir: alternate; loop: true; dur: 2200; easing: easeInOutSine;">
        <a-plane position="0 0 0" width="2.4" height="0.75" 
                 material="color: #0E1624; opacity: 0.92; transparent: true; side: double;">
        </a-plane>
        <a-text value="STATUE OF UNITY" align="center" position="0 0.15 0.05" width="4.5" color="#FFD166" font="mozillavr"></a-text>
        <a-text value="182m • World's Tallest • Gujarat" align="center" position="0 -0.15 0.05" width="3.2" color="#E2E8F0"></a-text>
      </a-entity>
    `;
  } else if (monumentId === "rani_ki_vav") {
    // 3D Subterranean Stepwell Representation: Descending Terraces & Sacred Water
    modelGeometryHtml = `
      <!-- Ground Level Border -->
      <a-box position="0 0.05 0" width="1.8" height="0.1" depth="1.8"
             material="color: #B45309; roughness: 0.8;">
      </a-box>
      <!-- Subterranean Step Tier 1 -->
      <a-box position="0 0.2 0" width="1.5" height="0.2" depth="1.5"
             material="color: #D97706; roughness: 0.7;">
      </a-box>
      <!-- Subterranean Step Tier 2 -->
      <a-box position="0 0.4 0" width="1.1" height="0.2" depth="1.1"
             material="color: #F59E0B; roughness: 0.6;">
      </a-box>
      <!-- Sacred Central Water Pool Geometry -->
      <a-plane position="0 0.52 0" rotation="-90 0 0" width="0.8" height="0.8"
               material="color: #06B6D4; opacity: 0.85; metalness: 0.9; roughness: 0.1; emissive: #0891B2; emissiveIntensity: 0.4;">
      </a-plane>
      
      <!-- 4 Miniature Stepped Corner Pavilions -->
      <a-cylinder position="0.5 0.7 0.5" radius="0.06" height="0.4" material="color: #FDE68A;"></a-cylinder>
      <a-cylinder position="-0.5 0.7 0.5" radius="0.06" height="0.4" material="color: #FDE68A;"></a-cylinder>
      <a-cylinder position="0.5 0.7 -0.5" radius="0.06" height="0.4" material="color: #FDE68A;"></a-cylinder>
      <a-cylinder position="-0.5 0.7 -0.5" radius="0.06" height="0.4" material="color: #FDE68A;"></a-cylinder>

      <!-- Floating Rotating Water Apsara Ring -->
      <a-torus position="0 0.9 0" radius="1.0" radius-tubular="0.015"
               material="color: #38BDF8; emissive: #0EA5E9; emissiveIntensity: 0.7;"
               animation="property: rotation; to: 0 360 0; loop: true; dur: 8000; easing: linear;">
      </a-torus>

      <!-- 3D Holographic Billboard -->
      <a-entity position="0 1.9 0" 
                animation="property: position; to: 0 2.0 0; dir: alternate; loop: true; dur: 2000; easing: easeInOutSine;">
        <a-plane position="0 0 0" width="2.4" height="0.75" 
                 material="color: #0E1624; opacity: 0.92; transparent: true; side: double;">
        </a-plane>
        <a-text value="RANI KI VAV" align="center" position="0 0.15 0.05" width="4.5" color="#38BDF8" font="mozillavr"></a-text>
        <a-text value="UNESCO World Heritage • 1063 CE" align="center" position="0 -0.15 0.05" width="3.2" color="#E2E8F0"></a-text>
      </a-entity>
    `;
  } else {
    // Modhera Sun Temple: Radiant Golden Solar Disc, Colonnade & Surya Kund
    modelGeometryHtml = `
      <!-- Base Temple Plinth -->
      <a-cylinder position="0 0.1 0" radius="0.9" height="0.15" 
                  material="color: #78350F; roughness: 0.7;">
      </a-cylinder>
      <!-- Sabhamandapa Pillars Ring -->
      <a-cylinder position="0.45 0.45 0" radius="0.05" height="0.55" material="color: #F59E0B;"></a-cylinder>
      <a-cylinder position="-0.45 0.45 0" radius="0.05" height="0.55" material="color: #F59E0B;"></a-cylinder>
      <a-cylinder position="0 0.45 0.45" radius="0.05" height="0.55" material="color: #F59E0B;"></a-cylinder>
      <a-cylinder position="0 0.45 -0.45" radius="0.05" height="0.55" material="color: #F59E0B;"></a-cylinder>
      <a-cylinder position="0.32 0.45 0.32" radius="0.05" height="0.55" material="color: #F59E0B;"></a-cylinder>
      <a-cylinder position="-0.32 0.45 -0.32" radius="0.05" height="0.55" material="color: #F59E0B;"></a-cylinder>

      <!-- Radiant Central Sun Disk -->
      <a-sphere position="0 0.95 0" radius="0.3"
                material="color: #FDE047; emissive: #EAB308; emissiveIntensity: 0.9;"
                animation="property: scale; to: 1.15 1.15 1.15; dir: alternate; loop: true; dur: 1600; easing: easeInOutQuad;">
      </a-sphere>

      <!-- Solar Corona Rays (Rotating Torus) -->
      <a-torus position="0 0.95 0" radius="0.55" radius-tubular="0.02"
               material="color: #F97316; emissive: #EA580C; emissiveIntensity: 0.8;"
               animation="property: rotation; to: 360 0 360; loop: true; dur: 10000; easing: linear;">
      </a-torus>

      <!-- 3D Holographic Billboard -->
      <a-entity position="0 1.95 0" 
                animation="property: position; to: 0 2.05 0; dir: alternate; loop: true; dur: 2100; easing: easeInOutSine;">
        <a-plane position="0 0 0" width="2.6" height="0.75" 
                 material="color: #0E1624; opacity: 0.92; transparent: true; side: double;">
        </a-plane>
        <a-text value="MODHERA SUN TEMPLE" align="center" position="0 0.15 0.05" width="4.5" color="#FBBF24" font="mozillavr"></a-text>
        <a-text value="Equinox Alignment • Surya Kund • 1026 CE" align="center" position="0 -0.15 0.05" width="3.0" color="#E2E8F0"></a-text>
      </a-entity>
    `;
  }

  root.innerHTML = modelGeometryHtml;
}

// ============================================================================
// 7. DEMO / SIMULATION MODE (Crucial for Hackathon Judges without webcams)
// ============================================================================
function toggleDemoMode() {
  isDemoMode = !isDemoMode;

  if (isDemoMode) {
    btnToggleDemo.classList.add("active");
    demoModeLabel.textContent = "Demo Mode: Active";
    handleMarkerState(true);
  } else {
    btnToggleDemo.classList.remove("active");
    demoModeLabel.textContent = "Demo Simulation";
    handleMarkerState(isMarkerDetected);
  }
}

// ============================================================================
// 8. DEEP HERITAGE MODAL (EXPLORE INTERACTION)
// ============================================================================
function openHeritageModal(monumentId) {
  const data = HERITAGE_DATA[monumentId || currentMonumentId];
  if (!data) return;

  modalBannerImg.src = data.image;
  modalBannerImg.alt = data.name;
  modalTag.textContent = data.category;
  modalYear.textContent = data.builtYear;
  modalTitle.textContent = data.name;
  modalNative.textContent = data.nativeName;

  modalLocation.textContent = data.location;
  modalHeight.textContent = data.height;
  modalArchitect.textContent = data.architect;
  modalCoords.textContent = data.coordinates;

  modalFullDesc.textContent = data.fullDesc;

  // Render highlights
  modalHighlights.innerHTML = "";
  data.highlights.forEach((hl) => {
    const box = document.createElement("div");
    box.className = "highlight-box";
    box.innerHTML = `
      <div class="hl-val">${hl.value}</div>
      <div class="hl-label">${hl.label}</div>
      <div class="hl-detail">${hl.detail}</div>
    `;
    modalHighlights.appendChild(box);
  });

  // Render facts
  modalFactsList.innerHTML = "";
  data.culturalFacts.forEach((fact) => {
    const li = document.createElement("li");
    li.textContent = fact;
    modalFactsList.appendChild(li);
  });

  // Reset speech button label
  modalSpeechLabel.textContent = "Play Narration";

  // Open modern HTML5 dialog
  if (typeof heritageModal.showModal === "function") {
    heritageModal.showModal();
  } else {
    heritageModal.setAttribute("open", "true");
  }
}

function closeHeritageModal() {
  stopSpeechNarration();
  if (typeof heritageModal.close === "function") {
    heritageModal.close();
  } else {
    heritageModal.removeAttribute("open");
  }
}

// ============================================================================
// 9. WEB SPEECH API (SPOKEN AUDIO GUIDE CHRONICLE)
// ============================================================================
function toggleAudioNarration() {
  if (audioSpeaking) {
    stopSpeechNarration();
  } else {
    startSpeechNarration(currentMonumentId);
  }
}

function startSpeechNarration(monumentId) {
  if (!("speechSynthesis" in window)) {
    alert("Web Speech API is not supported in this browser. Please read the historical guide on screen.");
    return;
  }

  stopSpeechNarration();

  const data = HERITAGE_DATA[monumentId];
  if (!data) return;

  speechUtterance = new SpeechSynthesisUtterance(data.audioScript);
  speechUtterance.rate = 0.95;
  speechUtterance.pitch = 1.0;

  // Prefer Indian English voice if present in system voices
  const voices = window.speechSynthesis.getVoices();
  const enInVoice = voices.find((v) => v.lang.includes("en-IN") || v.name.includes("India"));
  if (enInVoice) {
    speechUtterance.voice = enInVoice;
  }

  speechUtterance.onstart = () => {
    audioSpeaking = true;
    btnAudioGuide.classList.add("playing");
    audioBtnLabel.textContent = "Stop";
    modalSpeechLabel.textContent = "Stop Narration";
  };

  speechUtterance.onend = () => {
    audioSpeaking = false;
    btnAudioGuide.classList.remove("playing");
    audioBtnLabel.textContent = "Listen";
    modalSpeechLabel.textContent = "Play Narration";
  };

  speechUtterance.onerror = () => {
    audioSpeaking = false;
    btnAudioGuide.classList.remove("playing");
    audioBtnLabel.textContent = "Listen";
    modalSpeechLabel.textContent = "Play Narration";
  };

  window.speechSynthesis.speak(speechUtterance);
}

function stopSpeechNarration() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  audioSpeaking = false;
  btnAudioGuide.classList.remove("playing");
  audioBtnLabel.textContent = "Listen";
  modalSpeechLabel.textContent = "Play Narration";
}

// ============================================================================
// 10. SYNTHESIZED WEB AUDIO CHIME (Zero-dependency audio cue)
// ============================================================================
function playSuccessChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Sacred Bell Tone (528 Hz - Solfeggio frequency)
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1056, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    // Audio context may be restricted by autoplay policy; silent fail
  }
}

// ============================================================================
// 11. EVENT LISTENERS SETUP
// ============================================================================
function setupEventListeners() {
  // Start AR Experience from Hero CTA
  btnStartAr.addEventListener("click", () => {
    startArExperience();
  });

  // Image Upload instead of Webcam
  btnUploadAr.addEventListener("click", () => {
    arImageUpload.click();
  });

  arImageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      startArExperience(blobUrl);
      e.target.value = ""; // reset
    }
  });

  // Exit AR View
  btnCloseAr.addEventListener("click", () => {
    exitArExperience();
  });

  // Demo Simulation Mode Toggle
  btnToggleDemo.addEventListener("click", () => {
    toggleDemoMode();
  });

  // Pin Overlay Card Toggle
  btnPinOverlay.addEventListener("click", () => {
    isOverlayPinned = !isOverlayPinned;
    btnPinOverlay.classList.toggle("pinned", isOverlayPinned);
  });

  // Explore Button from AR Overlay
  btnExploreOverlay.addEventListener("click", () => {
    openHeritageModal(currentMonumentId);
  });

  // Audio Guide from AR Overlay
  btnAudioGuide.addEventListener("click", () => {
    toggleAudioNarration();
  });

  if (btnLikeMonument) {
    btnLikeMonument.addEventListener("click", async () => {
      try {
        const res = await fetch(`/api/landmarks/${currentMonumentId}/like`, { method: 'POST' });
        const data = await res.json();
        if (data.success && likeCountText) {
          likeCountText.textContent = data.likes;
          // Also update local cache so it persists when switching
          if (HERITAGE_DATA[currentMonumentId]) {
            HERITAGE_DATA[currentMonumentId].likes = data.likes;
          }
        }
      } catch (e) {
        console.error("Failed to like", e);
      }
    });
  }

  // Audio Guide from Details Modal
  btnModalSpeech.addEventListener("click", () => {
    toggleAudioNarration();
  });

  // Launch AR directly from inside Details Modal
  btnModalLaunchAr.addEventListener("click", () => {
    closeHeritageModal();
    startArExperience();
  });

  // Close Details Modal
  btnCloseModal.addEventListener("click", () => {
    closeHeritageModal();
  });

  // Monument Cards Click Delegation (on Home View)
  monumentsGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const monumentId = btn.dataset.id;

    if (action === "ar") {
      selectMonument(monumentId);
      startArExperience();
    } else if (action === "details") {
      selectMonument(monumentId);
      openHeritageModal(monumentId);
    }
  });

  // Marker Modal Triggers
  btnOpenMarkerNav.addEventListener("click", openMarkerModal);
  btnShowMarkerHero.addEventListener("click", openMarkerModal);
  btnOpenMarkerFromAr.addEventListener("click", openMarkerModal);
  btnCloseMarkerModal.addEventListener("click", closeMarkerModal);

  // Print Marker
  btnPrintMarker.addEventListener("click", () => {
    window.open("assets/hiro-marker.png", "_blank");
  });

  // Close dialogs when backdrop is clicked
  [heritageModal, markerModal].forEach((dialog) => {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        if (dialog === heritageModal) closeHeritageModal();
        if (dialog === markerModal) closeMarkerModal();
      }
    });
  });
}

function openMarkerModal() {
  if (typeof markerModal.showModal === "function") {
    markerModal.showModal();
  } else {
    markerModal.setAttribute("open", "true");
  }
}

function closeMarkerModal() {
  if (typeof markerModal.close === "function") {
    markerModal.close();
  } else {
    markerModal.removeAttribute("open");
  }
}
