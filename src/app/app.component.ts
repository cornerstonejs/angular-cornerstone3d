// src/app/app.component.ts

import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <h1>{{ title }}</h1>
    <nav><a routerLink="/cornerstone-viewport">Cornerstone Viewport</a> |</nav>
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Angular Cornerstone3D';
}
