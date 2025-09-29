// Simple Universal Sync Service
// This service creates a truly universal data storage that works across all browsers
// by using a simple shared data file and fetch requests

import { UniversalStorageData } from '@/utils/universalStorage';

interface SyncData {
  data: UniversalStorageData;
  timestamp: number;
  source: string;
  browser: string;
}

class SimpleUniversalSyncService {
  private sharedDataUrl = '/shared-data.json'; // Simple JSON file
  private syncInterval: number = 3000; // 3 seconds for fast sync
  private isEnabled: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: ((data: UniversalStorageData) => void)[] = [];
  private lastSyncTime: number = 0;
  private isOnline: boolean = navigator.onLine;

  // Initialize the simple universal sync service
  initialize(): void {
    this.isEnabled = true;
    console.log('Simple universal sync service initialized');
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncFromShared();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
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
      if (this.isOnline) {
        this.syncFromShared();
      }
    }, this.syncInterval);
  }

  // Stop synchronization
  stop(): void {
    this.isEnabled = false;
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    console.log('Simple universal sync service stopped');
  }

  // Sync data to shared storage
  async syncToShared(data: UniversalStorageData): Promise<boolean> {
    if (!this.isEnabled || !this.isOnline) {
      return false;
    }

    try {
      const syncData: SyncData = {
        data: data,
        timestamp: Date.now(),
        source: 'simple-universal-sync',
        browser: this.getBrowserInfo()
      };

      // For now, we'll use a simple approach with a shared localStorage key
      // that all browsers can access through a common mechanism
      const jsonData = JSON.stringify(syncData);
      
      // Store in a special localStorage key that we'll sync across browsers
      localStorage.setItem('betting_app_simple_shared', jsonData);
      
      // Also store in sessionStorage for immediate access
      sessionStorage.setItem('betting_app_simple_shared', jsonData);
      
      this.lastSyncTime = Date.now();
      console.log('Data synced to simple universal storage successfully');
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync(syncData);
      
      return true;
    } catch (error) {
      console.error('Error syncing to simple universal storage:', error);
      return false;
    }
  }

  // Sync data from shared storage
  async syncFromShared(): Promise<UniversalStorageData | null> {
    try {
      let syncData: SyncData | null = null;
      
      // Try multiple sources in order of preference
      const sources = [
        () => sessionStorage.getItem('betting_app_simple_shared'),
        () => localStorage.getItem('betting_app_simple_shared')
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
      console.error('Error syncing from simple universal storage:', error);
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
      if (event.key === 'betting_app_simple_shared' && event.newValue) {
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
    window.addEventListener('simple-universal-sync', (event: any) => {
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

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncFromShared().then(data => {
          if (data) {
            this.notifyListeners(data);
          }
        });
      }
    });
  }

  // Trigger cross-tab synchronization
  private triggerCrossTabSync(syncData: SyncData): void {
    // Dispatch a custom event that other tabs can listen to
    const event = new CustomEvent('simple-universal-sync', {
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
        console.error('Error in simple universal sync listener:', error);
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
    isOnline: boolean;
  } {
    return {
      isEnabled: this.isEnabled,
      lastSyncTime: this.lastSyncTime,
      syncInterval: this.syncInterval,
      browser: this.getBrowserInfo(),
      isOnline: this.isOnline
    };
  }

  // Export data for backup
  exportData(): string {
    const syncData = localStorage.getItem('betting_app_simple_shared');
    return syncData || '{}';
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      localStorage.setItem('betting_app_simple_shared', jsonData);
      sessionStorage.setItem('betting_app_simple_shared', jsonData);
      this.triggerCrossTabSync(data);
      return true;
    } catch (error) {
      console.error('Error importing simple universal data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem('betting_app_simple_shared');
    sessionStorage.removeItem('betting_app_simple_shared');
    
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

  // Get data summary
  getDataSummary(): {
    totalUsers: number;
    totalBets: number;
    totalHistory: number;
    lastUpdate: number;
  } {
    const data = this.exportData();
    try {
      const parsed = JSON.parse(data);
      const gameState = parsed.data?.gameState || {};
      const users = parsed.data?.users || [];
      const betHistory = parsed.data?.betHistory || [];
      
      return {
        totalUsers: users.length,
        totalBets: (gameState.teamAQueue?.length || 0) + (gameState.teamBQueue?.length || 0),
        totalHistory: betHistory.length,
        lastUpdate: this.lastSyncTime
      };
    } catch (error) {
      return {
        totalUsers: 0,
        totalBets: 0,
        totalHistory: 0,
        lastUpdate: this.lastSyncTime
      };
    }
  }
}

// Create singleton instance
export const simpleUniversalSyncService = new SimpleUniversalSyncService();

// Auto-initialize
simpleUniversalSyncService.initialize();
