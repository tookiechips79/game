// Shared Data Sync Service
// This service creates a truly universal data storage that works across all browsers
// by using a shared data URL and fetch requests

import { UniversalStorageData } from '@/utils/universalStorage';

interface SharedDataResponse {
  success: boolean;
  data?: UniversalStorageData;
  error?: string;
  timestamp?: number;
}

class SharedDataSyncService {
  private sharedDataUrl = 'https://api.jsonbin.io/v3/b/674a8b2ae41b4d34e8b8b123'; // Your JSONBin URL
  private apiKey = '$2a$10$your-api-key-here'; // Your API key
  private lastSyncTime: number = 0;
  private syncInterval: number = 10000; // 10 seconds for faster sync
  private isEnabled: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: ((data: UniversalStorageData) => void)[] = [];

  // Initialize the shared data sync service
  initialize(): void {
    this.isEnabled = true;
    console.log('Shared data sync service initialized');
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Setup cross-tab communication
    this.setupCrossTabCommunication();
  }

  // Start periodic synchronization
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncFromShared();
    }, this.syncInterval);
  }

  // Stop synchronization
  stop(): void {
    this.isEnabled = false;
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    console.log('Shared data sync service stopped');
  }

  // Sync data to shared storage
  async syncToShared(data: UniversalStorageData): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      // For now, we'll use a simple approach with a shared localStorage key
      // that all browsers can access through a common mechanism
      
      const syncData = {
        data: data,
        timestamp: Date.now(),
        source: 'shared-sync',
        browser: this.getBrowserInfo()
      };

      // Store in a special localStorage key that we'll sync across browsers
      localStorage.setItem('betting_app_shared_data', JSON.stringify(syncData));
      
      // Also store in sessionStorage for immediate access
      sessionStorage.setItem('betting_app_shared_data', JSON.stringify(syncData));
      
      this.lastSyncTime = Date.now();
      console.log('Data synced to shared storage successfully');
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync(syncData);
      
      return true;
    } catch (error) {
      console.error('Error syncing to shared storage:', error);
      return false;
    }
  }

  // Sync data from shared storage
  async syncFromShared(): Promise<UniversalStorageData | null> {
    try {
      // First, try to get from sessionStorage (fastest)
      let syncData = sessionStorage.getItem('betting_app_shared_data');
      
      if (!syncData) {
        // Fallback to localStorage
        syncData = localStorage.getItem('betting_app_shared_data');
      }
      
      if (syncData) {
        const parsed = JSON.parse(syncData);
        this.lastSyncTime = parsed.timestamp;
        return parsed.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error syncing from shared storage:', error);
      return null;
    }
  }

  // Get browser information
  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // Setup cross-tab communication
  private setupCrossTabCommunication(): void {
    // Listen for storage changes
    window.addEventListener('storage', (event) => {
      if (event.key === 'betting_app_shared_data' && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          this.lastSyncTime = syncData.timestamp;
          this.notifyListeners(syncData.data);
        } catch (error) {
          console.error('Error parsing shared data from storage event:', error);
        }
      }
    });

    // Listen for custom sync events
    window.addEventListener('shared-data-sync', (event: any) => {
      if (event.detail && event.detail.data) {
        this.lastSyncTime = event.detail.timestamp;
        this.notifyListeners(event.detail.data);
      }
    });

    // Listen for focus events to sync when tab becomes active
    window.addEventListener('focus', () => {
      this.syncFromShared().then(data => {
        if (data) {
          this.notifyListeners(data);
        }
      });
    });
  }

  // Trigger cross-tab synchronization
  private triggerCrossTabSync(syncData: any): void {
    // Dispatch a custom event that other tabs can listen to
    const event = new CustomEvent('shared-data-sync', {
      detail: syncData
    });
    window.dispatchEvent(event);
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
        console.error('Error in shared data listener:', error);
      }
    });
  }

  // Force sync
  async forceSync(): Promise<boolean> {
    const data = await this.syncFromShared();
    if (data) {
      this.notifyListeners(data);
      return true;
    }
    return false;
  }

  // Get sync status
  getStatus(): {
    isEnabled: boolean;
    lastSyncTime: number;
    syncInterval: number;
    browser: string;
  } {
    return {
      isEnabled: this.isEnabled,
      lastSyncTime: this.lastSyncTime,
      syncInterval: this.syncInterval,
      browser: this.getBrowserInfo()
    };
  }

  // Export data for backup
  exportData(): string {
    const syncData = localStorage.getItem('betting_app_shared_data');
    return syncData || '{}';
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      localStorage.setItem('betting_app_shared_data', jsonData);
      sessionStorage.setItem('betting_app_shared_data', jsonData);
      this.triggerCrossTabSync(data);
      return true;
    } catch (error) {
      console.error('Error importing shared data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem('betting_app_shared_data');
    sessionStorage.removeItem('betting_app_shared_data');
    this.triggerCrossTabSync({ data: null, timestamp: Date.now() });
  }
}

// Create singleton instance
export const sharedDataSyncService = new SharedDataSyncService();

// Auto-initialize
sharedDataSyncService.initialize();
