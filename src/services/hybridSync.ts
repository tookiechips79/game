// Hybrid Sync Service
// This service combines WebSocket and URL-based sync for maximum reliability
// Uses WebSocket when available, falls back to URL sync when not

import { UniversalStorageData } from '@/utils/universalStorage';
import { pusherSyncService } from './pusherSync';
import { mobileSyncService } from './mobileSync';

interface HybridSyncStatus {
  isWebSocketConnected: boolean;
  isUrlSyncEnabled: boolean;
  primaryMethod: 'websocket' | 'url';
  fallbackMethod: 'url' | 'websocket';
  lastSyncTime: number;
  device: string;
}

class HybridSyncService {
  private listeners: ((data: UniversalStorageData) => void)[] = [];
  private isEnabled: boolean = false;
  private status: HybridSyncStatus;
  private syncTimer: NodeJS.Timeout | null = null;
  private checkInterval: number = 10000; // Check every 10 seconds

  constructor() {
    this.status = {
      isWebSocketConnected: false,
      isUrlSyncEnabled: true,
      primaryMethod: 'websocket',
      fallbackMethod: 'url',
      lastSyncTime: 0,
      device: this.getDeviceInfo()
    };
  }

  // Initialize hybrid sync service
  initialize(): void {
    this.isEnabled = true;
    console.log('🔄 Hybrid sync service initializing...');
    console.log('🔧 About to initialize Pusher service...');
    
    // Setup Pusher WebSocket sync
    pusherSyncService.addListener((data) => {
      this.handleDataUpdate(data, 'websocket');
    });
    
    // Setup URL sync
    mobileSyncService.addListener((data) => {
      this.handleDataUpdate(data, 'url');
    });
    
    // Start periodic status check
    this.startStatusCheck();
    
    // Initial sync
    this.syncFromAllSources();
  }

  // Get device information
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
    
