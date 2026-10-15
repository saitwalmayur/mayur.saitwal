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
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface BoardCoord {
  x: number; // 0..7 (a..h)
  y: number; // 0..7 (1..8)
}

export interface Move {
  from: BoardCoord;
  to: BoardCoord;
  captured?: ChessPiece | null;
  piece: ChessPiece;
  promotion?: PieceType;
  san?: string;
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

// Piece-Square evaluation heatmaps for AI positioning
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_PST = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MID_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

@Component({
  selector: 'app-threejschess',
  imports: [CommonModule, RouterLink],
  templateUrl: './threejschess.html',
  styleUrl: './threejschess.scss',
})
export class Threejschess implements AfterViewInit, OnDestroy {
  @ViewChild('rendererCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewportContainer') containerRef!: ElementRef<HTMLDivElement>;

  // Board state: 8x8 (x: 0..7 => a..h, y: 0..7 => 1..8)
  board: (ChessPiece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Game tracking
  turn: PieceColor = 'w';
  playerColor: PieceColor = 'w';
  aiDifficulty: AIDifficulty = 'medium';
  isThinking = false;
  isGameOver = false;
  gameStatusText = 'White to move';
  isCheck = false;
  selectedCoord: BoardCoord | null = null;
  validMoves: BoardCoord[] = [];
  moveHistory: { white: string; black?: string }[] = [];
  capturedByWhite: ChessPiece[] = [];
  capturedByBlack: ChessPiece[] = [];

  // Collapsible UI state
  isLeftCollapsed = false;
  isRightCollapsed = false;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private animationId: number | null = null;
  private isBrowser = false;

  // 3D Objects mapping
  private squareMeshes: THREE.Mesh[][] = [];
  private pieceObjects: Map<string, THREE.Group> = new Map(); // key: "x,y"
  private highlightGroup = new THREE.Group();
  private boardGroup = new THREE.Group();
  private piecesGroup = new THREE.Group();

  // Materials
  private whitePieceMaterial!: THREE.Material;
  private blackPieceMaterial!: THREE.Material;
  private lightSquareMaterial!: THREE.Material;
  private darkSquareMaterial!: THREE.Material;
  private selectedSquareMaterial!: THREE.Material;
  private targetSquareMaterial!: THREE.Material;
  private lastMoveMaterial!: THREE.Material;

  private lastMove: { from: BoardCoord; to: BoardCoord } | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.initBoardState();
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.initThree();
    }
  }

  toggleLeft() {
    this.isLeftCollapsed = !this.isLeftCollapsed;
    this.cdr.detectChanges();
  }

  toggleRight() {
    this.isRightCollapsed = !this.isRightCollapsed;
    this.cdr.detectChanges();
  }

  setDifficulty(diff: AIDifficulty) {
    this.aiDifficulty = diff;
    this.cdr.detectChanges();
  }

  setCameraView(view: 'player' | 'opponent' | 'top' | 'isometric') {
    if (!this.camera || !this.controls) return;
    switch (view) {
      case 'player':
        this.camera.position.set(0, 7.5, 7.5);
        this.controls.target.set(0, 0, 0);
        break;
      case 'opponent':
        this.camera.position.set(0, 7.5, -7.5);
        this.controls.target.set(0, 0, 0);
        break;
      case 'top':
        this.camera.position.set(0, 10.5, 0.01);
        this.controls.target.set(0, 0, 0);
        break;
      case 'isometric':
        this.camera.position.set(6.5, 7.0, 6.5);
        this.controls.target.set(0, 0, 0);
        break;
    }
    this.controls.update();
  }

  resetGame() {
    this.initBoardState();
    this.turn = 'w';
    this.isThinking = false;
    this.isGameOver = false;
    this.isCheck = false;
    this.gameStatusText = 'White to move';
    this.selectedCoord = null;
    this.validMoves = [];
    this.moveHistory = [];
    this.capturedByWhite = [];
    this.capturedByBlack = [];
    this.lastMove = null;

    if (this.scene) {
      this.rebuildAllPieces3D();
      this.clearHighlights();
    }

    if (this.playerColor === 'b') {
      this.triggerAIMove();
    }
    this.cdr.detectChanges();
  }

  undoMove() {
    if (this.isThinking || this.moveHistory.length === 0) return;
    // For simplicity with AI, undo both the AI's move and the player's last move
    // We restart board and replay all moves except the last pair
    const targetMoveCount = (this.moveHistory.length - 1) * 2;
    // If black hadn't played yet in the current round, just undo 1 move
    const lastRound = this.moveHistory[this.moveHistory.length - 1];
    const totalHalfMoves = (this.moveHistory.length - 1) * 2 + (lastRound.black ? 2 : 1);
    const stepsToKeep = Math.max(0, totalHalfMoves - 2);

    this.replayMovesUpTo(stepsToKeep);
    this.cdr.detectChanges();
  }

