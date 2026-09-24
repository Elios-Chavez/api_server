import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppProviders } from './app/providers';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(<AppErrorBoundary><AppProviders><App /></AppProviders></AppErrorBoundary>);
