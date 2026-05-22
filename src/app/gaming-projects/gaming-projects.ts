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
  selector: 'app-gaming-projects',
  imports: [CommonModule],
  templateUrl: './gaming-projects.html',
  styleUrl: './gaming-projects.scss',
})
export class GamingProjects {
  activeTab: 'office' | 'personal' = 'office';

  get currentExperiences(): Experience[] {
    return this.activeTab === 'office' ? this.officeExperiences : this.personalExperiences;
  }

  officeExperiences: Experience[] = [
    {
      company: 'Dreambridge',
      role: 'Senior Interaction Developer',
      location: 'Mumbai',
      duration: 'Apr 2024 - Present',
      bullets: [
        'Led development of an Apple Vision Pro spatial computing app for TCS, awarded 2 Golds at NY Digital Awards.',
        'Built immersive AR/VR applications with cross-platform support and AI-based image recognition.',
        'Implemented real-time multi-user interactions in Apple Vision Pro using Photon and Unity.'
      ],
      games: [
        {
          name: 'Digital Twin',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/applevision.png',
          links: [
            { label: 'Detail', url: 'https://www.linkedin.com/posts/tata-consultancy-services-north-america_tcsnycmarathon-runwithtcs-runwithtcsinnyc-ugcPost-7258484777668743169-vD4l/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAduOT4BroteUiiLGXBzeJpj6T4oXuEQ0VY', type: 'detail' }
          ]
        },
        {
          name: 'CNC Machine',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/applevision.png',
          links: [
            { label: 'Detail', url: 'https://www.linkedin.com/posts/thapasjoseph_augmentedreality-virtualreality-spatialcomputing-activity-7295082810858524673-hpVv?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAduOT4BroteUiiLGXBzeJpj6T4oXuEQ0VY', type: 'detail' }
          ]
        }
      ]
    },
    {
      company: 'Tapmyads Technologies LTD',
      role: 'Sr. Game Developer',
      location: 'Mumbai',
      duration: 'Dec 2019 - Apr 2024',
      bullets: [
        'Led design and development of multiplayer games using Photon and Nakama for seamless online experiences.',
        'Owned technical projects, including component design, development, and maintenance.',
        'Managed game data with PlayFab, handling player profiles, inventory, and progression.',
        'Developed 3D applications across multiple platforms (Xcode, Android Studio, Unreal Engine, Three.js, React Native).',
        'Streamlined project delivery and QA using Azure DevOps and version control tools (SourceTree, GitHub, BitBucket) for efficient collaboration.',
        'Enhanced visuals with custom shaders across engines (Unity, Unreal Engine) and integrated RESTful APIs for dynamic content.',
        'Created deployment packages (Swift, Android Studio) and extended functionality using plugins in Unity and Unreal Engine.'
      ],
      games: [
        {
          name: 'Avataryug',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/AYlogo.webp',
          links: [
            { label: 'Detail', url: 'https://avataryug.com/showcase', type: 'website' }
          ]
        },
        {
          name: 'Pool Royale',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/poolroyale.png',
          links: [
            { label: 'Detail', url: 'https://pool-royale-5r7.en.softonic.com/android?ex=RAMP-3507.3&rex=true', type: 'store' }
          ]
        },
        {
          name: 'Billiards Pool Arena',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/8ballarena.png',
          links: [
            { label: 'Detail', url: 'https://billiards-pool-arena.en.softonic.com/android?ex=RAMP-3507.3&rex=true', type: 'store' }
          ]
        }
      ]
    },
    {
      company: 'Eduisfun Technology',
      role: 'Sr. Game Developer',
      location: 'Mumbai',
      duration: 'May 2019 - Nov 2019',
      bullets: [
        'Developed educational games in Unity3D, enabling interactive learning experiences.',
        'Integrated REST APIs for data exchange with external servers.',
        'Managed project tasks using JIRA.'
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
      role: 'Sr. Game Developer',
      location: 'Hyderabad',
      duration: 'Jun 2017 - Apr 2019',
      bullets: [
        'Independently developed multiple hyper-casual games from concept to launch, demonstrating end-to-end expertise in game design, development, and delivery.',
        'Implemented AI features in game characters, enhancing gameplay complexity and user interaction.',
        'Championed coding standards and best practices, ensuring maintainable and high-quality code.',
        'Integrated diverse plugins (In-App Purchase, OneSignal, Facebook, Google Play Services, Analytics, Firebase) to expand game functionalities and monetization.',
        'Contributed to testing and QA, ensuring high-quality releases that meet industry standards.',
        'Deployed Unity games on the Unity Asset Store, generating potential additional revenue streams.'
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
      role: 'Jr. Game Developer',
      location: 'Hyderabad',
      duration: 'Jun 2015 - May 2017',
      bullets: [
        'Developed reusable C# frameworks for Unity3D, accelerating game development workflows.',
        'Designed and implemented character controllers to enhance gameplay and player experience.',
        'Built and integrated UI systems, menus, and core game functionalities for smooth player interaction.',
        'Integrated monetization plugins (AdMob, Chartboost), boosting game revenue.',
        'Managed game publishing on Android and Windows, ensuring successful launches.'
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

  personalExperiences: Experience[] = [
    {
      company: 'Extra Work',
      role: 'Indie Game Developer',
      location: 'Remote',
      duration: '',
      bullets: [],
      games: [
        {
          name: '3D Fill',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/fill3d.png',
          links: [
            { label: 'Detail', url: 'https://play.google.com/store/apps/details?id=com.EduIsFun.EduIsFun&pli=1', type: 'store' }
          ]
        },
        {
          name: 'Step Box',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/stepbox.png',
          links: [
            { label: 'Detail', url: 'https://www.gamepix.com/play/step-box', type: 'website' }
          ]
        },
        {
          name: 'Impossible Bump Ball',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/impo.png',
          links: [
            { label: 'Detail', url: 'https://www.gamepix.com/play/impossible-bump-ball', type: 'website' }
          ]
        },
        {
          name: 'Snake Color',
          imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/snakecolor.png',
          links: [
            { label: 'Detail', url: 'https://www.gamepix.com/play/snake-color', type: 'website' }
          ]
        }
      ]
    }
  ];
}
