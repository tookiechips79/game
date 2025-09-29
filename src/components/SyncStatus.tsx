import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  Clock
} from 'lucide-react';
import { cloudSyncService } from '@/services/cloudSync';
import { toast } from 'sonner';

interface SyncStatusProps {
  className?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const [syncStatus, setSyncStatus] = useState(cloudSyncService.getStatus());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Update sync status every 30 seconds
    const interval = setInterval(() => {
      setSyncStatus(cloudSyncService.getStatus());
    }, 30000);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync events
    const handleSync = () => {
      setLastSyncTime(new Date());
      setSyncStatus(cloudSyncService.getStatus());
    };

    window.addEventListener('betting-app-sync', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('betting-app-sync', handleSync);
    };
  }, []);

  const handleForceSync = async () => {
    try {
      const success = await cloudSyncService.forceSync();
      if (success) {
        toast.success('Data synchronized successfully');
        setLastSyncTime(new Date());
        setSyncStatus(cloudSyncService.getStatus());
      } else {
        toast.error('Failed to synchronize data');
      }
    } catch (error) {
      toast.error('Failed to synchronize data');
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getSyncStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (!syncStatus.isEnabled) return 'secondary';
    if (syncStatus.lastSyncTime === 0) return 'warning';
    return 'default';
  };

  const getSyncStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!syncStatus.isEnabled) return 'Disabled';
    if (syncStatus.lastSyncTime === 0) return 'Not Synced';
    return 'Synced';
  };

  const getSyncIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />;
    if (!syncStatus.isEnabled) return <AlertCircle className="h-3 w-3" />;
    if (syncStatus.lastSyncTime === 0) return <Clock className="h-3 w-3" />;
    return <CheckCircle className="h-3 w-3" />;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Online Status */}
      <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
        {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>

      {/* Sync Status */}
      <Badge variant={getSyncStatusColor()} className="text-xs">
        {getSyncIcon()}
        <span className="ml-1">{getSyncStatusText()}</span>
      </Badge>

      {/* Last Sync Time */}
      {syncStatus.lastSyncTime > 0 && (
        <span className="text-xs text-muted-foreground">
          {formatLastSync(syncStatus.lastSyncTime)}
        </span>
      )}

      {/* Force Sync Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleForceSync}
        disabled={!isOnline}
        className="h-6 px-2 text-xs"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        Sync
      </Button>
    </div>
  );
};

export default SyncStatus;