  private initBoardState() {
    this.board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    // Place Pawns
    for (let x = 0; x < 8; x++) {
      this.board[x][1] = { type: 'p', color: 'w', hasMoved: false };
      this.board[x][6] = { type: 'p', color: 'b', hasMoved: false };
    }

    // Place Rooks
    this.board[0][0] = { type: 'r', color: 'w', hasMoved: false };
    this.board[7][0] = { type: 'r', color: 'w', hasMoved: false };
    this.board[0][7] = { type: 'r', color: 'b', hasMoved: false };
    this.board[7][7] = { type: 'r', color: 'b', hasMoved: false };

    // Place Knights
    this.board[1][0] = { type: 'n', color: 'w' };
    this.board[6][0] = { type: 'n', color: 'w' };
    this.board[1][7] = { type: 'n', color: 'b' };
    this.board[6][7] = { type: 'n', color: 'b' };

    // Place Bishops
    this.board[2][0] = { type: 'b', color: 'w' };
    this.board[5][0] = { type: 'b', color: 'w' };
    this.board[2][7] = { type: 'b', color: 'b' };
    this.board[5][7] = { type: 'b', color: 'b' };

    // Place Queens
    this.board[3][0] = { type: 'q', color: 'w' };
    this.board[3][7] = { type: 'q', color: 'b' };

    // Place Kings
    this.board[4][0] = { type: 'k', color: 'w', hasMoved: false };
    this.board[4][7] = { type: 'k', color: 'b', hasMoved: false };
  }

