import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { hybridSyncService } from './services/hybridSync'

// Initialize sync services
console.log('🚀 Initializing sync services...');
hybridSyncService.initialize();

createRoot(document.getElementById("root")!).render(<App />);
