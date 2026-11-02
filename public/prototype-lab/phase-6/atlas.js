/**
 * NEXUS Campus Atlas — 3D Spatial Intelligence Engine
 * Built using Three.js & OrbitControls for Phase 6 Prototype Lab
 * Explicit Disclosure: Conceptual Architectural Campus Topology
 */

class CampusAtlas {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.buildings = [];
        this.markers = [];
        this.selectedBuilding = null;
        this.hoveredBuilding = null;
        this.activeRoute = null;
        this.activeLayer = 'all';
        this.isNight = false;

        this.initThree();
        this.buildCampusEnvironment();
        this.setupEventListeners();
        this.animate();
    }

    initThree() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 600;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xEAE6DC);

        // Camera (Axonometric / Isometric Framing)
        const aspect = width / height;
        const d = 42;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.camera.position.set(60, 60, 60);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.1;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 200;
        this.controls.target.set(0, 0, 0);

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xfffaed, 0.9);
        this.sunLight.position.set(50, 80, 40);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 200;
        const shadowD = 60;
        this.sunLight.shadow.camera.left = -shadowD;
        this.sunLight.shadow.camera.right = shadowD;
        this.sunLight.shadow.camera.top = shadowD;
        this.sunLight.shadow.camera.bottom = -shadowD;
        this.scene.add(this.sunLight);

        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(-1000, -1000);
    }

    buildCampusEnvironment() {
        // Ground Plane (Main Campus Base)
        const groundGeo = new THREE.PlaneGeometry(160, 140);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0xE2DFD5 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Landscaped Green Quad (Central Lawn)
        const quadGeo = new THREE.PlaneGeometry(60, 45);
        const quadMat = new THREE.MeshLambertMaterial({ color: 0xCFDAC8 });
        const quad = new THREE.Mesh(quadGeo, quadMat);
        quad.rotation.x = -Math.PI / 2;
        quad.position.set(-5, 0.05, 5);
        quad.receiveShadow = true;
        this.scene.add(quad);

        // Roads & Pedestrian Paths
        this.createRoadways();

        // Architectural Buildings
        this.createBuildings();

        // Architectural Trees
        this.createTrees();
    }

    createRoadways() {
        const roadMat = new THREE.MeshBasicMaterial({ color: 0xC4C0B5 });

        // Main Campus Spine (East-West)
        const spineGeo = new THREE.PlaneGeometry(140, 7);
        const spine = new THREE.Mesh(spineGeo, roadMat);
        spine.rotation.x = -Math.PI / 2;
        spine.position.set(0, 0.08, -18);
        this.scene.add(spine);

        // Cross Road (North-South)
        const crossGeo = new THREE.PlaneGeometry(7, 100);
        const cross = new THREE.Mesh(crossGeo, roadMat);
        cross.rotation.x = -Math.PI / 2;
        cross.position.set(30, 0.08, 10);
        this.scene.add(cross);

        // Entrance Avenue
        const aveGeo = new THREE.PlaneGeometry(7, 45);
        const ave = new THREE.Mesh(aveGeo, roadMat);
        ave.rotation.x = -Math.PI / 2;
        ave.position.set(-40, 0.08, 30);
        this.scene.add(ave);
    }

    createBuildings() {
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xF4F2EC });
        const glassMat = new THREE.MeshLambertMaterial({ color: 0x9CB5E0 });
        const roofTrimMat = new THREE.MeshLambertMaterial({ color: 0x2856C7 });
        const auxiliaryRoofMat = new THREE.MeshLambertMaterial({ color: 0xB96943 });

        // ── 1. Sir M. Visvesvaraya Academic Block (Academic Core) ──
        const bldg1 = new THREE.Group();
        bldg1.userData = {
            id: 'bldg-1',
            name: 'Sir M. Visvesvaraya Block',
            code: 'MV-CORE-01',
            category: 'academic',
            categoryLabel: 'Academic Core',
            tagline: 'Flagship engineering complex housing Computer Science & LMS Core',
            floors: 'Ground + 4 Floors · 18 Smart Classrooms',
            occupancy: '92% Active Sessions',
            departments: ['Computer Science & Engg', 'Electronics & Comm', 'Information Science'],
            services: ['EduHub LMS Terminal', 'Internal Assessment Cell', 'Faculty Chambers'],
            waypoint: new THREE.Vector3(-15, 0, -5)
        };

        // Main Wing
        const b1Wing1 = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 14), wallMat);
        b1Wing1.position.set(0, 7, 0);
        b1Wing1.castShadow = true;
        b1Wing1.receiveShadow = true;
        bldg1.add(b1Wing1);

        // Glazed Central Atrium
        const b1Atrium = new THREE.Mesh(new THREE.BoxGeometry(10, 16, 16), glassMat);
        b1Atrium.position.set(12, 8, 0);
        b1Atrium.castShadow = true;
        bldg1.add(b1Atrium);

        // Blue Parapet Trim
        const b1Trim = new THREE.Mesh(new THREE.BoxGeometry(25, 0.8, 15), roofTrimMat);
        b1Trim.position.set(0, 14.4, 0);
        bldg1.add(b1Trim);

        bldg1.position.set(-15, 0, -5);
        this.registerBuilding(bldg1);

        // ── 2. Central Digital Library & OPAC Repository ──
        const bldg2 = new THREE.Group();
        bldg2.userData = {
            id: 'bldg-2',
            name: 'Central Knowledge Repository',
            code: 'LIB-REP-02',
            category: 'academic',
            categoryLabel: 'Academic Core',
            tagline: 'Multi-tiered digital library holding 12,000+ volumes & IEEE journals',
            floors: 'Level 1-3 · 140 Reading Seats',
            occupancy: '64 Seats Occupied',
            departments: ['Digital OPAC Catalog', 'E-Resources Cell', 'IEEE Reading Lounge'],
            services: ['Automated Lending Kiosk', 'Reference Research Pods', 'Return Dropdesk'],
            waypoint: new THREE.Vector3(20, 0, -5)
        };

        const b2Base = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 12, 24), wallMat);
        b2Base.position.set(0, 6, 0);
        b2Base.castShadow = true;
        b2Base.receiveShadow = true;
        bldg2.add(b2Base);

        const b2GlassBand = new THREE.Mesh(new THREE.CylinderGeometry(11.2, 11.2, 4, 24), glassMat);
        b2GlassBand.position.set(0, 8, 0);
        bldg2.add(b2GlassBand);

        const b2Roof = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.8, 24), roofTrimMat);
        b2Roof.position.set(0, 12.4, 0);
        bldg2.add(b2Roof);

        bldg2.position.set(20, 0, -5);
        this.registerBuilding(bldg2);

        // ── 3. Auxiliary Amenities Complex (Smart Canteen & Xerox Hub) ──
        const bldg3 = new THREE.Group();
        bldg3.userData = {
            id: 'bldg-3',
            name: 'Auxiliary Amenities Pavilion',
            code: 'AUX-COM-03',
            category: 'auxiliary',
            categoryLabel: 'Auxiliary Commerce',
            tagline: 'Automated campus dining, kitchen token stepper, and high-speed print hub',
            floors: 'Ground Pavilion · Outdoor Seating',
            occupancy: 'Token #142 Active · 3m Wait',
            departments: ['Campus Cafeteria', 'Xerox & Print Hub', 'Razorpay UPI Counter'],
            services: ['Live Kitchen Queue', 'Express Print Counter', 'Deep-Link UPI Checkout'],
            waypoint: new THREE.Vector3(-25, 0, 30)
        };

        const b3Main = new THREE.Mesh(new THREE.BoxGeometry(20, 7, 14), wallMat);
        b3Main.position.set(0, 3.5, 0);
        b3Main.castShadow = true;
        b3Main.receiveShadow = true;
        bldg3.add(b3Main);

        const b3Canopy = new THREE.Mesh(new THREE.BoxGeometry(22, 0.8, 16), auxiliaryRoofMat);
        b3Canopy.position.set(0, 7.4, 0);
        bldg3.add(b3Canopy);

        bldg3.position.set(-25, 0, 30);
        this.registerBuilding(bldg3);

        // ── 4. Fleet Logistics & Transit Depot ──
        const bldg4 = new THREE.Group();
        bldg4.userData = {
            id: 'bldg-4',
            name: 'Fleet Logistics Depot',
            code: 'FLT-LOG-04',
            category: 'transit',
            categoryLabel: 'Fleet Logistics',
            tagline: 'Institutional bus terminal servicing routes across Bengaluru suburban nodes',
            floors: 'Terminal Yard · 14 Bus Bays',
            occupancy: '14 Buses Dispatched',
            departments: ['Fleet Telemetry Cell', 'Driver Operations', 'Route Coordination'],
            services: ['Live GPS Radar Check', 'Boarding Gates 1-8', 'Driver Shift Desk'],
            waypoint: new THREE.Vector3(25, 0, 35)
        };

        const b4Canopy = new THREE.Mesh(new THREE.BoxGeometry(28, 1, 16), roofTrimMat);
        b4Canopy.position.set(0, 6, 0);
        b4Canopy.castShadow = true;
        bldg4.add(b4Canopy);

        // Columns
        const colGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
        const colMat = new THREE.MeshBasicMaterial({ color: 0x94A3B8 });
        [[-12, -6], [-12, 6], [12, -6], [12, 6], [0, -6], [0, 6]].forEach(([cx, cz]) => {
            const col = new THREE.Mesh(colGeo, colMat);
            col.position.set(cx, 3, cz);
            bldg4.add(col);
        });

        // Bus models (Stylized)
        const busMat = new THREE.MeshLambertMaterial({ color: 0x2856C7 });
        const bus1 = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 3), busMat);
        bus1.position.set(-6, 1.5, 0);
        bus1.castShadow = true;
        bldg4.add(bus1);

        const bus2 = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 3), busMat);
        bus2.position.set(6, 1.5, 0);
        bus2.castShadow = true;
        bldg4.add(bus2);

        bldg4.position.set(25, 0, 35);
        this.registerBuilding(bldg4);

        // ── 5. Innovation Labs & Computing Center ──
        const bldg5 = new THREE.Group();
        bldg5.userData = {
            id: 'bldg-5',
            name: 'Computing & AI Innovation Labs',
            code: 'LAB-INN-05',
            category: 'academic',
            categoryLabel: 'Academic Core',
            tagline: 'High-performance computing clusters, IoT sandbox, and AI innovation rooms',
            floors: 'Level 1-2 · 6 Advanced Laboratories',
            occupancy: 'Lab 3 Active · React Session',
            departments: ['HPC Laboratory', 'Cyber Security Center', 'Software Engineering Lab'],
            services: ['Lab Workstation Access', 'Server Cluster Status', 'Project Workspaces'],
            waypoint: new THREE.Vector3(-45, 0, -10)
        };

        const b5Main = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 16), wallMat);
        b5Main.position.set(0, 5, 0);
        b5Main.castShadow = true;
        b5Main.receiveShadow = true;
        bldg5.add(b5Main);

        const b5Trim = new THREE.Mesh(new THREE.BoxGeometry(19, 0.8, 17), roofTrimMat);
        b5Trim.position.set(0, 10.4, 0);
        bldg5.add(b5Trim);

        bldg5.position.set(-45, 0, -10);
        this.registerBuilding(bldg5);
    }

    registerBuilding(group) {
        this.scene.add(group);
        this.buildings.push(group);
    }

    createTrees() {
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8C7A6B });
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x6E8B68 });

        const treePositions = [
            [-8, 0, 18], [-3, 0, 22], [5, 0, 24], [12, 0, 20],
            [-30, 0, -15], [-24, 0, -15], [-18, 0, -15],
            [35, 0, 5], [35, 0, 15], [35, 0, 25],
            [-10, 0, -25], [10, 0, -25]
        ];

        treePositions.forEach(([x, y, z]) => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 6), trunkMat);
            trunk.position.set(x, 1.5, z);
            trunk.castShadow = true;
            this.scene.add(trunk);

            const foliage = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.5, 6), foliageMat);
            foliage.position.set(x, 4.8, z);
            foliage.castShadow = true;
            this.scene.add(foliage);
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.container.addEventListener('click', (e) => this.onClick(e));
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const aspect = width / height;
        const d = 42;

        this.camera.left = -d * aspect;
        this.camera.right = d * aspect;
        this.camera.top = d;
        this.camera.bottom = -d;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    onMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.buildings, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && !obj.userData?.id) {
                obj = obj.parent;
            }
            if (obj && obj.userData?.id) {
                this.container.style.cursor = 'pointer';
                this.hoveredBuilding = obj;
                return;
            }
        }
        this.container.style.cursor = 'default';
        this.hoveredBuilding = null;
    }

    onClick(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.buildings, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && !obj.userData?.id) {
                obj = obj.parent;
            }
            if (obj && obj.userData?.id) {
                this.selectBuilding(obj);
            }
        }
    }

    selectBuilding(group) {
        this.selectedBuilding = group;
        const data = group.userData;

        // Smooth camera fly-to animation
        const targetPos = group.position.clone();
        this.smoothCameraTo(targetPos);

        // Open Inspector Panel with Building Details
        if (window.onAtlasBuildingSelect) {
            window.onAtlasBuildingSelect(data);
        }
    }

    smoothCameraTo(targetPos) {
        const startTarget = this.controls.target.clone();
        const startTime = performance.now();
        const duration = 600;

        const animateCamera = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            this.controls.target.lerpVectors(startTarget, targetPos, ease);
            this.controls.update();

            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        };
        requestAnimationFrame(animateCamera);
    }

    resetCamera() {
        this.smoothCameraTo(new THREE.Vector3(0, 0, 0));
        this.camera.position.set(60, 60, 60);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    }

    rotateCamera(delta) {
        const angle = delta * (Math.PI / 180);
        const x = this.camera.position.x;
        const z = this.camera.position.z;
        this.camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
        this.camera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
        this.camera.lookAt(this.controls.target);
        this.controls.update();
    }

    zoomCamera(delta) {
        const factor = delta > 0 ? 0.85 : 1.15;
        this.camera.zoom = Math.max(0.5, Math.min(2.5, this.camera.zoom * factor));
        this.camera.updateProjectionMatrix();
    }

    toggleDayNight() {
        this.isNight = !this.isNight;
        if (this.isNight) {
            this.scene.background.setHex(0x12161C);
            this.ambientLight.intensity = 0.25;
            this.ambientLight.color.setHex(0x718BB8);
            this.sunLight.intensity = 0.4;
            this.sunLight.color.setHex(0x5677A8);
        } else {
            this.scene.background.setHex(0xEAE6DC);
            this.ambientLight.intensity = 0.7;
            this.ambientLight.color.setHex(0xFFFFFF);
            this.sunLight.intensity = 0.9;
            this.sunLight.color.setHex(0xFFFAED);
        }
    }

    setLayer(layer) {
        this.activeLayer = layer;
        this.buildings.forEach(b => {
            const cat = b.userData.category;
            if (layer === 'all' || cat === layer) {
                b.visible = true;
            } else {
                b.visible = false;
            }
        });
    }

    calculateAndDrawRoute(fromId, toId) {
        const fromBldg = this.buildings.find(b => b.userData.id === fromId);
        const toBldg = this.buildings.find(b => b.userData.id === toId);

        if (!fromBldg || !toBldg) return null;

        // Clear existing route
        if (this.activeRoute) {
            this.scene.remove(this.activeRoute);
            this.activeRoute = null;
        }

        // Construct 3D Pathway Geometry along roads
        const p1 = fromBldg.userData.waypoint;
        const p2 = toBldg.userData.waypoint;
        const midPoint = new THREE.Vector3(p2.x, 0.2, p1.z); // L-shaped realistic pedestrian turn

        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(p1.x, 0.3, p1.z),
            midPoint,
            new THREE.Vector3(p2.x, 0.3, p2.z)
        ]);

        const routeGeo = new THREE.TubeGeometry(curve, 32, 0.6, 8, false);
        const routeMat = new THREE.MeshBasicMaterial({ color: 0x2856C7 });
        this.activeRoute = new THREE.Mesh(routeGeo, routeMat);
        this.scene.add(this.activeRoute);

        // Distance & Walking Calculation based on geometry
        const length = Math.round(curve.getLength() * 3.5); // Scaled meters
        const minutes = (length / 80).toFixed(1);

        return {
            distance: `${length} meters`,
            walkTime: `${minutes} mins`,
            accessible: true
        };
    }

    clearRoute() {
        if (this.activeRoute) {
            this.scene.remove(this.activeRoute);
            this.activeRoute = null;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Building Hover Subtle Float
        if (this.hoveredBuilding && this.hoveredBuilding !== this.selectedBuilding) {
            this.hoveredBuilding.position.y = Math.sin(performance.now() * 0.005) * 0.3;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

