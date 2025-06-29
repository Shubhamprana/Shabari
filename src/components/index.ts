export { ActionButton, ActionGrid } from './ActionGrid';
export { Button } from './Button';
export { Card, StatusCard } from './Card';
export { Header } from './Header';
export { PremiumUpgrade } from './PremiumUpgrade';
export { StatsDisplay } from './StatsDisplay';

// Web-specific scroll fix
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Inject CSS for better web scrolling
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow-x: hidden;
    }
    
    #root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    /* React Native Web ScrollView fixes */
    .rn-scrollview {
      flex: 1 !important;
      height: 100% !important;
    }
    
    /* Ensure proper scroll behavior */
    [data-focusable="true"] {
      outline: none;
    }
    
    /* Custom scrollbar for better UX */
    ::-webkit-scrollbar {
      width: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    /* Gradient backgrounds for web */
    .gradient-primary {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }
    
    .gradient-secondary {
      background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
    }
    
    .gradient-danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    
    .gradient-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    
    /* Glass morphism effect */
    .glass-effect {
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    /* Animation optimizations */
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Ensure touch-friendly interactions */
    button, [role="button"] {
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
  `;
  document.head.appendChild(style);
}

