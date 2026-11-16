import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface EquipmentItem {
  id: string;
  name: string;
  tag: string;
  shortRole: string;
  badge: string;
  icon: string;
  inletTemp: string;
  outletTemp: string;
  gasVelocity: string;
  pressure: string;
  purpose: string;
  workingPrinciple: string;
  lechlerApplication: {
    title: string;
    nozzleSeries: string;
    sprayType: string;
    flowRate: string;
    operatingPressure: string;
    dropletSpectrum: string;
    description: string;
  };
  keySpecs: { label: string; value: string }[];
  cameraFocus: {
    pos: [number, number, number];
    target: [number, number, number];
  };
}

@Component({
  selector: 'app-cementindustry',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cementindustry.html',
  styleUrl: './cementindustry.scss',
  host: {
    ngSkipHydration: 'true',
  },
})
export class Cementindustry implements AfterViewInit, OnDestroy {
  @ViewChild('rendererCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewportContainer') containerRef!: ElementRef<HTMLDivElement>;

  // Simulation & UI State
  isPlaying = true;
  showWaterSpray = true;
  showThermalCutaways = true;
  simulationSpeed = 1.0;
  activeCameraPreset = 'overview';
  selectedEquipment: EquipmentItem | null = null;
  hoveredEquipment: EquipmentItem | null = null;
  tooltipPos = { x: 0, y: 0 };
  isInfoDrawerOpen = false;
  isLechlerGuideOpen = false;
  fps = 60;

