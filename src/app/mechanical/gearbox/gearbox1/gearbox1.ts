import { Component } from '@angular/core';
import { GearboxViewerComponent } from '../gearbox-viewer/gearbox-viewer';

@Component({
  selector: 'app-gearbox1',
  standalone: true,
  imports: [GearboxViewerComponent],
  templateUrl: './gearbox1.html',
  styleUrl: './gearbox1.scss',
})
export class Gearbox1 {}
