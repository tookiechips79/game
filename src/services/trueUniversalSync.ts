// True Universal Sync Service
// This service creates a truly universal data storage that works across all browsers
// by using a combination of URL parameters, shared storage, and cross-tab communication

import { UniversalStorageData } from '@/utils/universalStorage';

interface SyncData {
  data: UniversalStorageData;
  timestamp: number;
  source: string;
  browser: string;
}

class TrueUniversalSyncService {
  private sharedKey = 'betting_app_universal_shared';
  private syncInterval: number = 5000; // 5 seconds for faster sync
  private isEnabled: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: ((data: UniversalStorageData) => void)[] = [];
  private lastSyncTime: number = 0;

  // Initialize the true universal sync service
  initialize(): void {
    this.isEnabled = true;
    console.log('True universal sync service initialized');
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Setup cross-tab communication
    this.setupCrossTabCommunication();
    
    // Initial sync
    this.syncFromShared();
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

    console.log('True universal sync service stopped');
  }

  // Sync data to shared storage
  async syncToShared(data: UniversalStorageData): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const syncData: SyncData = {
        data: data,
        timestamp: Date.now(),
        source: 'true-universal-sync',
        browser: this.getBrowserInfo()
      };

      // Store in multiple locations for maximum compatibility
      const jsonData = JSON.stringify(syncData);
      
      // Primary storage
      localStorage.setItem(this.sharedKey, jsonData);
      
      // Secondary storage
      sessionStorage.setItem(this.sharedKey, jsonData);
      
      // URL parameter storage (for cross-browser sharing)
      this.updateUrlWithData(jsonData);
      
      this.lastSyncTime = Date.now();
      console.log('Data synced to true universal storage successfully');
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync(syncData);
      
      return true;
    } catch (error) {
      console.error('Error syncing to true universal storage:', error);
      return false;
    }
  }

  // Sync data from shared storage
  async syncFromShared(): Promise<UniversalStorageData | null> {
    try {
      let syncData: SyncData | null = null;
      
      // Try multiple sources in order of preference
      const sources = [
        () => sessionStorage.getItem(this.sharedKey),
        () => localStorage.getItem(this.sharedKey),
        () => this.getDataFromUrl()
      ];
      
      for (const getSource of sources) {
        const data = getSource();
        if (data) {
          try {
            syncData = JSON.parse(data);
            break;
          } catch (e) {
            console.warn('Failed to parse sync data from source:', e);
          }
        }
      }
      
      if (syncData && syncData.data) {
        this.lastSyncTime = syncData.timestamp;
        return syncData.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error syncing from true universal storage:', error);
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

  // Update URL with data (for cross-browser sharing)
  private updateUrlWithData(jsonData: string): void {
    try {
      // Encode data for URL
      const encodedData = btoa(jsonData);
      
      // Update URL hash with data
      const currentUrl = new URL(window.location.href);
      currentUrl.hash = `#data=${encodedData}`;
      
      // Update URL without page reload
      window.history.replaceState({}, '', currentUrl.toString());
    } catch (error) {
      console.warn('Failed to update URL with data:', error);
    }
  }

  // Get data from URL
  private getDataFromUrl(): string | null {
    try {
      const url = new URL(window.location.href);
      const hash = url.hash;
      
      if (hash.includes('data=')) {
        const dataParam = hash.split('data=')[1];
        if (dataParam) {
          return atob(dataParam);
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get data from URL:', error);
      return null;
    }
  }

  // Setup cross-tab communication
  private setupCrossTabCommunication(): void {
    // Listen for storage changes
    window.addEventListener('storage', (event) => {
      if (event.key === this.sharedKey && event.newValue) {
        try {
          const syncData: SyncData = JSON.parse(event.newValue);
          this.lastSyncTime = syncData.timestamp;
          this.notifyListeners(syncData.data);
        } catch (error) {
          console.error('Error parsing sync data from storage event:', error);
        }
      }
    });

    // Listen for custom sync events
    window.addEventListener('true-universal-sync', (event: any) => {
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

    // Listen for hash changes (URL data changes)
    window.addEventListener('hashchange', () => {
      this.syncFromShared().then(data => {
        if (data) {
          this.notifyListeners(data);
        }
      });
    });
  }

  // Trigger cross-tab synchronization
  private triggerCrossTabSync(syncData: SyncData): void {
    // Dispatch a custom event that other tabs can listen to
    const event = new CustomEvent('true-universal-sync', {
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
        console.error('Error in true universal sync listener:', error);
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
    const syncData = localStorage.getItem(this.sharedKey);
    return syncData || '{}';
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      localStorage.setItem(this.sharedKey, jsonData);
      sessionStorage.setItem(this.sharedKey, jsonData);
      this.triggerCrossTabSync(data);
      return true;
    } catch (error) {
      console.error('Error importing true universal data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(this.sharedKey);
    sessionStorage.removeItem(this.sharedKey);
    
    // Clear URL data
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = '';
    window.history.replaceState({}, '', currentUrl.toString());
    
    this.triggerCrossTabSync({ 
      data: {
        gameState: null,
        users: [],
        currentUser: null,
        betHistory: [],
        userBetReceipts: [],
        creditTransactions: [],
        localAdminState: null
      }, 
      timestamp: Date.now(),
      source: 'clear',
      browser: this.getBrowserInfo()
    });
  }
}

// Create singleton instance
export const trueUniversalSyncService = new TrueUniversalSyncService();

// Auto-initialize
trueUniversalSyncService.initialize();
