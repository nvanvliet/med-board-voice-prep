
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import Index from './pages/Index.tsx';
import AuthPage from './pages/AuthPage.tsx';
import NotFound from './pages/NotFound.tsx';
import TranscriptPage from './pages/TranscriptPage.tsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Index />
      },
      {
        path: 'auth',
        element: <AuthPage />
      },
      {
        path: 'transcript',
        element: <TranscriptPage />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
