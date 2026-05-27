import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GameLink {
  label: string;
  url: string;
  type: 'store' | 'website' | 'detail' | 'apple';
}

export interface Game {
  name: string;
  imageUrl?: string;
  links: GameLink[];
  techStack?: string;
  details?: string;
}

export interface Experience {
  company: string;
  role: string;
  location: string;
  duration: string;
  bullets: string[];
  games: Game[];
}

@Component({
  selector: 'app-experience-screen',
  imports: [CommonModule],
  templateUrl: './experience-screen.html',
  styleUrl: './experience-screen.scss',
})
export class ExperienceScreen {
  selectedGame: Game | null = null;

  experiences: Experience[] = [
    {
      company: 'NetConnect Global',
      role: 'Senior Software Engineer',
      location: 'Mumbai',
      duration: '01/2026 – Present',
      bullets: [
        'Enhanced interactive 3D planogram solutions for retail visualization for AB InBev, improving merchandising planning efficiency and reducing manual store setup efforts.',
        'Expanded configurable fixture creation and product positioning systems enabling accurate real-world retail layout simulations.',
        'Optimized real-time 3D rendering and scene performance for large-scale store environments, ensuring smooth user experiences.',
        'Collaborated with business and technical teams to transform retail requirements into scalable visualization tools, helping reduce operational and merchandising costs.'
      ],
      games: []
    },
    {
      company: 'Dreambridge',
      role: 'Senior Interaction Developer',
      location: 'Mumbai',
      duration: '04/2024 – 01/2026',
      bullets: [
        'Led the development of an Apple Vision Pro application for TCS, focusing on spatial computing. The project was recognized with two Gold awards at the NY Digital Awards.',
        'Led and mentored cross-functional teams in the design and deployment of enterprise AR/VR platforms, ensuring scalability, security, and performance across multiple devices.',
        'Drove AI-powered innovations (real-time image recognition) that elevated product adoption and transformed customer engagement for museum App.',
        'Delivered an event management system for Walmart with seamless UX and backend communication.',
        'Developed with Angular and Three.js an interactive CNC machine 3D part visualization platform that allows users to inspect components, view machine details, purchase parts, and manage spare-part procurement'
      ],
      games: [
        {
          name: 'Digital Twin',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/applevision.png',
          links: [
            { label: 'Detail', url: 'https://www.linkedin.com/posts/tata-consultancy-services-north-america_tcsnycmarathon-runwithtcs-runwithtcsinnyc-ugcPost-7258484777668743169-vD4l/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAduOT4BroteUiiLGXBzeJpj6T4oXuEQ0VY', type: 'detail' }
          ],
          techStack: 'Photoshop, Unity, C#, Blender, Xcode'
        },
        {
          name: 'CNC Machine',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/applevision.png',
          links: [
            { label: 'Detail', url: 'https://www.linkedin.com/posts/thapasjoseph_augmentedreality-virtualreality-spatialcomputing-activity-7295082810858524673-hpVv?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAduOT4BroteUiiLGXBzeJpj6T4oXuEQ0VY', type: 'detail' }
          ],
          techStack: 'Photoshop, Unity, C#, Blender, Xcode'
        }
      ]
    },
    {
      company: 'Tapmyads Technologies LTD',
      role: 'Senior Software Developer',
      location: 'Mumbai',
      duration: '12/2019 – 04/2024',
      bullets: [
        'Led the design and development of multiplayer games using Photon and Nakama, delivering scalable real-time gameplay experiences.',
        'Incorporated PlayFab services for player profiles, inventory systems, and progression tracking, improving player retention and backend scalability.',
        'Built cross-platform 3D applications using Unity, Unreal Engine, React Native, and Three.js for Android, iOS, WebGL, and desktop deployments.',
        'Streamlined CI/CD pipelines and project delivery workflows using Azure DevOps and Git-based version control systems, improving collaboration and release efficiency.',
        'Developed custom shaders and rendering systems across Unity, Unreal Engine, and SceneKit, enhancing visual quality and gameplay immersion.',
        'Integrated RESTful APIs and third-party SDKs to enable dynamic content delivery, analytics, monetization, and live game features.',
        'Created deployment packages for mobile platforms using Android Studio and Xcode, ensuring stable releases and platform compliance.'
      ],
      games: [
        {
          name: 'Avataryug',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/AYlogo.webp',
          links: [
            { label: 'Detail', url: 'https://avataryug.com/showcase', type: 'website' }
          ],
          techStack: 'Photoshop, Unity, C#, Rest API, Unreal Engine,Angular,Scenekit,swift,Android studio,Python,Blender'
        },
        {
          name: 'Pool Royale',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/poolroyale.png',
          links: [
            { label: 'Detail', url: 'https://pool-royale-5r7.en.softonic.com/android?ex=RAMP-3507.3&rex=true', type: 'store' }
          ],
          techStack: 'Photoshop, Unity, C#, Playfab, Photon,'
        },
        {
          name: 'Billiards Pool Arena',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/8ballarena.png',
          links: [
            { label: 'Detail', url: 'https://billiards-pool-arena.en.softonic.com/android?ex=RAMP-3507.3&rex=true', type: 'store' }
          ],
          techStack: 'Photoshop, Unity, C#, Rest API, Photon,'
        }
      ]
    },
    {
      company: 'Eduisfun Technology',
      role: 'Senior Game Developer',
      location: 'Mumbai',
      duration: '05/2019 – 11/2019',
      bullets: [
        'Designed and developed interactive educational games using Unity3D, improving student engagement and learning experiences.',
        'Incorporated REST API integrations that enabled real-time data synchronization across mobile platforms, improving backend communication efficiency and reducing sync issues.',
        'Coordinated sprint planning and project tracking using JIRA, achieving consistent on-time feature delivery and content updates.',
        'Worked closely with design and backend teams to optimize application usability and performance.'
      ],
      games: [
        {
          name: 'StepApp',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/stepapp.webp',
          links: [
            { label: 'Detail', url: 'https://play.google.com/store/apps/details?id=com.EduIsFun.EduIsFun&hl=en_IN', type: 'store' }
          ]
        }
      ]
    },
    {
      company: 'Day Dreamz Studio',
      role: 'Senior Game Developer',
      location: 'Hyderabad',
      duration: '06/2017 – 04/2019',
      bullets: [
        'Delivered 50+ hyper-casual Unity games, generating 100K+ organic downloads and expanding audience reach.',
        'Implemented AI-driven NPC systems and gameplay mechanics, increasing player engagement and interaction.',
        'Streamlined gameplay systems using Unity DOTS and performance-focused architecture, improving runtime efficiency on mobile devices.',
        'Expanded monetization strategies through IAPs, analytics, OneSignal, and third-party SDK integrations, increasing ARPU across multiple titles.',
        'Published reusable Unity tools and plugins on the Unity Asset Store, creating additional revenue opportunities for the studio.',
        'Collaborated with artists and designers to deliver polished gameplay experiences within tight deadlines.'
      ],
      games: [
        { name: 'Snake Ballz 2', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Snake-Ballz-2/dp/B075D4YHJZ', type: 'store' }] },
        { name: 'Thirsty Vampire', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Thirsty-Vampire/dp/B073WWYBBD', type: 'store' }] },
        { name: 'Angry Shark Racing', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Angry-Shark-Racing/dp/B0751CJ8X8', type: 'store' }] },
        { name: 'Klear', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Klear/dp/B0756WSSRX', type: 'store' }] },
        { name: 'Flotus', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Flotus/dp/B074DWZGCQ', type: 'store' }] },
        { name: 'Wave Racer', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Wave-Racer/dp/B07517JT9M', type: 'store' }] },
        { name: 'Kung Fu Dancer', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Kung-Fu-Dancer/dp/B073SRW7W4', type: 'store' }] },
        { name: 'Talking Santa Gifts', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Talking-Santa-Gifts/dp/B0752PCQ99', type: 'store' }] },
        { name: 'Dragon Trials', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Dragon-Trials/dp/B072XQ6DXQ', type: 'store' }] },
        { name: 'Stickman Apple Shooter', links: [{ label: 'Detail', url: 'https://www.amazon.com/DayDreamz-Studio-Stickman-Apple-Shooter/dp/B0756VV9ZB', type: 'store' }] }
      ]
    },
    {
      company: 'Ace Games',
      role: 'Junior Game Developer',
      location: 'Hyderabad',
      duration: '06/2015 – 05/2017',
      bullets: [
        'Built reusable Unity C# frameworks and modular gameplay systems, reducing feature development time by 50%.',
        'Developed character controllers, UI systems, and gameplay mechanics, improving player experience and usability.',
        'Integrated monetization SDKs including AdMob and Chartboost, enabling stable ad-based revenue generation.',
        'Assisted in publishing games across Android, iOS, and Windows platforms while ensuring app store compliance and deployment readiness.',
        'Supported debugging, optimization, and QA processes to improve game stability and performance.'
      ],
      games: [
        { name: 'Nano Ninja Jump', links: [{ label: 'Detail', url: 'https://assetstore.unity.com/packages/templates/nano-ninja-jump-67653', type: 'website' }] },
        { name: 'Cycle Stunts', links: [{ label: 'Detail', url: 'https://assetstore.unity.com/packages/templates/cycle-stunts-88274', type: 'website' }] },
        { name: 'Bottle Shooter', links: [{ label: 'Detail', url: 'https://assetstore.unity.com/packages/templates/bottle-shooter-89934', type: 'website' }] },
        { name: 'Ace Bike Stunts', links: [{ label: 'Detail', url: 'https://assetstore.unity.com/packages/templates/ace-bike-stunts-88565', type: 'website' }] },
        { name: 'Ace Fighter', links: [{ label: 'Detail', url: 'https://assetstore.unity.com/packages/templates/ace-fighter-88101', type: 'website' }] },
        { name: 'Krishna Murari Run', links: [{ label: 'Detail', url: 'https://krishna-murari-run.en.softonic.com/android', type: 'store' }] },
        { name: 'Strike A Can', links: [{ label: 'Detail', url: 'https://strike-a-can.en.softonic.com/android', type: 'store' }] },
        { name: 'City Hot Wheels Racer', links: [{ label: 'Detail', url: 'https://city-hot-wheels-racer.en.softonic.com/android', type: 'store' }] },
        { name: 'Jet Boat Rush', links: [{ label: 'Detail', url: 'https://jet-boat-rush.en.softonic.com/android', type: 'store' }] },
        { name: 'Rocket Escape', links: [{ label: 'Detail', url: 'https://assetstore.unity.com/packages/templates/rocket-escape-78174', type: 'website' }] }
      ]
    }
  ];

  openInfo(game: Game) {
    this.selectedGame = game;
  }

  closeInfo() {
    this.selectedGame = null;
  }
}