  // Equipment Catalog (Matching Lechler Cement Industry Process Brochure)
  readonly equipmentList: EquipmentItem[] = [
    {
      id: 'gct-left',
      name: 'Gas Conditioning Tower (GCT)',
      tag: 'GCT-101',
      shortRole: 'Complete Evaporative Cooling',
      badge: '450°C → 180°C',
      icon: '❄️',
      inletTemp: '420 - 480 °C',
      outletTemp: '160 - 180 °C',
      gasVelocity: '4.5 - 6.0 m/s',
      pressure: '-14 mbar',
      purpose:
        'Rapid, 100% evaporative cooling of high-temperature flue gases before entering electrostatic precipitators (ESP) or baghouse fabric filters.',
      workingPrinciple:
        'Hot flue gases enter the top of the tower. High-pressure atomized water is injected through Lechler lances. Complete water droplet evaporation occurs within milliseconds before droplets can touch the vessel walls or fall to the hopper, ensuring a totally dry bottom.',
      lechlerApplication: {
        title: 'Evaporative Gas Cooling & Conditioning',
        nozzleSeries: 'Lechler Spillback (High-Pressure) & VarioJet®',
        sprayType: 'Hollow Cone & Twin-Fluid Flat/Full Cone',
        flowRate: '5 - 35 m³/h modulated',
        operatingPressure: 'Up to 35 bar (Spillback) / 120 bar',
        dropletSpectrum: 'D32 = 35 - 50 µm ultra-fine',
        description:
          'Lechler Spillback nozzles provide an exceptional 10:1 turndown ratio with constant droplet spectrum across all operating loads. By vaporizing water completely, gas volume contracts, electrical resistivity of dust is optimized for ESP collection, and baghouse filter media are protected from irreversible thermal degradation.',
      },
      keySpecs: [
        { label: 'Evaporation Time', value: '< 1.4 seconds' },
        { label: 'Bottom Condition', value: '100% Dry Dust (No Sludge)' },
        { label: 'Turndown Ratio', value: '10 : 1 dynamic modulation' },
        { label: 'ESP Protection', value: 'Dew point & resistivity optimized' },
      ],
      cameraFocus: {
        pos: [-14, 8, 14],
        target: [-14, 6.5, 0],
      },
    },
    {
      id: 'roller-mill',
      name: 'Vertical Roller Mill (VRM)',
      tag: 'VRM-102',
      shortRole: 'Raw Meal Grinding & Drying',
      badge: 'Grinding & Gas Drying',
      icon: '⚙️',
      inletTemp: '280 - 320 °C',
      outletTemp: '85 - 95 °C',
      gasVelocity: '18 - 25 m/s (Nozzle Ring)',
      pressure: '-35 mbar',
      purpose:
        'Simultaneous grinding, drying, and classifying of raw materials (limestone, clay, sand, iron ore) into fine raw meal powder.',
      workingPrinciple:
        'Material is fed onto a rotating grinding table where heavy hydraulic rollers crush the rock. Hot gas from the GCT or preheater sweeps the meal upward into a dynamic classifier while evaporating internal moisture.',
      lechlerApplication: {
        title: 'Mill Water Injection for Bed Stabilization',
        nozzleSeries: 'Lechler Flat Fan & Full Cone Nozzles',
        sprayType: 'Precision High-Pressure Surface Spray',
        flowRate: '1.2 - 4.5 m³/h',
        operatingPressure: '4.0 - 10 bar',
        dropletSpectrum: 'D32 = 80 - 120 µm',
        description:
          'Water spray is directed onto the grinding table bed to build up cohesive material compaction, prevent fluidization, reduce mill vibration, and control the mill outlet gas temperature.',
      },
      keySpecs: [
        { label: 'Product Fineness', value: '12% > 90 µm' },
        { label: 'Moisture Evaporation', value: 'Up to 8% water removal' },
        { label: 'Vibration Control', value: 'Active bed stabilization' },
        { label: 'Classifier Type', value: 'Dynamic high-efficiency rotor' },
      ],
      cameraFocus: {
        pos: [-16, 5, 8],
        target: [-16, 3.2, 2.5],
      },
    },
    {
      id: 'downcomer',
      name: 'Downcomer Duct Cooling Section',
      tag: 'DNC-201',
      shortRole: 'High-Velocity Gas Quench',
      badge: '380°C → 240°C',
      icon: '🔻',
      inletTemp: '380 - 420 °C',
      outletTemp: '220 - 250 °C',
      gasVelocity: '20 - 28 m/s',
      pressure: '-18 mbar',
      purpose:
        'Intermediate temperature quenching in high-velocity ductwork between preheater cyclones and downstream equipment.',
      workingPrinciple:
        'High-velocity flue gas traveling through the vertical downcomer duct is conditioned by high-pressure atomizing lances, rapidly shrinking gas volume and lowering fan power demand without requiring a separate vessel.',
      lechlerApplication: {
        title: 'In-Duct Gas Conditioning & Quenching',
        nozzleSeries: 'Lechler VarioJet® Lances with Guide Tubes',
        sprayType: 'Co-Current Fine Mist Cone',
        flowRate: '3.0 - 18.0 m³/h',
        operatingPressure: '2.5 - 6.0 bar',
        dropletSpectrum: 'D32 = 45 - 60 µm',
        description:
          'Lechler in-duct lances inject ultra-fine droplets co-current with gas flow. Precision nozzle orientation prevents droplet impingement on duct walls, ensuring complete evaporation and zero wet deposition inside the duct elbows.',
      },
      keySpecs: [
        { label: 'Duct Diameter', value: '2.4 - 3.8 m' },
        { label: 'Evaporation Distance', value: '6 - 12 m straight duct' },
        { label: 'Power Savings', value: 'Up to 15% ID fan electrical load' },
        { label: 'Nozzle Mounting', value: 'Retractable flanged lance ports' },
      ],
      cameraFocus: {
        pos: [-9, 8, 12],
        target: [-9, 7.5, -0.5],
      },
    },
    {
      id: 'preheater-tower',
      name: 'Cyclone Preheater Tower',
      tag: 'CYC-202',
      shortRole: '5-Stage Suspension Preheating',
      badge: '5-Stage Counter-Flow',
      icon: '🌪️',
      inletTemp: '900 °C (Bottom)',
      outletTemp: '340 °C (Top)',
      gasVelocity: '16 - 22 m/s',
      pressure: '-45 mbar',
      purpose:
        'Multi-stage counter-current heat exchange between ascending hot kiln flue gas and descending cold raw meal powder.',
      workingPrinciple:
        'Raw meal meal powder is suspended in the gas stream, heated within seconds, and separated in each cyclone stage before dropping to the next hotter level, reaching ~850°C and 40% pre-calcination before entering the rotary kiln.',
      lechlerApplication: {
        title: 'Chlorine Bypass & Downcomer Quenching',
        nozzleSeries: 'Lechler High-Pressure Solid Cone & Hollow Cone',
        sprayType: 'Instant Salt Solidification Quench',
        flowRate: '2.0 - 9.0 m³/h',
        operatingPressure: '15 - 30 bar',
        dropletSpectrum: 'D32 = 60 - 85 µm',
        description:
          'In plants co-firing alternative fuels, volatile salts (KCl, NaCl) vaporize. Lechler bypass quench nozzles rapidly cool the bypass gas slipstream, condensing volatile salts onto dust grains before they can cause severe cyclone refractory blockages.',
      },
      keySpecs: [
        { label: 'Preheater Stages', value: '5-Stage Staggered Cascade' },
        { label: 'Heat Recovery', value: '> 85% thermal efficiency' },
        { label: 'Meal Retention', value: '35 - 45 seconds total pass' },
        { label: 'Bypass Extraction', value: '5 - 15% kiln gas slipstream' },
      ],
      cameraFocus: {
        pos: [-3.5, 9, 14],
        target: [-3.5, 8.0, 0],
      },
    },
    {
      id: 'calciner',
      name: 'Calciner Riser & SNCR DeNOx',
      tag: 'CAL-203',
      shortRole: 'Limestone Decarbonation & DeNOx',
      badge: '880°C - 950°C',
      icon: '🔥',
      inletTemp: '1050 °C',
      outletTemp: '890 °C',
      gasVelocity: '12 - 16 m/s',
      pressure: '-22 mbar',
      purpose:
        'Complete endothermic calcination of limestone (CaCO3 → CaO + CO2) and thermal NOx abatement via selective non-catalytic reduction (SNCR).',
      workingPrinciple:
        'Preheated raw meal mixes with hot tertiary air and fuel inside the calciner riser duct. Temperatures are maintained at ~900°C for optimal calcination and ideal chemical kinetics for ammonia/urea SNCR reaction.',
      lechlerApplication: {
        title: 'SNCR DeNOx Ammonia / Urea Injection',
        nozzleSeries: 'Lechler VarioJet® Twin-Fluid Atomizers',
        sprayType: 'Flat Fan & Full Cone Reagent Dispersion',
        flowRate: '150 - 550 l/h per lance',
        operatingPressure: '2.5 - 5.0 bar fluid / 3.5 - 6.0 bar air',
        dropletSpectrum: 'D32 = 40 - 65 µm',
        description:
          'Aqueous ammonia (NH4OH) or urea is injected directly into the calciner within the strict 850°C–1050°C temperature window. Lechler twin-fluid atomizers deliver extremely fine, non-impinging droplets that react with NOx to form N2 and H2O with reduction efficiencies >85%.',
      },
      keySpecs: [
        { label: 'Temperature Window', value: '850°C - 1050°C' },
        { label: 'DeNOx Efficiency', value: 'Up to 88% NOx removal' },
        { label: 'Ammonia Slip', value: '< 5 ppm standard' },
        { label: 'Calcination Degree', value: '> 92% at kiln inlet' },
      ],
      cameraFocus: {
        pos: [-1.0, 7.5, 12],
        target: [-1.0, 6.0, 0],
      },
    },
    {
      id: 'rotary-kiln',
      name: 'Rotary Kiln Clinkering Zone',
      tag: 'KLN-301',
      shortRole: 'High-Temperature Clinker Sintering',
      badge: '1450°C Sintering',
      icon: '⚡',
      inletTemp: '950 °C (Inlet)',
      outletTemp: '1450 °C (Burning Zone)',
      gasVelocity: '8 - 12 m/s',
      pressure: '-2.5 mbar',
      purpose:
        'Complete liquid-phase sintering of calcined oxides into hydraulic cement minerals: Alite (C3S), Belite (C2S), Aluminate (C3A), and Ferrite (C4AF).',
      workingPrinciple:
        'The cylindrical kiln rotates at 3–5 RPM on an inclined slope of 3–4%. Material travels toward the discharge burner hood, reaching 1450°C where partial melting forms nodular clinker lumps.',
      lechlerApplication: {
        title: 'Kiln Shell External Water Cooling',
        nozzleSeries: 'Lechler Flat Fan & Low-Drift Spray Headers',
        sprayType: 'Controlled External Shell Cooling Array',
        flowRate: '5 - 15 m³/h emergency cooling',
        operatingPressure: '3.0 - 6.0 bar',
        dropletSpectrum: 'Coarse non-misting droplet sheet',
        description:
          'In the event of refractory tire loss or localized hot spots, Lechler external cooling spray headers spray targeted water sheets onto the rotating steel shell to freeze liquid clinker coating onto the inner refractory and prevent shell deformation.',
      },
      keySpecs: [
        { label: 'Rotation Speed', value: '3.5 - 5.0 RPM' },
        { label: 'Drive Piers', value: 'Dual concrete roller piers' },
        { label: 'Clinker Minerals', value: 'C3S, C2S, C3A, C4AF' },
        { label: 'Thermal Duty', value: '3000 - 3200 kJ/kg clinker' },
      ],
      cameraFocus: {
        pos: [5, 5, 14],
        target: [5, 3.5, 0],
      },
    },
    {
      id: 'clinker-cooler',
      name: 'Grate Clinker Cooler & Water Spray',
      tag: 'CLR-302',
      shortRole: 'Rapid Clinker Quenching',
      badge: '1400°C → 90°C',
      icon: '🧊',
      inletTemp: '1400 °C (Clinker)',
      outletTemp: '85 - 100 °C (Clinker)',
      gasVelocity: '6 - 10 m/s',
      pressure: '-1.5 mbar',
      purpose:
        'Rapid clinker quenching to freeze amorphous C3S mineral crystal structure, recover heat into tertiary air, and condition exhaust gas.',
      workingPrinciple:
        'Red-hot clinker drops onto reciprocating grates where powerful cooling air fans blow ambient air upward. High-temperature tertiary air is returned to the calciner, while excess cooler exhaust is cooled and dedusted.',
      lechlerApplication: {
        title: 'Clinker Cooler Exhaust Gas Cooling',
        nozzleSeries: 'Lechler VarioJet® & High-Pressure Water Lances',
        sprayType: 'Dual Downward Atomization Mist Cones',
        flowRate: '8 - 25 m³/h modulated',
        operatingPressure: '8 - 20 bar',
        dropletSpectrum: 'D32 = 50 - 75 µm',
        description:
          'Lechler water spray lances inject atomized mist directly into the clinker cooler exhaust hood. Rapid evaporation cools the exhaust gas from ~350°C down to 180°C, protecting the clinker cooler baghouse filter from thermal destruction and lowering fan power.',
      },
      keySpecs: [
        { label: 'Cooling Air Fans', value: '3-4 High-pressure undergrate blowers' },
        { label: 'Heat Recovery', value: 'Hot tertiary air return to calciner' },
        { label: 'Grate Type', value: 'Walking floor / reciprocating grate' },
        { label: 'Baghouse Protection', value: 'Gas cooled before filter entry' },
      ],
      cameraFocus: {
        pos: [11, 4.5, 10],
        target: [11, 2.5, 0],
      },
    },
    {
      id: 'baghouse-right',
      name: 'Clinker Cooler Baghouse Filter',
      tag: 'FLT-303',
      shortRole: 'High-Efficiency Dust Capture',
      badge: '< 5 mg/Nm³ Clean Air',
      icon: '🏭',
      inletTemp: '160 - 180 °C',
      outletTemp: '145 - 165 °C',
      gasVelocity: '0.9 - 1.2 m/min (A/C)',
      pressure: '-28 mbar',
      purpose:
        'Capture abrasive clinker dust from cooler exhaust gas to achieve guaranteed emission levels below 5 mg/Nm³.',
      workingPrinciple:
        'Gas passes through hundreds of cylindrical woven glass/PTFE membrane filter bags. Periodic high-pressure reverse pulse-jet compressed air cleaning dislodges accumulated dust into 4 pyramidal collection hoppers.',
      lechlerApplication: {
        title: 'Upstream Gas Conditioning for Filter Integrity',
        nozzleSeries: 'Integrated Temperature Protection Interlock',
        sprayType: 'Continuous Closed-Loop Temperature Control',
        flowRate: 'Safety Interlocked',
        operatingPressure: 'Modulated with upstream lances',
        dropletSpectrum: 'Vapor Phase Equilibrium',
        description:
          'The upstream Lechler spray system ensures the cooler exhaust gas entering the filter never spikes above 200°C (preventing catastrophic bag fabric burnout) while maintaining gas above the acid dew point to prevent moisture blinding.',
      },
      keySpecs: [
        { label: 'Hoppers', value: '4-Pyramid collection matrix' },
        { label: 'Emissions', value: '< 5 mg/Nm³ particulate' },
        { label: 'Cleaning', value: 'Pulse-jet compressed air' },
        { label: 'Fabric Life', value: '3 - 5 years continuous duty' },
      ],
      cameraFocus: {
        pos: [16, 6, 12],
        target: [16, 4.5, 0],
      },
    },
    {
      id: 'stack-right',
      name: 'Cooler Exhaust Stack & ID Fan',
      tag: 'STK-304',
      shortRole: 'Atmospheric Discharge',
      badge: 'CEMS Monitored',
      icon: '💨',
      inletTemp: '140 - 160 °C',
      outletTemp: '135 - 155 °C',
      gasVelocity: '15 - 18 m/s',
      pressure: '+0.5 mbar (Positive Stack)',
      purpose:
        'Discharge clean, filtered clinker cooler exhaust gas to atmosphere with continuous emission monitoring (CEMS).',
      workingPrinciple:
        'A variable-speed centrifugal induced draft fan draws gas through the cooler and baghouse, maintaining negative pressure and discharging through the tall steel stack.',
      lechlerApplication: {
        title: 'Emission Monitoring & Scrubber Quenching',
        nozzleSeries: 'Lechler Spiral & Hollow Cone Nozzles',
        sprayType: 'Emergency & Scrubber Quenching',
        flowRate: 'Process tailored',
        operatingPressure: '2.0 - 4.5 bar',
        dropletSpectrum: 'D32 = 100 - 160 µm',
        description:
          'Where semi-wet desulfurization or quenching is required, Lechler silicon carbide nozzles spray neutralizing slurry into ductwork or stack base without nozzle clogging.',
      },
      keySpecs: [
        { label: 'Stack Height', value: '40 m full scale' },
        { label: 'Telemetry', value: 'Continuous dust, NOx, SO2' },
        { label: 'Fan Control', value: 'VFD direct motor drive' },
        { label: 'Flange Rings', value: 'Heavy structural stiffeners' },
      ],
      cameraFocus: {
        pos: [20, 7, 12],
        target: [20, 6.0, 0],
      },
    },
  ];

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  private isBrowser = false;