    if (isMobile) return 'Mobile';
    if (isTablet) return 'Tablet';
    if (userAgent.includes('Chrome')) return 'Desktop Chrome';
    if (userAgent.includes('Safari')) return 'Desktop Safari';
    if (userAgent.includes('Firefox')) return 'Desktop Firefox';
    if (userAgent.includes('Edge')) return 'Desktop Edge';
    return 'Desktop';
  }

  // Start periodic status check
  private startStatusCheck(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.checkSyncStatus();
    }, this.checkInterval);
  }

  // Check sync status
  private checkSyncStatus(): void {
    const wsStatus = pusherSyncService.getStatus();
    const urlStatus = mobileSyncService.getStatus();
    
    this.status.isWebSocketConnected = wsStatus.isConnected;
    this.status.isUrlSyncEnabled = urlStatus.isEnabled;
    
    // Determine primary method
    if (this.status.isWebSocketConnected) {
      this.status.primaryMethod = 'websocket';
      this.status.fallbackMethod = 'url';
    } else {
      this.status.primaryMethod = 'url';
      this.status.fallbackMethod = 'websocket';
    }
    
    console.log(`🔄 Sync status: Primary=${this.status.primaryMethod}, Fallback=${this.status.fallbackMethod}`);
  }

  // Handle data update from any source
  private handleDataUpdate(data: UniversalStorageData, source: 'websocket' | 'url'): void {
    this.status.lastSyncTime = Date.now();
    this.notifyListeners(data);
    
    // If data came from fallback method, try to sync to primary method
    if (source === this.status.fallbackMethod) {
      this.syncToPrimaryMethod(data);
    }
  }

  // Sync data to primary method
  private syncToPrimaryMethod(data: UniversalStorageData): void {
    if (this.status.primaryMethod === 'websocket' && this.status.isWebSocketConnected) {
      pusherSyncService.sendDataUpdate(data);
    } else if (this.status.primaryMethod === 'url') {
      mobileSyncService.syncToShared(data);
    }
  }

  // Sync from all available sources
  private async syncFromAllSources(): Promise<void> {
    try {
      // Try Pusher WebSocket first
      if (this.status.isWebSocketConnected) {
        // Pusher doesn't have forceSync, so we'll just check connection
        console.log('📡 Pusher WebSocket connected, ready for real-time sync');
      }
      
      // Always try URL sync as fallback
      await mobileSyncService.forceSync();
    } catch (error) {
      console.error('Error syncing from all sources:', error);
    }
  }

  // Send data update using best available method
  sendDataUpdate(data: UniversalStorageData): void {
    if (this.status.primaryMethod === 'websocket' && this.status.isWebSocketConnected) {
      pusherSyncService.sendDataUpdate(data);
      console.log('📡 Data sent via Pusher WebSocket (primary)');
    } else {
      mobileSyncService.syncToShared(data);
      console.log('🔗 Data sent via URL sync (primary)');
    }
    
    // Also send to fallback method
    if (this.status.fallbackMethod === 'websocket' && this.status.isWebSocketConnected) {
      pusherSyncService.sendDataUpdate(data);
    } else if (this.status.fallbackMethod === 'url') {
      mobileSyncService.syncToShared(data);
    }
  }

  // Force sync using all available methods
  async forceSync(): Promise<boolean> {
    try {
      let success = false;
      
      // Try Pusher WebSocket first
      if (this.status.isWebSocketConnected) {
        // Pusher doesn't have forceSync, so we'll just check connection
        success = pusherSyncService.isWebSocketConnected();
      }
      
      // Always try URL sync
      const urlSuccess = await mobileSyncService.forceSync();
      success = success || urlSuccess;
      
      return success;
    } catch (error) {
      console.error('Error during force sync:', error);
      return false;
    }
  }

  // Add listener for data changes
  addListener(callback: (data: UniversalStorageData) => void): () => void {
    this.listeners.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners(data: UniversalStorageData): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in hybrid sync listener:', error);
      }
    });
  }

  // Get sync status
  getStatus(): HybridSyncStatus {
    this.checkSyncStatus(); // Update status before returning
    return { ...this.status };
  }

  // Stop the service
  stop(): void {
    this.isEnabled = false;
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    pusherSyncService.disconnect();
    mobileSyncService.stop();
    
    console.log('🔄 Hybrid sync service stopped');
  }

  // Export data
  exportData(): string {
    return mobileSyncService.exportData();
  }

  // Import data
  importData(jsonData: string): boolean {
    const success = mobileSyncService.importData(jsonData);
    if (success) {
      // Also sync to Pusher WebSocket if available
      if (this.status.isWebSocketConnected) {
        try {
          const data = JSON.parse(jsonData);
          pusherSyncService.sendDataUpdate(data);
        } catch (error) {
          console.error('Error syncing imported data to Pusher WebSocket:', error);
        }
      }
    }
    return success;
  }

  // Clear all data
  clearAllData(): void {
    mobileSyncService.clearAllData();
    if (this.status.isWebSocketConnected) {
      // Pusher doesn't have clearAllData, so we'll just send empty data
      pusherSyncService.sendDataUpdate({} as UniversalStorageData);
    }
  }

  // Get connection info
  getConnectionInfo(): {
    websocket: {
      connected: boolean;
      url: string;
      latency: number;
    };
    url: {
      enabled: boolean;
      lastSync: number;
    };
    primary: string;
    fallback: string;
  } {
    const wsStatus = pusherSyncService.getStatus();
    const urlStatus = mobileSyncService.getStatus();
    
    return {
      websocket: {
        connected: wsStatus.isConnected,
        url: 'pusher-websocket',
        latency: pusherSyncService.getConnectionLatency()
      },
      url: {
        enabled: urlStatus.isEnabled,
        lastSync: urlStatus.lastSyncTime
      },
      primary: this.status.primaryMethod,
      fallback: this.status.fallbackMethod
    };
  }
}

// Create singleton instance
export const hybridSyncService = new HybridSyncService();

// Auto-initialize
hybridSyncService.initialize();
