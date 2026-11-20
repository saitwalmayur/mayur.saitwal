import { Component } from '@angular/core';
import { GearboxViewerComponent } from '../gearbox-viewer/gearbox-viewer';

@Component({
  selector: 'app-gearbox2',
  standalone: true,
  imports: [GearboxViewerComponent],
  templateUrl: './gearbox2.html',
  styleUrl: './gearbox2.scss',
})
export class Gearbox2 {}