  // Scene Hierarchy
  private equipmentGroup = new THREE.Group();
  private ductworkGroup = new THREE.Group();
  private cutawaysGroup = new THREE.Group();
  private cutawayMeshes: THREE.Mesh[] = [];
  private interactiveMeshes: THREE.Object3D[] = [];

  // Animated Spray Mist Systems inside Cutaways
  private sprayDroplets: {
    mesh: THREE.Mesh;
    origin: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    baseSpread: number;
  }[] = [];
  private sprayParticlesGroup = new THREE.Group();

  // Raycaster
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);

  // Performance telemetry
  private lastTime = 0;
  private frameCount = 0;
  private fpsTimer = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    setTimeout(() => {
      this.initThreeScene();
    }, 60);
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.disposeThreeResources();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isBrowser || !this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // =========================================================================
  // INITIALIZE THREE.JS SCENE (MATCHING LECHLER WHITE STUDIO INFOGRAPHIC)
  // =========================================================================
  private initThreeScene(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const width = window.innerWidth || 1400;
    const height = window.innerHeight || 900;

    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    // 2. Scene with Pristine White Studio Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfafbfd); // Clean white studio background matching reference
    this.scene.fog = new THREE.FogExp2(0xfafbfd, 0.005);

    // 3. Camera with True Isometric Infographic Perspective (Matching brochure angle)
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.5, 300);
    this.camera.position.set(2, 17, 38);

    // 4. Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 85;
    this.controls.target.set(0.5, 4.2, 0);

    // 5. Studio Lighting
    this.setupStudioLighting();

    // 6. Seamless White Studio Floor Plane
    this.createStudioFloor();

    // 7. Build Equipment & Process Flow exactly matching the reference layout
    this.buildLechlerCementPlant();

    this.scene.add(this.equipmentGroup);
    this.scene.add(this.ductworkGroup);
    this.scene.add(this.cutawaysGroup);
    this.scene.add(this.sprayParticlesGroup);

    // 8. Event listeners for raycasting
    canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.addEventListener('click', this.onCanvasClick.bind(this));

    this.lastTime = performance.now();
    this.animate();
  }

  // =========================================================================
  // STUDIO LIGHTING SETUP (CLEAN WHITE ENGINEERING ILLUMINATION)
  // =========================================================================
  private setupStudioLighting(): void {
    // Soft omnidirectional white studio fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.65);
    this.scene.add(hemiLight);

    // Key directional light casting soft floor contact shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(35, 50, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 120;
    const d = 32;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = 2.5;
    this.scene.add(keyLight);

    // Cool front fill light highlighting metallic facets
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.55);
    fillLight.position.set(-30, 25, 25);
    fillLight.castShadow = false;
    this.scene.add(fillLight);

    // Rear rim light catching top edges of ducts and stacks
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 35, -35);
    rimLight.castShadow = false;
    this.scene.add(rimLight);
  }

  // =========================================================================
  // SEAMLESS STUDIO FLOOR PLANE
  // =========================================================================
  private createStudioFloor(): void {
    const floorGeo = new THREE.PlaneGeometry(240, 240);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xfafbfd,
      roughness: 0.85,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  // =========================================================================
  // BUILD ENTIRE LECHLER CEMENT PLANT (ACCORDING TO REFERENCE IMAGE)
  // =========================================================================
  private buildLechlerCementPlant(): void {
    // 1. Shared Metallic Materials matching the Lechler brochure aesthetic
    const bodyMetalMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde6,
      metalness: 0.65,
      roughness: 0.32,
    });

    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.6,
      roughness: 0.45,
    });

    const ductMat = new THREE.MeshStandardMaterial({
      color: 0xcfd5e0,
      metalness: 0.62,
      roughness: 0.35,
    });

    const flangeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.7,
      roughness: 0.4,
    });

    // 2. Helper: Generates Lechler's signature Thermal Gradient Texture (Red -> Spray Mist -> Blue)
    const createThermalTexture = (isVertical = true, coneCount = 2): THREE.CanvasTexture => {
      const c = document.createElement('canvas');
      const w = isVertical ? 128 : 384;
      const h = isVertical ? 384 : 128;
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Base thermal gradient (Hot red -> Violet/purple -> Cooled deep blue)
      const grad = isVertical
        ? ctx.createLinearGradient(0, 0, 0, h)
        : ctx.createLinearGradient(0, 0, w, 0);

      grad.addColorStop(0.0, '#dc2626');  // Hot red (450°C - 1000°C)
      grad.addColorStop(0.26, '#ef4444');
      grad.addColorStop(0.38, '#f43f5e');
      grad.addColorStop(0.50, '#9333ea'); // Transition zone
      grad.addColorStop(0.65, '#2563eb');
      grad.addColorStop(1.0, '#1d4ed8');  // Cooled conditioned blue (160°C)

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Signature Lechler spray injection lances and atomized white mist cones
      if (isVertical) {
        const lanceY = h * 0.34;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(8, lanceY);
        ctx.lineTo(w - 8, lanceY);
        ctx.stroke();

        const step = w / (coneCount + 1);
        for (let i = 1; i <= coneCount; i++) {
          const nx = step * i;
          ctx.fillStyle = '#64748b';
          ctx.fillRect(nx - 3, lanceY - 1, 6, 7);

          const coneH = h * 0.35;
          const coneW = (w / (coneCount + 0.5)) * 0.65;

          const coneGrad = ctx.createLinearGradient(nx, lanceY + 5, nx, lanceY + 5 + coneH);
          coneGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.98)');
          coneGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.85)');
          coneGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.40)');
          coneGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(nx, lanceY + 5);
          ctx.lineTo(nx + coneW, lanceY + 5 + coneH);
          ctx.lineTo(nx + coneW * 0.5, lanceY + 5 + coneH * 0.9);
          ctx.lineTo(nx, lanceY + 5 + coneH * 1.05);
          ctx.lineTo(nx - coneW * 0.5, lanceY + 5 + coneH * 0.9);
          ctx.lineTo(nx - coneW, lanceY + 5 + coneH);
          ctx.closePath();
          ctx.fill();

          // Intense bright white core
          const coreGrad = ctx.createLinearGradient(nx, lanceY + 5, nx, lanceY + 5 + coneH * 0.6);
          coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.98)');
          coreGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.2)');
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.moveTo(nx, lanceY + 5);
          ctx.lineTo(nx + coneW * 0.4, lanceY + 5 + coneH * 0.6);
          ctx.lineTo(nx - coneW * 0.4, lanceY + 5 + coneH * 0.6);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        const lanceY = 8;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w * 0.3, lanceY);
        ctx.lineTo(w * 0.75, lanceY);
        ctx.stroke();

        const nozzleXs = [w * 0.44, w * 0.63];
        for (const nx of nozzleXs) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(nx - 3, lanceY, 6, 10);

          const coneH = h * 0.72;
          const coneW = 38;

          const coneGrad = ctx.createLinearGradient(nx, lanceY + 10, nx, lanceY + 10 + coneH);
          coneGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.98)');
          coneGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.85)');
          coneGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.35)');
          coneGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(nx, lanceY + 10);
          ctx.lineTo(nx + coneW, lanceY + 10 + coneH);
          ctx.lineTo(nx + coneW * 0.5, lanceY + 10 + coneH * 0.9);
          ctx.lineTo(nx, lanceY + 10 + coneH * 1.05);
          ctx.lineTo(nx - coneW * 0.5, lanceY + 10 + coneH * 0.9);
          ctx.lineTo(nx - coneW, lanceY + 10 + coneH);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
          ctx.beginPath();
          ctx.moveTo(nx, lanceY + 10);
          ctx.lineTo(nx + coneW * 0.42, lanceY + 10 + coneH * 0.6);
          ctx.lineTo(nx - coneW * 0.42, lanceY + 10 + coneH * 0.6);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Metallic trim border
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const thermalTexVert = createThermalTexture(true, 2);
    const thermalTexVertSingle = createThermalTexture(true, 1);
    const thermalTexHoriz = createThermalTexture(false, 2);

    const thermalCutawayMatVert = new THREE.MeshBasicMaterial({
      map: thermalTexVert,
      side: THREE.DoubleSide,
    });

    const thermalCutawayMatVertSingle = new THREE.MeshBasicMaterial({
      map: thermalTexVertSingle,
      side: THREE.DoubleSide,
    });

    const thermalCutawayMatHoriz = new THREE.MeshBasicMaterial({
      map: thermalTexHoriz,
      side: THREE.DoubleSide,
    });

    // Helper: flanged duct builder
    const buildFlangedDuct = (points: THREE.Vector3[], radius = 0.48) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, radius, 18, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, ductMat);
      tubeMesh.castShadow = true;
      tubeMesh.receiveShadow = true;
      this.ductworkGroup.add(tubeMesh);

      // Bolted flange rings at start and end
      for (const t of [0.03, 0.97]) {
        const pt = curve.getPoint(t);
        const ringGeo = new THREE.TorusGeometry(radius + 0.1, 0.06, 8, 20);
        const ring = new THREE.Mesh(ringGeo, flangeMat);
        ring.position.copy(pt);
        this.ductworkGroup.add(ring);
      }
    };

    // -----------------------------------------------------------------------
    // A. ROTARY KILN & ROLLER SUPPORTS (X = 5.0)
    // -----------------------------------------------------------------------
    const kilnGroup = new THREE.Group();
    kilnGroup.position.set(5.0, 0, 0);
    kilnGroup.userData['equipmentId'] = 'rotary-kiln';

    // Slightly inclined kiln cylinder (length 11.0, radius 1.25)
    const kilnGeo = new THREE.CylinderGeometry(1.25, 1.25, 11.0, 32);
    kilnGeo.rotateZ(Math.PI / 2);
    kilnGeo.rotateY(0.035); // 2 degree slope
    const kilnMesh = new THREE.Mesh(kilnGeo, bodyMetalMat);
    kilnMesh.position.set(0, 3.2, 0);
    kilnMesh.castShadow = true;
    kilnMesh.receiveShadow = true;
    kilnGroup.add(kilnMesh);
    this.interactiveMeshes.push(kilnMesh);

    // Two Riding Rings (Tyres) and Concrete Piers
    for (const tyreX of [-3.2, 2.8]) {
      const tyreGeo = new THREE.CylinderGeometry(1.48, 1.48, 0.55, 28);
      tyreGeo.rotateZ(Math.PI / 2);
      const tyre = new THREE.Mesh(tyreGeo, darkSteelMat);
      tyre.position.set(tyreX, 3.2, 0);
      tyre.castShadow = true;
      kilnGroup.add(tyre);

      // Roller bearings
      for (const rz of [-0.85, 0.85]) {
        const rollerGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.45, 16);
        rollerGeo.rotateZ(Math.PI / 2);
        const roller = new THREE.Mesh(rollerGeo, darkSteelMat);
        roller.position.set(tyreX, 1.9, rz);
        kilnGroup.add(roller);
      }

      // Pier Block
      const pierGeo = new THREE.BoxGeometry(1.2, 1.6, 2.6);
      const pier = new THREE.Mesh(pierGeo, bodyMetalMat);
      pier.position.set(tyreX, 0.8, 0);
      pier.castShadow = true;
      kilnGroup.add(pier);
    }

    // Kiln feed inlet transition hood (connecting to calciner riser)
    const feedHoodGeo = new THREE.BoxGeometry(1.6, 2.6, 2.2);
    const feedHood = new THREE.Mesh(feedHoodGeo, bodyMetalMat);
    feedHood.position.set(-5.8, 3.4, 0);
    feedHood.castShadow = true;
    kilnGroup.add(feedHood);

    // Kiln discharge burner hood (connecting to clinker cooler)
    const dischHoodGeo = new THREE.BoxGeometry(1.8, 3.2, 2.4);
    const dischHood = new THREE.Mesh(dischHoodGeo, bodyMetalMat);
    dischHood.position.set(5.8, 3.2, 0);
    dischHood.castShadow = true;
    kilnGroup.add(dischHood);

    this.equipmentGroup.add(kilnGroup);

    // -----------------------------------------------------------------------
    // B. CLINKER COOLER WITH ICONIC RED->WHITE->BLUE CUTAWAY (X = 11.0)
    // -----------------------------------------------------------------------
    const coolerGroup = new THREE.Group();
    coolerGroup.position.set(11.0, 0, 0);
    coolerGroup.userData['equipmentId'] = 'clinker-cooler';

    // Horizontal cooler housing (Length 6.5, Height 1.8, Depth 2.0)
    const coolerGeo = new THREE.BoxGeometry(6.5, 1.8, 2.0);
    const coolerMesh = new THREE.Mesh(coolerGeo, bodyMetalMat);
    coolerMesh.position.set(0, 1.8, 0);
    coolerMesh.castShadow = true;
    coolerGroup.add(coolerMesh);
    this.interactiveMeshes.push(coolerMesh);

    // Front Thermal Gradient Cutaway Window (Red -> Dual Spray Cones -> Blue)
    const coolerCutawayGeo = new THREE.PlaneGeometry(5.8, 1.5);
    const coolerCutaway = new THREE.Mesh(coolerCutawayGeo, thermalCutawayMatHoriz);
    coolerCutaway.position.set(0, 1.8, 1.02);
    coolerGroup.add(coolerCutaway);
    this.cutawayMeshes.push(coolerCutaway);

    // 3 Centrifugal Cooling Air Fans underneath
    for (const fanX of [-2.0, 0, 2.0]) {
      const fanScrollGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.5, 16);
      fanScrollGeo.rotateZ(Math.PI / 2);
      const fanScroll = new THREE.Mesh(fanScrollGeo, darkSteelMat);
      fanScroll.position.set(fanX, 0.55, 1.3);
      coolerGroup.add(fanScroll);

      const motorGeo = new THREE.BoxGeometry(0.4, 0.35, 0.35);
      const motor = new THREE.Mesh(motorGeo, bodyMetalMat);
      motor.position.set(fanX, 0.55, 1.7);
      coolerGroup.add(motor);
    }

    // Add Dual Spray Droplets inside Clinker Cooler cutaway
    for (const sprayX of [10.2, 11.8]) {
      this.registerSprayEmitter(new THREE.Vector3(sprayX, 2.3, 0.6), 0.35, 0.6);
    }

    this.equipmentGroup.add(coolerGroup);

    // Tertiary Air Duct running above kiln back to calciner
    buildFlangedDuct([
      new THREE.Vector3(7.2, 3.8, -0.6),
      new THREE.Vector3(7.2, 5.2, -0.8),
      new THREE.Vector3(0.0, 5.2, -0.8),
      new THREE.Vector3(-1.0, 5.2, -0.4),
    ], 0.38);

    // -----------------------------------------------------------------------
    // C. CLINKER COOLER BAGHOUSE & STACK (FAR RIGHT: X = 16.5 & X = 20.5)
    // -----------------------------------------------------------------------
    const baghouseRight = new THREE.Group();
    baghouseRight.position.set(16.5, 0, 0);
    baghouseRight.userData['equipmentId'] = 'baghouse-right';

    // 4-Hopper Filter Housing (Length 4.8, Height 2.8, Depth 2.6)
    const bhGeo = new THREE.BoxGeometry(4.8, 2.8, 2.6);
    const bhMesh = new THREE.Mesh(bhGeo, bodyMetalMat);
    bhMesh.position.set(0, 5.2, 0);
    bhMesh.castShadow = true;
    baghouseRight.add(bhMesh);
    this.interactiveMeshes.push(bhMesh);

    // 4 Inverted Pyramidal Hoppers
    for (const hx of [-1.5, -0.5, 0.5, 1.5]) {
      const hopGeo = new THREE.ConeGeometry(0.65, 1.5, 4);
      hopGeo.rotateX(Math.PI);
      hopGeo.rotateY(Math.PI / 4);
      const hop = new THREE.Mesh(hopGeo, bodyMetalMat);
      hop.position.set(hx, 3.0, 0);
      hop.castShadow = true;
      baghouseRight.add(hop);
    }

    // Support pillars
    for (const cx of [-2.2, 2.2]) {
      for (const cz of [-1.1, 1.1]) {
        const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.8, 12);
        const pillar = new THREE.Mesh(pillarGeo, darkSteelMat);
        pillar.position.set(cx, 1.9, cz);
        baghouseRight.add(pillar);
      }
    }

    this.equipmentGroup.add(baghouseRight);

    // Duct from Cooler to Baghouse
    buildFlangedDuct([
      new THREE.Vector3(13.6, 2.4, 0),
      new THREE.Vector3(14.2, 3.8, 0),
      new THREE.Vector3(14.8, 5.6, 0),
    ], 0.42);

    // Small thermal cutaway on the duct to baghouse (matching brochure image)
    const ductCutawayGeo = new THREE.PlaneGeometry(1.2, 0.45);
    const ductCutaway = new THREE.Mesh(ductCutawayGeo, thermalCutawayMatHoriz);
    ductCutaway.position.set(14.2, 3.8, 0.44);
    ductCutaway.rotation.z = 0.55;
    this.equipmentGroup.add(ductCutaway);
    this.cutawayMeshes.push(ductCutaway);

    // ID Fan Right
    const fanRightGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
    fanRightGeo.rotateZ(Math.PI / 2);
    const fanRight = new THREE.Mesh(fanRightGeo, darkSteelMat);
    fanRight.position.set(19.0, 1.0, 0);
    this.equipmentGroup.add(fanRight);

    // Duct from Baghouse to ID Fan to Stack
    buildFlangedDuct([
      new THREE.Vector3(18.8, 4.8, 0),
      new THREE.Vector3(19.0, 2.2, 0),
      new THREE.Vector3(19.0, 1.0, 0),
      new THREE.Vector3(19.6, 1.0, 0),
      new THREE.Vector3(20.5, 1.0, 0),
    ], 0.38);

    // Far-Right Stack
    const stackRightGroup = new THREE.Group();
    stackRightGroup.position.set(20.5, 0, 0);
    stackRightGroup.userData['equipmentId'] = 'stack-right';

    const stackGeo = new THREE.CylinderGeometry(0.45, 0.55, 13.5, 28);
    const stackMesh = new THREE.Mesh(stackGeo, bodyMetalMat);
    stackMesh.position.set(0, 6.75, 0);
    stackMesh.castShadow = true;
    stackRightGroup.add(stackMesh);
    this.interactiveMeshes.push(stackMesh);

    // Top flange ring
    const topRingGeo = new THREE.TorusGeometry(0.55, 0.06, 8, 20);
    topRingGeo.rotateX(Math.PI / 2);
    const topRing = new THREE.Mesh(topRingGeo, flangeMat);
    topRing.position.set(0, 13.5, 0);
    stackRightGroup.add(topRing);

    this.equipmentGroup.add(stackRightGroup);

    // -----------------------------------------------------------------------
    // D. 5-STAGE CYCLONE PREHEATER TOWER (CENTER-LEFT: X = -3.5)
    // -----------------------------------------------------------------------
    const preheaterGroup = new THREE.Group();
    preheaterGroup.position.set(-3.5, 0, 0);
    preheaterGroup.userData['equipmentId'] = 'preheater-tower';

    // 5 Staggered Cyclones in vertical cascade
    const cycloneDefs = [
      { x: 0.5, y: 11.2, r: 0.85, cutaway: true }, // Top cyclone with cutaway
      { x: -0.6, y: 9.2, r: 0.78, cutaway: false },
      { x: 0.5, y: 7.2, r: 0.75, cutaway: false },
      { x: -0.6, y: 5.2, r: 0.72, cutaway: false },
      { x: 0.5, y: 3.4, r: 0.70, cutaway: false },
    ];

    for (let i = 0; i < cycloneDefs.length; i++) {
      const cDef = cycloneDefs[i];
      // Upper cylinder
      const cGeo = new THREE.CylinderGeometry(cDef.r, cDef.r, 1.1, 24);
      const cMesh = new THREE.Mesh(cGeo, bodyMetalMat);
      cMesh.position.set(cDef.x, cDef.y, 0);
      cMesh.castShadow = true;
      preheaterGroup.add(cMesh);
      this.interactiveMeshes.push(cMesh);

      // Lower cone
      const coneGeo = new THREE.ConeGeometry(cDef.r, 1.4, 24);
      coneGeo.rotateX(Math.PI);
      const cone = new THREE.Mesh(coneGeo, bodyMetalMat);
      cone.position.set(cDef.x, cDef.y - 1.25, 0);
      cone.castShadow = true;
      preheaterGroup.add(cone);

      // Connecting meal chute
      if (i < cycloneDefs.length - 1) {
        const nextDef = cycloneDefs[i + 1];
        const chuteCurve = new THREE.LineCurve3(
          new THREE.Vector3(cDef.x, cDef.y - 1.9, 0),
          new THREE.Vector3(nextDef.x, nextDef.y + 0.4, 0)
        );
        const chuteGeo = new THREE.TubeGeometry(chuteCurve, 8, 0.1, 10, false);
        const chute = new THREE.Mesh(chuteGeo, darkSteelMat);
        preheaterGroup.add(chute);
      }
    }

    // Top Cyclone Thermal Cutaway (Showing internal hot separation spray)
    const topCycCutawayGeo = new THREE.PlaneGeometry(1.2, 1.0);
    const topCycCutaway = new THREE.Mesh(topCycCutawayGeo, thermalCutawayMatVertSingle);
    topCycCutaway.position.set(0.5, 11.2, 0.88);
    preheaterGroup.add(topCycCutaway);
    this.cutawayMeshes.push(topCycCutaway);

    // Chute into Kiln Inlet
    const finalChuteCurve = new THREE.LineCurve3(
      new THREE.Vector3(0.5, 1.5, 0),
      new THREE.Vector3(-0.8, 3.2, 0)
    );
    const finalChuteGeo = new THREE.TubeGeometry(finalChuteCurve, 8, 0.12, 10, false);
    const finalChute = new THREE.Mesh(finalChuteGeo, darkSteelMat);
    preheaterGroup.add(finalChute);

    this.equipmentGroup.add(preheaterGroup);

    // -----------------------------------------------------------------------
    // E. CALCINER RISER DUCT (X = -1.0)
    // -----------------------------------------------------------------------
    const calcinerGroup = new THREE.Group();
    calcinerGroup.position.set(-1.0, 0, 0);
    calcinerGroup.userData['equipmentId'] = 'calciner';

    // Tall vertical calciner riser duct (Height 10.5, radius 0.6)
    const calcGeo = new THREE.CylinderGeometry(0.58, 0.58, 10.5, 24);
    const calcMesh = new THREE.Mesh(calcGeo, bodyMetalMat);
    calcMesh.position.set(0, 6.2, 0);
    calcMesh.castShadow = true;
    calcinerGroup.add(calcMesh);
    this.interactiveMeshes.push(calcMesh);

    // Green / Cyan SNCR DeNOx injection window strip
    const sncrStripGeo = new THREE.PlaneGeometry(0.6, 2.4);
    const sncrMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const sncrStrip = new THREE.Mesh(sncrStripGeo, sncrMat);
    sncrStrip.position.set(0, 6.8, 0.61);
    calcinerGroup.add(sncrStrip);
    this.cutawayMeshes.push(sncrStrip);

    // SNCR Reagent Injection Lance stubs
    for (const lanceY of [6.2, 6.8, 7.4]) {
      const lanceStubGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12);
      lanceStubGeo.rotateZ(Math.PI / 2);
      const lanceStub = new THREE.Mesh(lanceStubGeo, darkSteelMat);
      lanceStub.position.set(0.4, lanceY, 0.61);
      calcinerGroup.add(lanceStub);
    }

    this.equipmentGroup.add(calcinerGroup);

    // -----------------------------------------------------------------------
    // F. DOWNCOMER DUCT WITH THERMAL CUTAWAY (X = -7.5)
    // -----------------------------------------------------------------------
    const downcomerGroup = new THREE.Group();
    downcomerGroup.position.set(-7.5, 0, 0);
    downcomerGroup.userData['equipmentId'] = 'downcomer';

    // Tall vertical duct rising to top bend
    buildFlangedDuct([
      new THREE.Vector3(-7.5, 1.0, 0),
      new THREE.Vector3(-7.5, 13.5, 0),
      new THREE.Vector3(-5.8, 14.2, 0),
      new THREE.Vector3(-3.0, 14.2, 0),
      new THREE.Vector3(-3.0, 12.0, 0),
    ], 0.48);

    // Downcomer Vertical Cutaway (Red -> Spray -> Blue)
    const dcCutawayGeo = new THREE.PlaneGeometry(0.85, 5.2);
    const dcCutaway = new THREE.Mesh(dcCutawayGeo, thermalCutawayMatVertSingle);
    dcCutaway.position.set(-7.5, 8.8, 0.52);
    downcomerGroup.add(dcCutaway);
    this.cutawayMeshes.push(dcCutaway);

    // Register spray droplets inside downcomer
    this.registerSprayEmitter(new THREE.Vector3(-7.5, 10.2, 0.2), 0.25, 0.55);

    this.equipmentGroup.add(downcomerGroup);

    // -----------------------------------------------------------------------
    // G. MAIN GAS CONDITIONING TOWER (GCT) WITH LARGE CUTAWAY (X = -13.0)
    // -----------------------------------------------------------------------
    const gctLeft = new THREE.Group();
    gctLeft.position.set(-13.0, 0, 0);
    gctLeft.userData['equipmentId'] = 'gct-left';

    // Vertical GCT Cylinder (Radius 1.45, Height 6.5)
    const gctGeo = new THREE.CylinderGeometry(1.45, 1.45, 6.5, 32);
    const gctMesh = new THREE.Mesh(gctGeo, bodyMetalMat);
    gctMesh.position.set(0, 6.8, 0);
    gctMesh.castShadow = true;
    gctMesh.receiveShadow = true;
    gctLeft.add(gctMesh);
    this.interactiveMeshes.push(gctMesh);

    // Top Dome Head
    const gctTopGeo = new THREE.CylinderGeometry(0.5, 1.45, 1.2, 32);
    const gctTop = new THREE.Mesh(gctTopGeo, bodyMetalMat);
    gctTop.position.set(0, 10.65, 0);
    gctTop.castShadow = true;
    gctLeft.add(gctTop);

    // Bottom Conical Hopper
    const gctConeGeo = new THREE.ConeGeometry(1.45, 2.2, 32);
    gctConeGeo.rotateX(Math.PI);
    const gctCone = new THREE.Mesh(gctConeGeo, bodyMetalMat);
    gctCone.position.set(0, 2.5, 0);
    gctCone.castShadow = true;
    gctLeft.add(gctCone);

    // Signature Front Thermal Gradient Cutaway (Red -> White Spray Mist -> Blue)
    const gctCutawayGeo = new THREE.PlaneGeometry(2.3, 4.8);
    const gctCutaway = new THREE.Mesh(gctCutawayGeo, thermalCutawayMatVert);
    gctCutaway.position.set(0, 6.8, 1.48);
    gctLeft.add(gctCutaway);
    this.cutawayMeshes.push(gctCutaway);

    // Register active spray mist particles inside GCT
    this.registerSprayEmitter(new THREE.Vector3(-13.0, 8.8, 0.6), 0.55, 0.85);

    // Overhead U-pipe leaving top of GCT
    buildFlangedDuct([
      new THREE.Vector3(-13.0, 11.2, 0),
      new THREE.Vector3(-13.0, 12.8, 0),
      new THREE.Vector3(-11.5, 12.8, 0),
      new THREE.Vector3(-11.5, 1.0, 0),
      new THREE.Vector3(-10.0, 1.0, 0),
    ], 0.42);

    this.equipmentGroup.add(gctLeft);

    // -----------------------------------------------------------------------
    // H. VERTICAL ROLLER MILL (VRM) IN FRONT (X = -15.5, Z = 2.4)
    // -----------------------------------------------------------------------
    const vrmGroup = new THREE.Group();
    vrmGroup.position.set(-15.5, 0, 2.4);
    vrmGroup.userData['equipmentId'] = 'roller-mill';

    // Base pedestal
    const vrmBaseGeo = new THREE.BoxGeometry(3.0, 0.5, 3.0);
    const vrmBase = new THREE.Mesh(vrmBaseGeo, darkSteelMat);
    vrmBase.position.set(0, 0.25, 0);
    vrmGroup.add(vrmBase);

    // Lower mill casing cylinder
    const vrmLowerGeo = new THREE.CylinderGeometry(1.35, 1.35, 1.0, 32);
    const vrmLower = new THREE.Mesh(vrmLowerGeo, bodyMetalMat);
    vrmLower.position.set(0, 1.0, 0);
    vrmLower.castShadow = true;
    vrmGroup.add(vrmLower);
    this.interactiveMeshes.push(vrmLower);

    // Middle chamber rear shell (leaves front open for cutaway viewing)
    const vrmShellGeo = new THREE.CylinderGeometry(1.35, 1.35, 1.5, 32, 1, true, Math.PI * 0.35, Math.PI * 1.3);
    const vrmShell = new THREE.Mesh(vrmShellGeo, bodyMetalMat);
    vrmShell.position.set(0, 2.25, 0);
    vrmShell.castShadow = true;
    vrmGroup.add(vrmShell);

    // Upper conical classifier housing
    const vrmTopGeo = new THREE.CylinderGeometry(0.55, 1.35, 1.2, 32);
    const vrmTop = new THREE.Mesh(vrmTopGeo, bodyMetalMat);
    vrmTop.position.set(0, 3.6, 0);
    vrmTop.castShadow = true;
    vrmGroup.add(vrmTop);

    // Internal Grinding Table (Rotating disc)
    const tableGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.22, 28);
    const tableMesh = new THREE.Mesh(tableGeo, darkSteelMat);
    tableMesh.position.set(0, 1.3, 0);
    vrmGroup.add(tableMesh);

    // Raw meal bed layer on table
    const bedGeo = new THREE.CylinderGeometry(1.02, 1.02, 0.05, 28);
    const bedMat = new THREE.MeshStandardMaterial({
      color: 0xd8cebc,
      roughness: 0.85,
    });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.set(0, 1.43, 0);
    vrmGroup.add(bedMesh);

    // Central drive shaft
    const shaftGeo = new THREE.CylinderGeometry(0.16, 0.16, 2.4, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, darkSteelMat);
    shaftMesh.position.set(0, 2.4, 0);
    vrmGroup.add(shaftMesh);

    // Dynamic Classifier Rotor in upper section
    const rotorGeo = new THREE.CylinderGeometry(0.65, 0.5, 0.6, 20);
    const rotorMesh = new THREE.Mesh(rotorGeo, darkSteelMat);
    rotorMesh.position.set(0, 2.7, 0);
    vrmGroup.add(rotorMesh);

    // Two Heavy Grinding Rollers inclined on table bed (matching reference diagram)
    for (const rSign of [-0.46, 0.46]) {
      const rollerGeo = new THREE.CylinderGeometry(0.36, 0.46, 0.52, 20);
      rollerGeo.rotateZ(0.36 * Math.sign(rSign));
      const roller = new THREE.Mesh(rollerGeo, darkSteelMat);
      roller.position.set(rSign, 1.85, 0.28);
      vrmGroup.add(roller);

      // Roller pivot arm
      const armCurve = new THREE.LineCurve3(
        new THREE.Vector3(rSign * 1.6, 2.4, 0),
        new THREE.Vector3(rSign, 1.85, 0.28)
      );
      const armGeo = new THREE.TubeGeometry(armCurve, 6, 0.09, 8, false);
      const arm = new THREE.Mesh(armGeo, bodyMetalMat);
      vrmGroup.add(arm);
    }

    // Silver cutaway border rim around the front opening
    const vrmTrimGeo = new THREE.RingGeometry(1.15, 1.35, 24, 1, Math.PI * 0.15, Math.PI * 0.7);
    const vrmTrim = new THREE.Mesh(vrmTrimGeo, flangeMat);
    vrmTrim.position.set(0, 2.2, 1.36);
    vrmGroup.add(vrmTrim);
    this.cutawayMeshes.push(vrmTrim);

    this.equipmentGroup.add(vrmGroup);

    // Duct from GCT to VRM
    buildFlangedDuct([
      new THREE.Vector3(-13.0, 3.2, 0),
      new THREE.Vector3(-14.2, 3.2, 1.2),
      new THREE.Vector3(-15.5, 3.2, 2.4),
    ], 0.38);

    // -----------------------------------------------------------------------
    // I. RAW GAS BAGHOUSE & FAR-LEFT STACK (X = -18.5 & X = -22.5)
    // -----------------------------------------------------------------------
    const baghouseLeft = new THREE.Group();
    baghouseLeft.position.set(-18.5, 0, 0);
    baghouseLeft.userData['equipmentId'] = 'baghouse-left';

    const bhlGeo = new THREE.BoxGeometry(4.2, 2.8, 2.4);
    const bhlMesh = new THREE.Mesh(bhlGeo, bodyMetalMat);
    bhlMesh.position.set(0, 4.2, 0);
    bhlMesh.castShadow = true;
    baghouseLeft.add(bhlMesh);
    this.interactiveMeshes.push(bhlMesh);

    // 3 Hoppers underneath
    for (const hx of [-1.2, 0, 1.2]) {
      const hopGeo = new THREE.ConeGeometry(0.6, 1.4, 4);
      hopGeo.rotateX(Math.PI);
      hopGeo.rotateY(Math.PI / 4);
      const hop = new THREE.Mesh(hopGeo, bodyMetalMat);
      hop.position.set(hx, 2.1, 0);
      hop.castShadow = true;
      baghouseLeft.add(hop);
    }

    this.equipmentGroup.add(baghouseLeft);

    // Duct from Mill/GCT to Baghouse
    buildFlangedDuct([
      new THREE.Vector3(-15.5, 3.8, 2.4),
      new THREE.Vector3(-16.8, 4.2, 1.0),
      new THREE.Vector3(-16.8, 4.2, 0),
    ], 0.4);

    // Far-Left Stack & ID Fan
    const fanLeftGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
    fanLeftGeo.rotateZ(Math.PI / 2);
    const fanLeft = new THREE.Mesh(fanLeftGeo, darkSteelMat);
    fanLeft.position.set(-21.0, 0.8, 0);
    this.equipmentGroup.add(fanLeft);

    buildFlangedDuct([
      new THREE.Vector3(-20.6, 3.6, 0),
      new THREE.Vector3(-21.0, 2.0, 0),
      new THREE.Vector3(-21.0, 0.8, 0),
      new THREE.Vector3(-22.5, 0.8, 0),
    ], 0.35);

    const stackLeftGeo = new THREE.CylinderGeometry(0.42, 0.5, 11.5, 28);
    const stackLeft = new THREE.Mesh(stackLeftGeo, bodyMetalMat);
    stackLeft.position.set(-22.5, 5.75, 0);
    stackLeft.castShadow = true;
    this.equipmentGroup.add(stackLeft);
    this.interactiveMeshes.push(stackLeft);

    const ringLeft = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.05, 8, 20), flangeMat);
    ringLeft.rotation.x = Math.PI / 2;
    ringLeft.position.set(-22.5, 11.5, 0);
    this.equipmentGroup.add(ringLeft);

    // -----------------------------------------------------------------------
    // J. SECONDARY GCT & AUXILIARY FILTER IN BACKGROUND (X = 2.0, Z = -3.5)
    // -----------------------------------------------------------------------
    const gctBack = new THREE.Group();
    gctBack.position.set(2.0, 0, -3.5);

    const gctBackGeo = new THREE.CylinderGeometry(1.1, 1.1, 5.2, 28);
    const gctBackMesh = new THREE.Mesh(gctBackGeo, bodyMetalMat);
    gctBackMesh.position.set(0, 5.8, 0);
    gctBackMesh.castShadow = true;
    gctBack.add(gctBackMesh);

    const gctBackCone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 24), bodyMetalMat);
    gctBackCone.rotation.x = Math.PI;
    gctBackCone.position.set(0, 2.3, 0);
    gctBack.add(gctBackCone);

    // Thermal Cutaway on Background GCT
    const gctBackCutaway = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), thermalCutawayMatVertSingle);
    gctBackCutaway.position.set(0, 5.8, 1.12);
    gctBack.add(gctBackCutaway);
    this.cutawayMeshes.push(gctBackCutaway);

    // Register spray droplets inside background GCT
    this.registerSprayEmitter(new THREE.Vector3(2.0, 7.2, -2.5), 0.45, 0.75);

    // Background auxiliary filter & center stack
    const auxFilter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 1.8), bodyMetalMat);
    auxFilter.position.set(5.5, 4.2, -3.5);
    auxFilter.castShadow = true;
    this.equipmentGroup.add(auxFilter);

    buildFlangedDuct([
      new THREE.Vector3(2.0, 3.2, -3.5),
      new THREE.Vector3(3.9, 4.2, -3.5),
    ], 0.35);

    buildFlangedDuct([
      new THREE.Vector3(7.1, 4.2, -3.5),
      new THREE.Vector3(8.5, 1.0, -3.5),
    ], 0.32);

    // Center background stack
    const stackMidGeo = new THREE.CylinderGeometry(0.4, 0.48, 12.0, 24);
    const stackMid = new THREE.Mesh(stackMidGeo, bodyMetalMat);
    stackMid.position.set(8.5, 6.0, -3.5);
    stackMid.castShadow = true;
    this.equipmentGroup.add(stackMid);

    const ringMid = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 8, 20), flangeMat);
    ringMid.rotation.x = Math.PI / 2;
    ringMid.position.set(8.5, 12.0, -3.5);
    this.equipmentGroup.add(ringMid);

    this.equipmentGroup.add(gctBack);
  }

  // =========================================================================
  // REGISTER ANIMATED WHITE SPRAY CONE DROPLETS INSIDE CUTAWAY WINDOWS
  // =========================================================================
  private registerSprayEmitter(origin: THREE.Vector3, minSpread: number, maxSpread: number): void {
    // 3D Semi-transparent volumetric mist cone (additive blending) matching Lechler brochure graphics
    const coneHeight = Math.max(1.2, maxSpread * 2.2);
    const coneRadius = Math.max(0.42, maxSpread * 0.9);
    const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 20, 1, true);
    coneGeo.rotateX(Math.PI); // apex at top lance tip, spreading downwards
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(origin.x, origin.y - coneHeight * 0.48, origin.z);
    this.sprayParticlesGroup.add(coneMesh);

    const dropletGeo = new THREE.SphereGeometry(0.042, 6, 6);
    const dropletMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, // Crisp white spray mist cones matching reference drawing
      transparent: true,
      opacity: 0.92,
    });

    const dropletsCount = 28;
    for (let i = 0; i < dropletsCount; i++) {
      const mesh = new THREE.Mesh(dropletGeo, dropletMat.clone());
      mesh.position.copy(origin);
      this.sprayParticlesGroup.add(mesh);

      this.sprayDroplets.push({
        mesh,
        origin: origin.clone(),
        velocity: new THREE.Vector3(),
        life: Math.random(),
        maxLife: 0.65 + Math.random() * 0.45,
        baseSpread: minSpread + Math.random() * (maxSpread - minSpread),
      });
    }
  }

  // =========================================================================
  // ANIMATION LOOP
  // =========================================================================
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Telemetry FPS
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (this.isPlaying) {
      this.updateSprayParticles(dt * this.simulationSpeed);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  // =========================================================================
  // UPDATE SPRAY DROPLETS (CREATES DENSE, DOWNWARD-CONING WHITE MIST CONES)
  // =========================================================================
  private updateSprayParticles(delta: number): void {
    if (!this.showWaterSpray) {
      this.sprayParticlesGroup.visible = false;
      return;
    }

    this.sprayParticlesGroup.visible = true;
    for (const d of this.sprayDroplets) {
      d.life += delta;
      if (d.life >= d.maxLife) {
        d.life = 0;
        d.mesh.position.copy(d.origin);

        // Downward conical dispersion
        const angle = Math.random() * Math.PI * 2;
        const spread = d.baseSpread * Math.random();
        d.velocity.set(
          Math.cos(angle) * spread,
          -2.8 - Math.random() * 1.8,
          Math.sin(angle) * spread * 0.5 // slightly flatted in Z for cutaway visibility
        );
      } else {
        d.mesh.position.addScaledVector(d.velocity, delta);

        // Droplet size & opacity fades out as it completes 100% evaporation
        const progress = d.life / d.maxLife;
        const fade = Math.max(0, 1.0 - progress);
        d.mesh.scale.setScalar(Math.max(0.1, fade));
        (d.mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.95;
      }
    }
  }

  // =========================================================================
  // RAYCASTING: HOVER & CLICK SELECTION
  // =========================================================================
  private onPointerMove(event: MouseEvent): void {
    if (!this.canvasRef) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.tooltipPos = { x: event.clientX + 16, y: event.clientY + 16 };

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);

    if (intersects.length > 0) {
      let root: THREE.Object3D | null = intersects[0].object;
      while (root && root.parent && root.parent !== this.equipmentGroup && root.parent !== this.scene) {
        root = root.parent;
      }
      if (root && root.userData && root.userData['equipmentId']) {
        const eqId = root.userData['equipmentId'];
        this.hoveredEquipment = this.equipmentList.find((e) => e.id === eqId) || null;
        this.canvasRef.nativeElement.style.cursor = 'pointer';
      } else {
        this.hoveredEquipment = null;
        this.canvasRef.nativeElement.style.cursor = 'default';
      }
    } else {
      this.hoveredEquipment = null;
      this.canvasRef.nativeElement.style.cursor = 'default';
    }
    this.cdr.detectChanges();
  }

  private onCanvasClick(event: MouseEvent): void {
    if (!this.canvasRef) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);

    if (intersects.length > 0) {
      let root: THREE.Object3D | null = intersects[0].object;
      while (root && root.parent && root.parent !== this.equipmentGroup && root.parent !== this.scene) {
        root = root.parent;
      }
      if (root && root.userData && root.userData['equipmentId']) {
        const eqId = root.userData['equipmentId'];
        const found = this.equipmentList.find((e) => e.id === eqId);
        if (found) {
          this.selectEquipment(found);
        }
      }
    }
  }

  // =========================================================================
  // CAMERA FOCUS & PRESETS
  // =========================================================================
  selectEquipment(item: EquipmentItem): void {
    this.selectedEquipment = item;
    this.isInfoDrawerOpen = true;
    this.activeCameraPreset = item.id;
    this.glideCamera(item.cameraFocus.pos, item.cameraFocus.target);
    this.cdr.detectChanges();
  }

  closeInfoDrawer(): void {
    this.isInfoDrawerOpen = false;
    this.selectedEquipment = null;
    this.cdr.detectChanges();
  }

  setCameraPreset(preset: string): void {
    this.activeCameraPreset = preset;

    if (preset === 'overview') {
      this.selectedEquipment = null;
      this.isInfoDrawerOpen = false;
      this.glideCamera([2, 17, 36], [0.5, 4.2, 0]);
      return;
    }

    const item = this.equipmentList.find((e) => e.id === preset);
    if (item) {
      this.selectEquipment(item);
    }
  }

  resetCamera(): void {
    this.setCameraPreset('overview');
  }

  private glideCamera(pos: [number, number, number], target: [number, number, number]): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = new THREE.Vector3(...pos);
    const endTarget = new THREE.Vector3(...target);

    const startTime = performance.now();
    const duration = 750;

    const animateGlide = (now: number) => {
      const elapsed = (now - startTime) / duration;
      if (elapsed < 1.0) {
        const ease = 1 - Math.pow(1 - elapsed, 3);
        this.camera.position.lerpVectors(startPos, endPos, ease);
        this.controls.target.lerpVectors(startTarget, endTarget, ease);
        requestAnimationFrame(animateGlide);
      } else {
        this.camera.position.copy(endPos);
        this.controls.target.copy(endTarget);
      }
    };
    requestAnimationFrame(animateGlide);
  }

  togglePlayPause(): void {
    this.isPlaying = !this.isPlaying;
  }

  toggleWaterSpray(): void {
    this.showWaterSpray = !this.showWaterSpray;
  }

  toggleThermalCutaways(): void {
    this.showThermalCutaways = !this.showThermalCutaways;
    this.cutawaysGroup.visible = this.showThermalCutaways;
    this.cutawayMeshes.forEach((m) => (m.visible = this.showThermalCutaways));
  }

  toggleLechlerGuide(): void {
    this.isLechlerGuideOpen = !this.isLechlerGuideOpen;
  }

  private disposeThreeResources(): void {
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    this.renderer.dispose();
  }
}
