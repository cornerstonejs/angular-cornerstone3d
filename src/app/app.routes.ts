import { Routes } from '@angular/router';
import { CornerstoneViewportComponent } from './cornerstone-viewport/cornerstone-viewport.component';

export const routes: Routes = [
  { path: 'cornerstone-viewport', component: CornerstoneViewportComponent },
  { path: '', redirectTo: '/cornerstone-viewport', pathMatch: 'full' },
];
