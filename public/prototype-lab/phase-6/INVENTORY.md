# NEXUS PHASE 6 — COMPONENT & INTERACTION INVENTORY

## 1. Component Directory

### A. Shared Global Primitives
| Component | Class / Selector | Visual Token State | Key Interactions |
| :--- | :--- | :--- | :--- |
| **Prototype Orchestrator Rail** | `.orchestrator-rail` | Graphite `#11151A`, Cobalt trim | Fixed top bar; switches between Gateway & Atlas, Day/Night mode, Fullscreen presentation. |
| **Experience Switcher Tabs** | `.orchestrator-tab-btn` | Transparent → Active Cobalt `#2856C7` | Instant view toggling with fade/translate reveal. |
| **Day / Night Theme Switch** | `#themeToggleText` | Ivory `#F4F2EC` ↔ Graphite `#171C23` | Inverts all CSS custom tokens; switches Three.js lighting & ambient scene color. |
| **Semantic Status Badge** | `.tag-badge` | Subtle tints (Cobalt, Terracotta, Emerald, Amber) | Micro-indicator for operational states and labels. |
| **Primary Action Button** | `.btn-primary` | Cobalt `#2856C7`, White text, 8px radius | Scale `-1px` on hover, shadow expansion. |
| **Secondary Action Button** | `.btn-secondary` | Surface background, stone border | Hover border-darken, background tint. |

### B. Experience A — NEXUS Public Gateway
| Component | Element / ID | Architecture | Key Interactions |
| :--- | :--- | :--- | :--- |
| **Architectural Hero Header** | `.gateway-hero` | Gradient canvas + 40px CAD grid plane | Responsive typography, live telemetry counters, direct CTA to 3D Atlas. |
| **Campus Footprint Strip** | `.hero-container > div:last-child` | 4-column telemetry grid | Shows campus extent (14.5 Acres), modules (7), routes (14), status (Nominal). |
| **Spatial Discovery Teaser** | `.surface-card` | 3 interactive facility cards | Direct jump into 3D Atlas with automated building pre-selection. |
| **Service Bento Grid** | `.service-bento-grid` | 12-column asymmetric grid | Distinct visual cards for EduHub (span 8), Library (span 4), Canteen, Print Hub, and Transit. |
| **Institutional Governance** | `footer` | Editorial 3-column layout | Accreditation disclosures, VTU syllabus compliance, security credentials. |

### C. Experience B — NEXUS Campus Atlas (3D)
| Component | Element / ID | Architecture | Key Interactions |
| :--- | :--- | :--- | :--- |
| **WebGL 3D Campus Canvas** | `#atlas-viewport` | Three.js WebGLRenderer + PCF Shadows | Real procedural 3D buildings, landscaped quad, roads, trees, and shadow casting. |
| **Top Layer Filter Bar** | `.atlas-layer-bar` | Pill group with active states | Toggles visibility of buildings: *All*, *Academic*, *Auxiliary*, *Transit*. |
| **Building Raycast Collider** | `bldg-*` Mesh Groups | Group bounding volumes | Raycast on hover: smooth float `y = sin(t)*0.3`; raycast on click: smooth camera fly-to. |
| **Contextual Building Inspector**| `#atlasInspector` | 380px fixed side drawer | Slides from right with building code, occupancy, departments, services, and route trigger. |
| **Pedestrian Routing Console** | `.atlas-route-card` | Bottom-left floating glass card | Select "From" and "To" to render an animated 3D tube path along sidewalks; shows distance & time. |
| **Camera Quick Controls** | `.atlas-camera-controls` | Vertical button cluster | Rotate Left/Right (15°), Zoom In/Out, Reset to default axonometric framing. |

---

## 2. Interactive State Matrix

| Element | Default State | Hover State | Selected / Active State | Transition Spec |
| :--- | :--- | :--- | :--- | :--- |
| **3D Building Model** | Flat isometric shading | Vertical sine float `0.3`, pointer cursor | Camera lerp `600ms`, drawer opens, waypoint focused | Cubic-bezier `(0.16, 1, 0.3, 1)` |
| **Layer Filter Button**| Muted caption text | Background stone tint | Solid Cobalt `#2856C7`, White text | `150ms ease` |
| **Route Calculator** | Hidden stats box | Hover on "Find Route" | 3D tube rendered in scene, stats box expands | Instant geometry generation |
| **Inspector Drawer** | Offscreen (`closed`) | — | `translateX(0)`, width `380px` (`100%` on mobile) | `300ms cubic-bezier(0.16, 1, 0.3, 1)` |
| **Bento Service Card** | `border-stone`, flat | `border-cobalt`, `translateY(-2px)`, shadow-md | Click opens module link | `200ms ease` |

---

## 3. Responsive Breakpoints

| Viewport | Width × Height | Layout Adjustments |
| :--- | :--- | :--- |
| **Desktop Flagship** | 1440 × 900 | Full 12-column bento grid; 380px inspector drawer; horizontal floating routing card. |
| **Laptop Standard** | 1280 × 720 | 12-column bento; 320px inspector drawer; compact toolbar padding; Orthographic scale adjusted. |
| **Mobile Handheld** | 390 × 844 | 1-column bento stack; vertical orchestrator rail; inspector becomes a 350px bottom drawer; route card stacks vertically. |

