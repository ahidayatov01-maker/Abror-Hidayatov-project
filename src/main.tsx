import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (ev: ErrorEvent) => {
      if (
        typeof ev.message === 'string' &&
        (ev.message.includes('ResizeObserver loop completed with undelivered notifications') ||
          ev.message.includes('ResizeObserver loop limit exceeded'))
      ) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(<App />);
