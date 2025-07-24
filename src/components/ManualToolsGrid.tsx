import React from 'react';
import { ActionButtonProps, ActionGrid } from './ActionGrid';

interface ManualToolsGridProps {
  onClipboardScan: () => void;
  onAppScan: () => void;
  onNetworkProtection: () => void;
  isPremium?: boolean; // Add premium status to determine preview mode
}

export const ManualToolsGrid: React.FC<ManualToolsGridProps> = ({
  onClipboardScan,
  onAppScan,
  onNetworkProtection,
  isPremium = false,
}) => {
  const manualToolActions: ActionButtonProps[] = [
    {
      label: 'Scan Clipboard',
      description: 'Check clipboard for links',
      onPress: onClipboardScan,
      icon: 'clipboard-text-search-outline',
    },
    {
      label: 'Scan Installed Apps',
      description: isPremium ? 'Check apps for risks' : 'Coming Soon - App Analysis',
      onPress: onAppScan,
      icon: isPremium ? 'shield-search' : 'rocket-launch-outline',
      isPremium: isPremium,
      isComingSoon: !isPremium,
    },
    {
      label: 'Network Protection',
      description: isPremium ? 'Activate for 1 hour' : 'Coming Soon - Network Guard',
      onPress: onNetworkProtection,
      icon: isPremium ? 'earth' : 'rocket-launch-outline',
      isPremium: isPremium,
      isComingSoon: !isPremium,
    },
  ];

  return <ActionGrid 
    actions={manualToolActions} 
    title={isPremium ? "🔧 Advanced Tools" : "🔧 Tools Preview"}
    subtitle={isPremium ? "Pro security features" : "More tools coming soon"}
  />;
}; 