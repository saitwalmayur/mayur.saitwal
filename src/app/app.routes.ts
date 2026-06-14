import { Routes } from '@angular/router';
import { HomeScreen } from './home-screen/home-screen';
import { ContactScreen } from './contact-screen/contact-screen';
import { ExperienceScreen } from './experience-screen/experience-screen';
import { Projects } from './projects/projects';
import { Showcase } from './showcase/showcase';

export const routes: Routes = [
  { path: '', component: HomeScreen },
  { path: 'experience', component: ExperienceScreen },
  { path: 'projects', component: Projects },
  { path: 'showcase', component: Showcase },
  { path: 'contact', component: ContactScreen },
];

