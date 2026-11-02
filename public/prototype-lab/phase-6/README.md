# NEXUS PHASE 6 — IMMERSIVE SPATIAL INTELLIGENCE
## Flagship Prototype Documentation: Public Gateway + Campus Atlas (3D)

**Prototype Directory:** `public/prototype-lab/phase-6/`  
**Browser Entry Point:** `http://localhost:5173/prototype-lab/phase-6/index.html`  
**Execution Environment:** Isolated Static WebGL & HTML Architecture (100% Offline Capable)  
**Strict Boundary:** **ZERO modifications to existing production routes, authentication, Firebase configuration, or backend logic.**

---

## 1. Quick Launch Instructions

1. Ensure the local Vite development server is running (`npm run dev`).
2. Open your web browser and navigate directly to:
   ```
   http://localhost:5173/prototype-lab/phase-6/index.html
   ```
3. Use the top orchestrator rail to switch seamlessly between:
   - **Experience A: Public Gateway** (Architectural public homepage)
   - **Experience B: Campus Atlas (3D)** (Interactive Three.js WebGL spatial campus environment)
4. Toggle between **☀️ Light Ivory** and **🌙 Dark Graphite** themes using the top theme button.
5. Launch **⛶ Fullscreen Presentation Mode** for the live exhibition showcase.

---

## 2. Deliverable Overview

### A. Experience A — NEXUS Public Gateway
- **Architectural Hero Section:** Full-width hero composition, Manrope typography, live telemetry status strip (`14.5 Acres Footprint`, `7 Modules`, `Nominal Status`).
- **Campus Discovery Teaser:** Interactive cards linking directly to 3D campus locations.
- **Purpose-Built Service Bento Grid:** Custom, non-identical visual layouts for each of the 7 services:
  - *Academic Core (EduHub LMS)*
  - *Digital Library & OPAC Repository*
  - *Smart Canteen Token Stepper*
  - *Print & Copy Hub*
  - *Fleet Transit Telemetry*
  - *Institutional Events*
  - *Grievance Redressal Desk*
- **Institutional Information & Footer:** Academic governance standards, VTU compliance disclosure, and security encryption notes.

### B. Experience B — NEXUS Campus Atlas (3D)
- **Real 3D Three.js WebGL Engine:** Built on Three.js r128 with custom PCF soft shadow maps, directional sunlight, and ambient fill.
- **Architectural 3D Building Models:**
  - *Sir M. Visvesvaraya Block (Academic Core / EduHub)*
  - *Central Knowledge Repository (Digital Library)*
  - *Auxiliary Amenities Pavilion (Canteen & Print Hub)*
  - *Fleet Logistics Depot & Transit Terminal*
  - *Computing & AI Innovation Labs*
- **Interactive 3D Interactions:**
  - **Raycast Hover & Selection:** Highlights hovered building with smooth vertical float; clicking triggers smooth camera fly-to animation.
  - **Contextual Building Inspector Drawer:** Slides open with building code, specifications, active occupancy, departments housed, and running digital services.
  - **3D Pedestrian Wayfinding & Routing:** Select "From" and "To" buildings to render an animated 3D tube pathway along campus sidewalks, calculating exact distance and walking time (`185 meters · 2.3 mins walk · Accessible`).
  - **Layer Filter Controls:** Toggle between *All Layers*, *Academic Core*, *Auxiliary Commerce*, and *Fleet Logistics*.
  - **Camera Controls:** Rotate Left/Right, Zoom In/Out, Reset View, Day/Night lighting shift, and Fullscreen toggle.
- **Honest Prototype Disclosure:** Explicitly labelled as *Conceptual Architectural Campus Topology*.

---

## 3. Technology Stack & Dependencies

- **Rendering Engine:** Three.js r128 (`vendor/three.min.js`) + `OrbitControls.js` (stored locally in `vendor/` for 100% offline reliability).
- **Typography:** Google Fonts (`Manrope`, `Inter`, `JetBrains Mono`).
- **Styling:** Vanilla CSS design tokens (`tokens.css`) using CSS custom properties with complete Light/Dark theme support.
- **Zero Heavy External Dependencies:** No Mapbox access token required; runs anywhere without external API keys or cloud service latency.

---

## 4. Verification Checklist

- [x] Isolated prototype folder created: `public/prototype-lab/phase-6/`
- [x] No modifications to production files, routes, or Firebase.
- [x] Tested across Desktop (1440×900), Laptop (1280×720), and Mobile (390×844) viewports.
- [x] Both Light Ivory and Dark Graphite themes verified.
- [x] 3D canvas interaction, raycasting, camera fly-to, and routing verified in browser.

