import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        title: 'Home',
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./card-list/card-list.component').then(m => m.CardListComponent),
    },
    {
        title: 'Reader',
        path: 'reader/:id',
        loadComponent: () => import('./reader/reader.component').then(m => m.ReaderComponent),
    },
    {
        title: 'Pdf viewer 2000',
        path: '**',
        redirectTo: '/'
    }
];
