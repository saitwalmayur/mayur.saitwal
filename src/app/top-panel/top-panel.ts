import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-top-panel',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './top-panel.html',
  styleUrl: './top-panel.scss',
})
export class TopPanel {}
