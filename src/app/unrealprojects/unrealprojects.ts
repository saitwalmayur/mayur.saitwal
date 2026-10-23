import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unrealprojects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './unrealprojects.html',
  styleUrl: './unrealprojects.scss',
})
export class Unrealprojects {}
