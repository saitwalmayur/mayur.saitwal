import { Routes } from '@angular/router';
import { HomeScreen } from './home-screen/home-screen';
import { GamingProjects } from './gaming-projects/gaming-projects';
import { ContactScreen } from './contact-screen/contact-screen';
import { ExperienceScreen } from './experience-screen/experience-screen';

export const routes: Routes = [
  { path: '', component: HomeScreen },
  { path: 'experience', component: ExperienceScreen },
  { path: 'projects', component: GamingProjects },
  { path: 'contact', component: ContactScreen },
];