  /* ========================================================================
     THREE.JS SETUP & 3D RENDERING
     ======================================================================== */
  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0e14);
    this.scene.fog = new THREE.FogExp2(0x0b0e14, 0.035);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 7.8, 7.8);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.05; // prevent going beneath board
    this.controls.minDistance = 4;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 0, 0);

    this.setupLighting();
    this.initMaterials();
    this.buildBoard3D();
    this.rebuildAllPieces3D();

    this.scene.add(this.highlightGroup);
    this.scene.add(this.boardGroup);
    this.scene.add(this.piecesGroup);

    this.animate();
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    dirLight.position.set(6, 12, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 30;
    const d = 6;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    const blueFill = new THREE.DirectionalLight(0x00f2fe, 0.45);
    blueFill.position.set(-8, 6, -8);
    this.scene.add(blueFill);

    const centerPoint = new THREE.PointLight(0xffffff, 0.5, 12);
    centerPoint.position.set(0, 5, 0);
    this.scene.add(centerPoint);
  }

  private initMaterials() {
    this.lightSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0xdedede,
      roughness: 0.25,
      metalness: 0.1,
    });

    this.darkSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.35,
      metalness: 0.2,
    });

    this.whitePieceMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.2,
      metalness: 0.15,
    });

    this.blackPieceMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.4,
    });

    this.selectedSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
    });

    this.targetSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.65,
    });

    this.lastMoveMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.5,
    });
  }

  private coordToWorld(x: number, y: number): THREE.Vector3 {
    // Board is centered at (0,0,0). Each square is 1 unit.
    // x: 0..7 => -3.5 .. 3.5
    // y: 0..7 => 3.5 .. -3.5 (rank 1 is White side => +Z, rank 8 is Black side => -Z)
    return new THREE.Vector3(x - 3.5, 0, 3.5 - y);
  }

  private worldToCoord(pos: THREE.Vector3): BoardCoord | null {
    const x = Math.round(pos.x + 3.5);
    const y = Math.round(3.5 - pos.z);
    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      return { x, y };
    }
    return null;
  }

  private buildBoard3D() {
    this.boardGroup.clear();
    this.squareMeshes = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    // Outer wooden / obsidian frame
    const frameGeo = new THREE.BoxGeometry(9.2, 0.4, 9.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f131a,
      roughness: 0.4,
      metalness: 0.3,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.y = -0.22;
    frameMesh.receiveShadow = true;
    this.boardGroup.add(frameMesh);

    // Bevel gold rim
    const rimGeo = new THREE.BoxGeometry(8.2, 0.05, 8.2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x7928ca,
      emissive: 0x7928ca,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = -0.01;
    this.boardGroup.add(rimMesh);

    // 64 Individual Squares
    const squareGeo = new THREE.BoxGeometry(0.98, 0.15, 0.98);

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const isLight = (x + y) % 2 !== 0; // standard chess rank/file parity
        const mat = isLight ? this.lightSquareMaterial : this.darkSquareMaterial;
        const square = new THREE.Mesh(squareGeo, mat);
        const worldPos = this.coordToWorld(x, y);
        square.position.set(worldPos.x, 0, worldPos.z);
        square.receiveShadow = true;
        square.userData = { boardX: x, boardY: y };
        this.boardGroup.add(square);
        this.squareMeshes[x][y] = square;
      }
    }
  }

  /* ========================================================================
     PROCEDURAL 3D PIECES GENERATION
     ======================================================================== */
  private createPiece3D(type: PieceType, color: PieceColor): THREE.Group {
    const group = new THREE.Group();
    const mat = color === 'w' ? this.whitePieceMaterial : this.blackPieceMaterial;

    const baseGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.12, 24);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.06;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    switch (type) {
      case 'p': {
        // Pawn: Base, collar, head sphere
        const stemGeo = new THREE.CylinderGeometry(0.14, 0.24, 0.45, 18);
        const stem = new THREE.Mesh(stemGeo, mat);
        stem.position.y = 0.32;
        stem.castShadow = true;
        group.add(stem);

        const collarGeo = new THREE.TorusGeometry(0.18, 0.04, 12, 24);
        collarGeo.rotateX(Math.PI / 2);
        const collar = new THREE.Mesh(collarGeo, mat);
        collar.position.y = 0.55;
        group.add(collar);

        const headGeo = new THREE.SphereGeometry(0.18, 20, 20);
        const head = new THREE.Mesh(headGeo, mat);
        head.position.y = 0.72;
        head.castShadow = true;
        group.add(head);
        break;
      }

      case 'r': {
        // Rook: Castle wall pillar + notched crenellated crown
        const stemGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.65, 20);
        const stem = new THREE.Mesh(stemGeo, mat);
        stem.position.y = 0.44;
        stem.castShadow = true;
        group.add(stem);

        const topGeo = new THREE.CylinderGeometry(0.3, 0.26, 0.25, 20);
        const top = new THREE.Mesh(topGeo, mat);
        top.position.y = 0.85;
        top.castShadow = true;
        group.add(top);

        const crenelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
        const inner = new THREE.Mesh(
          crenelGeo,
          color === 'w' ? this.darkSquareMaterial : this.lightSquareMaterial
        );
        inner.position.y = 0.96;
        group.add(inner);
        break;
      }

      case 'n': {
        // Knight: Horse profile
        const stemGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.35, 18);
        const stem = new THREE.Mesh(stemGeo, mat);
        stem.position.y = 0.28;
        stem.castShadow = true;
        group.add(stem);

        const headGeo = new THREE.BoxGeometry(0.28, 0.46, 0.38);
        const head = new THREE.Mesh(headGeo, mat);
        head.position.set(0, 0.62, color === 'w' ? 0.06 : -0.06);
        head.rotation.x = color === 'w' ? 0.15 : -0.15;
        head.castShadow = true;
        group.add(head);

        const snoutGeo = new THREE.BoxGeometry(0.2, 0.22, 0.28);
        const snout = new THREE.Mesh(snoutGeo, mat);
        snout.position.set(0, 0.54, color === 'w' ? 0.26 : -0.26);
        snout.castShadow = true;
        group.add(snout);

        const earGeo = new THREE.ConeGeometry(0.06, 0.16, 8);
        const leftEar = new THREE.Mesh(earGeo, mat);
        leftEar.position.set(-0.09, 0.9, color === 'w' ? -0.04 : 0.04);
        group.add(leftEar);
        const rightEar = leftEar.clone();
        rightEar.position.x = 0.09;
        group.add(rightEar);
        break;
      }

      case 'b': {
        // Bishop: Slender stem, oval mitre top with finial ball
        const stemGeo = new THREE.CylinderGeometry(0.15, 0.26, 0.65, 20);
        const stem = new THREE.Mesh(stemGeo, mat);
        stem.position.y = 0.44;
        stem.castShadow = true;
        group.add(stem);

        const mitreGeo = new THREE.SphereGeometry(0.22, 20, 20);
        mitreGeo.scale(1, 1.45, 1);
        const mitre = new THREE.Mesh(mitreGeo, mat);
        mitre.position.y = 0.92;
        mitre.castShadow = true;
        group.add(mitre);

        const tipGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const tip = new THREE.Mesh(tipGeo, mat);
        tip.position.y = 1.25;
        group.add(tip);
        break;
      }

      case 'q': {
        // Queen: Flared coronet with jewel tip
        const stemGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.8, 22);
        const stem = new THREE.Mesh(stemGeo, mat);
        stem.position.y = 0.52;
        stem.castShadow = true;
        group.add(stem);

        const crownGeo = new THREE.ConeGeometry(0.34, 0.35, 16);
        crownGeo.rotateX(Math.PI);
        const crown = new THREE.Mesh(crownGeo, mat);
        crown.position.y = 1.05;
        crown.castShadow = true;
        group.add(crown);

        const jewelGeo = new THREE.SphereGeometry(0.09, 16, 16);
        const jewel = new THREE.Mesh(
          jewelGeo,
          new THREE.MeshStandardMaterial({
            color: color === 'w' ? 0x00f2fe : 0xff007f,
            emissive: color === 'w' ? 0x00f2fe : 0xff007f,
            emissiveIntensity: 0.8,
            roughness: 0.1,
          })
        );
        jewel.position.y = 1.26;
        group.add(jewel);
        break;
      }

      case 'k': {
        // King: Tallest piece, regal cross finial
        const stemGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.88, 22);
        const stem = new THREE.Mesh(stemGeo, mat);
        stem.position.y = 0.56;
        stem.castShadow = true;
        group.add(stem);

        const domeGeo = new THREE.SphereGeometry(0.28, 20, 16);
        domeGeo.scale(1, 0.8, 1);
        const dome = new THREE.Mesh(domeGeo, mat);
        dome.position.y = 1.1;
        dome.castShadow = true;
        group.add(dome);

        // Cross
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), mat);
        crossV.position.y = 1.4;
        group.add(crossV);

        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), mat);
        crossH.position.y = 1.44;
        group.add(crossH);
        break;
      }
    }

    return group;
  }

  private rebuildAllPieces3D() {
    this.piecesGroup.clear();
    this.pieceObjects.clear();

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const p = this.board[x][y];
        if (p) {
          const mesh = this.createPiece3D(p.type, p.color);
          const worldPos = this.coordToWorld(x, y);
          mesh.position.set(worldPos.x, 0.07, worldPos.z);
          mesh.userData = { boardX: x, boardY: y, piece: p };
          this.piecesGroup.add(mesh);
          this.pieceObjects.set(`${x},${y}`, mesh);
        }
      }
    }
  }

  private updateHighlights() {
    this.highlightGroup.clear();

    // Last Move marker
    if (this.lastMove) {
      const fromPos = this.coordToWorld(this.lastMove.from.x, this.lastMove.from.y);
      const toPos = this.coordToWorld(this.lastMove.to.x, this.lastMove.to.y);
      const lastGeo = new THREE.PlaneGeometry(0.96, 0.96);
      lastGeo.rotateX(-Math.PI / 2);

      const m1 = new THREE.Mesh(lastGeo, this.lastMoveMaterial);
      m1.position.set(fromPos.x, 0.08, fromPos.z);
      this.highlightGroup.add(m1);

      const m2 = new THREE.Mesh(lastGeo, this.lastMoveMaterial);
      m2.position.set(toPos.x, 0.08, toPos.z);
      this.highlightGroup.add(m2);
    }

    // Selected piece highlight
    if (this.selectedCoord) {
      const selPos = this.coordToWorld(this.selectedCoord.x, this.selectedCoord.y);
      const selRingGeo = new THREE.RingGeometry(0.28, 0.45, 32);
      selRingGeo.rotateX(-Math.PI / 2);
      const selRing = new THREE.Mesh(selRingGeo, this.selectedSquareMaterial);
      selRing.position.set(selPos.x, 0.085, selPos.z);
      this.highlightGroup.add(selRing);
    }

    // Legal move targets
    for (const move of this.validMoves) {
      const targetPos = this.coordToWorld(move.x, move.y);
      const isCapture = this.board[move.x][move.y] !== null;

      if (isCapture) {
        // Red target ring for captures
        const ringGeo = new THREE.RingGeometry(0.32, 0.44, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xff3b30,
          transparent: true,
          opacity: 0.85,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(targetPos.x, 0.085, targetPos.z);
        this.highlightGroup.add(ring);
      } else {
        // Emerald green dot for peaceful moves
        const dotGeo = new THREE.CircleGeometry(0.16, 24);
        dotGeo.rotateX(-Math.PI / 2);
        const dotMat = new THREE.MeshBasicMaterial({
          color: 0x00ff88,
          transparent: true,
          opacity: 0.8,
        });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(targetPos.x, 0.085, targetPos.z);
        this.highlightGroup.add(dot);
      }
    }
  }

  private clearHighlights() {
    this.highlightGroup.clear();
  }

  /* ========================================================================
     MOUSE INTERACTION & CLICK HANDLER
     ======================================================================== */
  onCanvasClick(event: MouseEvent) {
    if (this.isThinking || this.isGameOver || this.turn !== this.playerColor) {
      return;
    }

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

    this.raycaster.setFromCamera(this.pointer, this.camera);

    // Intersect board squares
    const squareIntersects = this.raycaster.intersectObjects(
      this.boardGroup.children,
      true
    );

    if (squareIntersects.length > 0) {
      for (const hit of squareIntersects) {
        if (hit.object.userData && hit.object.userData['boardX'] !== undefined) {
          const x = hit.object.userData['boardX'];
          const y = hit.object.userData['boardY'];
          this.handleSquareClick(x, y);
          return;
        }
      }
    }
  }

  private handleSquareClick(x: number, y: number) {
    const clickedPiece = this.board[x][y];

    // If already selected a piece, check if the clicked square is a valid target move
    if (this.selectedCoord) {
      const isTarget = this.validMoves.some((m) => m.x === x && m.y === y);
      if (isTarget) {
        this.executeMove({
          from: this.selectedCoord,
          to: { x, y },
          piece: this.board[this.selectedCoord.x][this.selectedCoord.y]!,
        });
        this.selectedCoord = null;
        this.validMoves = [];
        this.updateHighlights();
        return;
      }
    }

    // Otherwise, select piece if it matches the current player's color
    if (clickedPiece && clickedPiece.color === this.turn) {
      this.selectedCoord = { x, y };
      this.validMoves = this.getLegalMoves({ x, y });
      this.updateHighlights();
    } else {
      this.selectedCoord = null;
      this.validMoves = [];
      this.updateHighlights();
    }
    this.cdr.detectChanges();
  }

  /* ========================================================================
     MOVE EXECUTION & 3D PIECE ANIMATION
     ======================================================================== */
  private executeMove(move: Move, isAIMove = false) {
    const { from, to, piece } = move;
    const captured = this.board[to.x][to.y];

    // Update board data
    this.board[to.x][to.y] = { ...piece, hasMoved: true };
    this.board[from.x][from.y] = null;

    // Promotion (Pawn reaches opposite rank)
    if (piece.type === 'p' && (to.y === 7 || to.y === 0)) {
      this.board[to.x][to.y]!.type = 'q'; // auto-queen promotion
    }

    // Record captured pieces
    if (captured) {
      if (captured.color === 'b') {
        this.capturedByWhite.push(captured);
      } else {
        this.capturedByBlack.push(captured);
      }
    }

    // Generate SAN notation (e.g. e4, Nf3, Bxe5)
    const san = this.formatMoveSAN(move, captured);
    if (piece.color === 'w') {
      this.moveHistory.push({ white: san });
    } else {
      if (this.moveHistory.length > 0 && !this.moveHistory[this.moveHistory.length - 1].black) {
        this.moveHistory[this.moveHistory.length - 1].black = san;
      } else {
        this.moveHistory.push({ white: '...', black: san });
      }
    }

    this.lastMove = { from, to };

    // Animate 3D Piece Translation
    this.animatePieceMove(from, to, () => {
      // Switch Turn
      this.turn = this.turn === 'w' ? 'b' : 'w';
      this.isCheck = this.isInCheck(this.turn);

      const hasMoves = this.hasAnyLegalMoves(this.turn);
      if (!hasMoves) {
        this.isGameOver = true;
        if (this.isCheck) {
          const winner = this.turn === 'w' ? 'Black' : 'White';
          this.gameStatusText = `Checkmate! ${winner} wins! 🏆`;
        } else {
          this.gameStatusText = 'Draw by Stalemate! 🤝';
        }
      } else {
        const turnName = this.turn === 'w' ? 'White' : 'Black';
        this.gameStatusText = `${turnName} to move${this.isCheck ? ' (Check!)' : ''}`;

        // Trigger AI if it's the AI's turn
        if (this.turn !== this.playerColor && !this.isGameOver) {
          this.triggerAIMove();
        }
      }

      this.updateHighlights();
      this.cdr.detectChanges();
    });
  }

  private animatePieceMove(from: BoardCoord, to: BoardCoord, onComplete: () => void) {
    const fromKey = `${from.x},${from.y}`;
    const toKey = `${to.x},${to.y}`;
    const mesh = this.pieceObjects.get(fromKey);

    if (!mesh) {
      this.rebuildAllPieces3D();
      onComplete();
      return;
    }

    // Remove captured mesh from 3D scene if present
    const capturedMesh = this.pieceObjects.get(toKey);
    if (capturedMesh) {
      this.piecesGroup.remove(capturedMesh);
      this.pieceObjects.delete(toKey);
    }

    this.pieceObjects.delete(fromKey);
    this.pieceObjects.set(toKey, mesh);
    mesh.userData['boardX'] = to.x;
    mesh.userData['boardY'] = to.y;

    const startPos = this.coordToWorld(from.x, from.y);
    const endPos = this.coordToWorld(to.x, to.y);

    const startTime = performance.now();
    const duration = 280; // ms

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth ease-out quad
      const ease = 1 - Math.pow(1 - progress, 2);

      mesh.position.x = THREE.MathUtils.lerp(startPos.x, endPos.x, ease);
      mesh.position.z = THREE.MathUtils.lerp(startPos.z, endPos.z, ease);
      // Small vertical leap arc while moving
      mesh.position.y = 0.07 + Math.sin(progress * Math.PI) * 0.45;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        mesh.position.set(endPos.x, 0.07, endPos.z);
        // If pawn promoted, replace 3D mesh
        const piece = this.board[to.x][to.y];
        if (piece && piece.type === 'q' && (to.y === 7 || to.y === 0)) {
          this.piecesGroup.remove(mesh);
          const queenMesh = this.createPiece3D('q', piece.color);
          queenMesh.position.set(endPos.x, 0.07, endPos.z);
          queenMesh.userData = { boardX: to.x, boardY: to.y, piece };
          this.piecesGroup.add(queenMesh);
          this.pieceObjects.set(toKey, queenMesh);
        }
        onComplete();
      }
    };

    requestAnimationFrame(step);
  }

  /* ========================================================================
     CHESS RULES & MOVE GENERATION ENGINE
     ======================================================================== */
  private getLegalMoves(coord: BoardCoord): BoardCoord[] {
    const rawMoves = this.getPseudoLegalMoves(coord, this.board);
    // Filter out moves that leave the King in check
    return rawMoves.filter((m) => {
      const simulatedBoard = this.cloneBoard(this.board);
      const piece = simulatedBoard[coord.x][coord.y]!;
      simulatedBoard[m.x][m.y] = { ...piece };
      simulatedBoard[coord.x][coord.y] = null;
      return !this.isBoardInCheck(simulatedBoard, piece.color);
    });
  }

  private getPseudoLegalMoves(coord: BoardCoord, b: (ChessPiece | null)[][]): BoardCoord[] {
    const piece = b[coord.x][coord.y];
    if (!piece) return [];
    const moves: BoardCoord[] = [];
    const color = piece.color;
    const opponent = color === 'w' ? 'b' : 'w';

    const addMove = (x: number, y: number): boolean => {
      if (x < 0 || x > 7 || y < 0 || y > 7) return false;
      const target = b[x][y];
      if (!target) {
        moves.push({ x, y });
        return true; // continue sliding
      }
      if (target.color === opponent) {
        moves.push({ x, y });
      }
      return false; // hit obstacle, stop sliding
    };

    switch (piece.type) {
      case 'p': {
        const dir = color === 'w' ? 1 : -1;
        const startRank = color === 'w' ? 1 : 6;

        // 1 square forward
        if (b[coord.x][coord.y + dir] === null) {
          moves.push({ x: coord.x, y: coord.y + dir });
          // 2 squares from start rank
          if (coord.y === startRank && b[coord.x][coord.y + 2 * dir] === null) {
            moves.push({ x: coord.x, y: coord.y + 2 * dir });
          }
        }

        // Diagonal captures
        for (const dx of [-1, 1]) {
          const cx = coord.x + dx;
          const cy = coord.y + dir;
          if (cx >= 0 && cx < 8 && cy >= 0 && cy < 8) {
            if (b[cx][cy] && b[cx][cy]!.color === opponent) {
              moves.push({ x: cx, y: cy });
            }
          }
        }
        break;
      }

      case 'n': {
        const jumps = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2],  [1, 2],  [2, -1],  [2, 1],
        ];
        for (const [dx, dy] of jumps) {
          addMove(coord.x + dx, coord.y + dy);
        }
        break;
      }

      case 'b': {
        const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dx, dy] of dirs) {
          let cx = coord.x + dx;
          let cy = coord.y + dy;
          while (addMove(cx, cy)) {
            cx += dx;
            cy += dy;
          }
        }
        break;
      }

      case 'r': {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dx, dy] of dirs) {
          let cx = coord.x + dx;
          let cy = coord.y + dy;
          while (addMove(cx, cy)) {
            cx += dx;
            cy += dy;
          }
        }
        break;
      }

      case 'q': {
        const dirs = [
          [-1, -1], [-1, 1], [1, -1], [1, 1],
          [-1, 0],  [1, 0],  [0, -1], [0, 1],
        ];
        for (const [dx, dy] of dirs) {
          let cx = coord.x + dx;
          let cy = coord.y + dy;
          while (addMove(cx, cy)) {
            cx += dx;
            cy += dy;
          }
        }
        break;
      }

      case 'k': {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx !== 0 || dy !== 0) {
              addMove(coord.x + dx, coord.y + dy);
            }
          }
        }
        break;
      }
    }

    return moves;
  }

  private isBoardInCheck(b: (ChessPiece | null)[][], kingColor: PieceColor): boolean {
    // Find king position
    let kx = -1, ky = -1;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const p = b[x][y];
        if (p && p.type === 'k' && p.color === kingColor) {
          kx = x;
          ky = y;
          break;
        }
      }
      if (kx !== -1) break;
    }
    if (kx === -1) return true; // king captured

    // Check if any opponent piece can attack (kx, ky)
    const opponent = kingColor === 'w' ? 'b' : 'w';
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const p = b[x][y];
        if (p && p.color === opponent) {
          const attacks = this.getPseudoLegalMoves({ x, y }, b);
          if (attacks.some((m) => m.x === kx && m.y === ky)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private isInCheck(color: PieceColor): boolean {
    return this.isBoardInCheck(this.board, color);
  }

  private hasAnyLegalMoves(color: PieceColor): boolean {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const p = this.board[x][y];
        if (p && p.color === color) {
          if (this.getLegalMoves({ x, y }).length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private getAllLegalMovesForColor(color: PieceColor): Move[] {
    const allMoves: Move[] = [];
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const p = this.board[x][y];
        if (p && p.color === color) {
          const targets = this.getLegalMoves({ x, y });
          for (const to of targets) {
            allMoves.push({
              from: { x, y },
              to,
              piece: p,
              captured: this.board[to.x][to.y],
            });
          }
        }
      }
    }
    return allMoves;
  }

  private cloneBoard(b: (ChessPiece | null)[][]): (ChessPiece | null)[][] {
    return b.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  }

  private formatMoveSAN(move: Move, captured: ChessPiece | null): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const pType = move.piece.type.toUpperCase();
    const dest = `${files[move.to.x]}${move.to.y + 1}`;

    if (move.piece.type === 'p') {
      if (captured) {
        return `${files[move.from.x]}x${dest}`;
      }
      return dest;
    }
    const capStr = captured ? 'x' : '';
    return `${pType}${capStr}${dest}`;
  }

  private replayMovesUpTo(count: number) {
    this.initBoardState();
    this.turn = 'w';
    this.capturedByWhite = [];
    this.capturedByBlack = [];
    this.isGameOver = false;

    // Collect all played SANs
    const allSans: string[] = [];
    for (const r of this.moveHistory) {
      if (r.white && r.white !== '...') allSans.push(r.white);
      if (r.black) allSans.push(r.black);
    }

    const trimmedSans = allSans.slice(0, count);
    this.moveHistory = [];

    // Replay
    for (let i = 0; i < trimmedSans.length; i++) {
      const colorToPlay: PieceColor = i % 2 === 0 ? 'w' : 'b';
      const moves = this.getAllLegalMovesForColor(colorToPlay);
      // match SAN or fallback
      const m = moves.find((cand) => this.formatMoveSAN(cand, cand.captured || null) === trimmedSans[i]);
      if (m) {
        this.board[m.to.x][m.to.y] = { ...m.piece, hasMoved: true };
        this.board[m.from.x][m.from.y] = null;
        if (m.captured) {
          if (m.captured.color === 'b') this.capturedByWhite.push(m.captured);
          else this.capturedByBlack.push(m.captured);
        }
        if (colorToPlay === 'w') {
          this.moveHistory.push({ white: trimmedSans[i] });
        } else {
          this.moveHistory[this.moveHistory.length - 1].black = trimmedSans[i];
        }
      }
    }

    this.turn = count % 2 === 0 ? 'w' : 'b';
    this.isCheck = this.isInCheck(this.turn);
    this.gameStatusText = `${this.turn === 'w' ? 'White' : 'Black'} to move`;
    this.rebuildAllPieces3D();
    this.clearHighlights();
  }

  /* ========================================================================
     AI ENGINE: MINIMAX WITH ALPHA-BETA PRUNING & HEURISTICS
     ======================================================================== */
  private triggerAIMove() {
    this.isThinking = true;
    this.gameStatusText = 'AI is calculating move... 🧠';
    this.cdr.detectChanges();

    // Async delay to let UI render and simulate real cognitive computation
    setTimeout(() => {
      const bestMove = this.calculateBestAIMove();
      this.isThinking = false;

      if (bestMove) {
        this.executeMove(bestMove, true);
      } else {
        this.isGameOver = true;
        this.gameStatusText = 'Game Over';
      }
      this.cdr.detectChanges();
    }, 450);
  }

  private calculateBestAIMove(): Move | null {
    const aiColor = this.turn;
    const moves = this.getAllLegalMovesForColor(aiColor);
    if (moves.length === 0) return null;

    // Easy / Casual difficulty: 70% evaluation, 30% random
    if (this.aiDifficulty === 'easy') {
      if (Math.random() < 0.35) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
      return this.findGreedyBestMove(moves, aiColor);
    }

    // Medium: Minimax depth 2 with piece-square tables
    if (this.aiDifficulty === 'medium') {
      let bestMove = moves[0];
      let bestVal = -Infinity;

      for (const m of moves) {
        const boardCopy = this.cloneBoard(this.board);
        boardCopy[m.to.x][m.to.y] = { ...m.piece, hasMoved: true };
        boardCopy[m.from.x][m.from.y] = null;

        const score = -this.minimax(boardCopy, 2, -Infinity, Infinity, aiColor === 'w' ? 'b' : 'w');
        if (score > bestVal) {
          bestVal = score;
          bestMove = m;
        }
      }
      return bestMove;
    }

    // Hard / Master: Minimax depth 3 with move ordering (captures first) & PST
    let bestMove = moves[0];
    let bestVal = -Infinity;

    // Sort moves: high-value captures first for better alpha-beta pruning cutoffs
    moves.sort((a, b) => {
      const valA = a.captured ? PIECE_VALUES[a.captured.type] : 0;
      const valB = b.captured ? PIECE_VALUES[b.captured.type] : 0;
      return valB - valA;
    });

    for (const m of moves) {
      const boardCopy = this.cloneBoard(this.board);
      boardCopy[m.to.x][m.to.y] = { ...m.piece, hasMoved: true };
      boardCopy[m.from.x][m.from.y] = null;

      const score = -this.minimax(boardCopy, 3, -Infinity, Infinity, aiColor === 'w' ? 'b' : 'w');
      if (score > bestVal) {
        bestVal = score;
        bestMove = m;
      }
    }
    return bestMove;
  }

  private findGreedyBestMove(moves: Move[], color: PieceColor): Move {
    let bestMove = moves[0];
    let bestVal = -Infinity;
    for (const m of moves) {
      const boardCopy = this.cloneBoard(this.board);
      boardCopy[m.to.x][m.to.y] = { ...m.piece, hasMoved: true };
      boardCopy[m.from.x][m.from.y] = null;
      const score = this.evaluateBoard(boardCopy, color);
      if (score > bestVal) {
        bestVal = score;
        bestMove = m;
      }
    }
    return bestMove;
  }

  private minimax(
    b: (ChessPiece | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    color: PieceColor
  ): number {
    if (depth === 0) {
      return this.evaluateBoard(b, color);
    }

    const opponent = color === 'w' ? 'b' : 'w';
    const moves: Move[] = [];

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const p = b[x][y];
        if (p && p.color === color) {
          const raw = this.getPseudoLegalMoves({ x, y }, b);
          for (const to of raw) {
            const nextB = this.cloneBoard(b);
            nextB[to.x][to.y] = { ...p, hasMoved: true };
            nextB[x][y] = null;
            if (!this.isBoardInCheck(nextB, color)) {
              moves.push({ from: { x, y }, to, piece: p, captured: b[to.x][to.y] });
            }
          }
        }
      }
    }

    if (moves.length === 0) {
      if (this.isBoardInCheck(b, color)) {
        return -25000 + (3 - depth) * 100; // Checkmate penalty
      }
      return 0; // Stalemate
    }

    let maxEval = -Infinity;
    for (const m of moves) {
      const nextB = this.cloneBoard(b);
      nextB[m.to.x][m.to.y] = { ...m.piece, hasMoved: true };
      nextB[m.from.x][m.from.y] = null;

      const evalScore = -this.minimax(nextB, depth - 1, -beta, -alpha, opponent);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (alpha >= beta) {
        break; // Alpha-beta cutoff
      }
    }
    return maxEval;
  }

  private evaluateBoard(b: (ChessPiece | null)[][], povColor: PieceColor): number {
    let score = 0;

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const p = b[x][y];
        if (!p) continue;

        let pieceScore = PIECE_VALUES[p.type];
        // Positional score based on Piece-Square Tables (PST)
        // Flip y for black
        const pstIndex = p.color === 'w' ? (7 - y) * 8 + x : y * 8 + x;

        switch (p.type) {
          case 'p':
            pieceScore += PAWN_PST[pstIndex] || 0;
            break;
          case 'n':
            pieceScore += KNIGHT_PST[pstIndex] || 0;
            break;
          case 'b':
            pieceScore += BISHOP_PST[pstIndex] || 0;
            break;
          case 'r':
            pieceScore += ROOK_PST[pstIndex] || 0;
            break;
          case 'q':
            pieceScore += QUEEN_PST[pstIndex] || 0;
            break;
          case 'k':
            pieceScore += KING_MID_PST[pstIndex] || 0;
            break;
        }

        if (p.color === povColor) {
          score += pieceScore;
        } else {
          score -= pieceScore;
        }
      }
    }
    return score;
  }

  /* ========================================================================
     ANIMATION LOOP & RESIZE
     ======================================================================== */
  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    if (this.controls) {
      this.controls.update();
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  @HostListener('window:resize')
  onResize() {
    if (!this.containerRef || !this.renderer || !this.camera) return;
    const width = this.containerRef.nativeElement.clientWidth || window.innerWidth;
    const height = this.containerRef.nativeElement.clientHeight || window.innerHeight;

    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  ngOnDestroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
