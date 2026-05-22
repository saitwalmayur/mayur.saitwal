import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopPanel } from './top-panel/top-panel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopPanel],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('mayursaitwal');
}
