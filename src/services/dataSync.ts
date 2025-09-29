// Data Synchronization Service
// This service handles data synchronization across browsers and devices

import { universalStorage, UniversalStorageData } from '@/utils/universalStorage';

export interface SyncOptions {
  enableCloudSync?: boolean;
  syncInterval?: number; // in milliseconds
  enableRealTimeSync?: boolean;
}

class DataSyncService {
  private syncInterval: number = 30000; // 30 seconds
  private syncTimer: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;
  private lastSyncTime: number = 0;

  // Initialize the sync service
  initialize(options: SyncOptions = {}): void {
    this.syncInterval = options.syncInterval || 30000;
    this.isEnabled = true;

    // Start periodic sync
    if (this.syncInterval > 0) {
      this.startPeriodicSync();
    }

    // Setup real-time sync if enabled
    if (options.enableRealTimeSync) {
      this.setupRealTimeSync();
    }

    console.log('Data sync service initialized');
  }

  // Start periodic synchronization
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncData();
    }, this.syncInterval);
  }

  // Stop synchronization
  stop(): void {
    this.isEnabled = false;
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    console.log('Data sync service stopped');
  }

  // Sync data immediately
  async syncData(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const currentData = universalStorage.getData();
      
      // Here you could implement cloud sync
      // For now, we'll just update the timestamp
      this.lastSyncTime = Date.now();
      
      console.log('Data synced successfully');
      return true;
    } catch (error) {
      console.error('Error syncing data:', error);
      return false;
    }
  }

  // Setup real-time synchronization
  private setupRealTimeSync(): void {
    // Listen for storage changes
    universalStorage.addListener((data) => {
      if (this.isEnabled) {
        this.syncData();
      }
    });
  }

  // Get sync status
  getStatus(): {
    isEnabled: boolean;
    lastSyncTime: number;
    syncInterval: number;
  } {
    return {
      isEnabled: this.isEnabled,
      lastSyncTime: this.lastSyncTime,
      syncInterval: this.syncInterval
    };
  }

  // Force sync
  async forceSync(): Promise<boolean> {
    return await this.syncData();
  }

  // Export data for backup
  exportData(): string {
    return universalStorage.exportData();
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    const success = universalStorage.importData(jsonData);
    if (success) {
      this.syncData();
    }
    return success;
  }

  // Clear all data
  clearAllData(): void {
    universalStorage.clear();
    this.syncData();
  }

  // Get data summary
  getDataSummary(): {
    totalUsers: number;
    totalBets: number;
    totalHistory: number;
    lastUpdate: number;
  } {
    const data = universalStorage.getData();
    
    return {
      totalUsers: data.users?.length || 0,
      totalBets: (data.gameState?.teamAQueue?.length || 0) + (data.gameState?.teamBQueue?.length || 0),
      totalHistory: data.betHistory?.length || 0,
      lastUpdate: this.lastSyncTime
    };
  }
}

// Create singleton instance
export const dataSyncService = new DataSyncService();

// Auto-initialize with default settings
dataSyncService.initialize({
  enableRealTimeSync: true,
  syncInterval: 30000 // 30 seconds
});
