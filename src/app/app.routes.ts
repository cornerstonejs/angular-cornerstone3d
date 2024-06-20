import { Routes } from '@angular/router';
import { CornerstoneViewportComponent } from './cornerstone-viewport/cornerstone-viewport.component';
import { PolysegComponent } from './polyseg/polyseg.component';

export const routes: Routes = [
  { path: 'cornerstone-viewport', component: CornerstoneViewportComponent },
  { path: 'polyseg', component: PolysegComponent },
  { path: '', redirectTo: '/cornerstone-viewport', pathMatch: 'full' },
];
