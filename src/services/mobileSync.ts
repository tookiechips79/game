// Mobile-Friendly Sync Service
// This service creates a truly universal data storage that works across all devices
// including mobile phones, tablets, and desktop browsers

import { UniversalStorageData } from '@/utils/universalStorage';

interface SyncData {
  data: UniversalStorageData;
  timestamp: number;
  source: string;
  device: string;
  userAgent: string;
}

class MobileSyncService {
  private syncKey = 'betting_app_mobile_sync';
  private syncInterval: number = 2000; // 2 seconds for mobile-friendly sync
  private isEnabled: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: ((data: UniversalStorageData) => void)[] = [];
  private lastSyncTime: number = 0;
  private isOnline: boolean = navigator.onLine;
  private deviceInfo: string;

  constructor() {
    this.deviceInfo = this.getDeviceInfo();
  }

  // Initialize the mobile sync service
  initialize(): void {
    this.isEnabled = true;
    console.log('Mobile sync service initialized for:', this.deviceInfo);
    
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
    
    // Setup cross-device communication
    this.setupCrossDeviceCommunication();
    
    // Initial sync
    this.syncFromShared();
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

    console.log('Mobile sync service stopped');
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
        source: 'mobile-sync',
        device: this.deviceInfo,
        userAgent: navigator.userAgent
      };

      const jsonData = JSON.stringify(syncData);
      
      // Store in multiple locations for maximum compatibility
      localStorage.setItem(this.syncKey, jsonData);
      sessionStorage.setItem(this.syncKey, jsonData);
      
      // For mobile devices, also store in URL hash (if data is small enough)
      this.updateUrlWithData(jsonData);
      
      this.lastSyncTime = Date.now();
      console.log('✅ Data synced to mobile storage successfully');
      console.log('📱 Device:', this.deviceInfo);
      console.log('🔄 URL will be updated with latest data');
      
      // Trigger cross-device sync
      this.triggerCrossDeviceSync(syncData);
      
      return true;
    } catch (error) {
      console.error('Error syncing to mobile storage:', error);
      return false;
    }
  }

  // Sync data from shared storage
  async syncFromShared(): Promise<UniversalStorageData | null> {
    try {
      let syncData: SyncData | null = null;
      
      // Try multiple sources in order of preference
      const sources = [
        () => this.getDataFromUrl(),
        () => sessionStorage.getItem(this.syncKey),
        () => localStorage.getItem(this.syncKey)
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
      console.error('Error syncing from mobile storage:', error);
      return null;
    }
  }

  // Update URL with data (for mobile sharing)
  private updateUrlWithData(jsonData: string): void {
    try {
      // Check if data is too large for URL (limit to 2000 characters)
      if (jsonData.length > 2000) {
        console.warn('Data too large for URL encoding, skipping URL update');
        return;
      }
      
      // Encode data for URL (mobile-friendly)
      const encodedData = btoa(jsonData);
      
      // Check if encoded data is still too large
      if (encodedData.length > 8000) {
        console.warn('Encoded data too large for URL, skipping URL update');
        return;
      }
      
      // Get current URL and preserve existing hash
      const currentUrl = new URL(window.location.href);
      const existingHash = currentUrl.hash;
      
      // If there's already a hash, preserve the route part
      let routeHash = '';
      if (existingHash && existingHash.includes('#')) {
        const hashParts = existingHash.split('#');
        if (hashParts.length > 1) {
          routeHash = hashParts[1].split('?')[0]; // Get route part before any sync data
        }
      }
      
      // Update URL hash with data, preserving route
      if (routeHash) {
        currentUrl.hash = `#${routeHash}&sync=${encodedData}`;
      } else {
        currentUrl.hash = `#sync=${encodedData}`;
      }
      
      // Update URL without page reload
      window.history.replaceState({}, '', currentUrl.toString());
      
      // Dispatch custom event for UI updates
      const event = new CustomEvent('url-updated', {
        detail: { url: currentUrl.toString() }
      });
      window.dispatchEvent(event);
      
      // Debug: Log URL update
      console.log('🔄 URL updated with latest data:', currentUrl.toString());
    } catch (error) {
      console.warn('Failed to update URL with data:', error);
      console.warn('Error details:', error.message);
    }
  }

  // Get data from URL
  private getDataFromUrl(): string | null {
    try {
      const url = new URL(window.location.href);
      const hash = url.hash;
      
      if (hash.includes('sync=')) {
        // Handle both formats: #sync=... and #route&sync=...
        const syncIndex = hash.indexOf('sync=');
        const dataParam = hash.substring(syncIndex + 5); // Get everything after 'sync='
        
        if (dataParam) {
          // Remove any additional parameters after sync data
          const cleanParam = dataParam.split('&')[0];
          return atob(cleanParam);
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get data from URL:', error);
      console.warn('Error details:', error.message);
      return null;
    }
  }

  // Setup cross-device communication
  private setupCrossDeviceCommunication(): void {
    // Listen for storage changes
    window.addEventListener('storage', (event) => {
      if (event.key === this.syncKey && event.newValue) {
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
    window.addEventListener('mobile-sync-message', (event: any) => {
      if (event.detail && event.detail.data) {
        this.lastSyncTime = event.detail.timestamp;
        this.notifyListeners(event.detail.data);
      }
    });

    // Listen for focus events
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

    // Listen for hash changes (URL data changes)
    window.addEventListener('hashchange', () => {
      this.syncFromShared().then(data => {
        if (data) {
          this.notifyListeners(data);
        }
      });
    });

    // Listen for page load (for mobile)
    window.addEventListener('load', () => {
      this.syncFromShared().then(data => {
        if (data) {
          this.notifyListeners(data);
        }
      });
    });
  }

  // Trigger cross-device synchronization
  private triggerCrossDeviceSync(syncData: SyncData): void {
    // Dispatch a custom event that other devices can listen to
    const event = new CustomEvent('mobile-sync-message', {
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
        console.error('Error in mobile sync listener:', error);
      }
    });
  }

  // Force sync
  async forceSync(): Promise<boolean> {
    try {
      const data = await this.syncFromShared();
      if (data) {
        this.notifyListeners(data);
        console.log('🔄 Force sync completed from URL/localStorage');
        return true;
      }
      
      // If no shared data, try to sync from localStorage
      const localData = localStorage.getItem('betting_app_universal_data');
      if (localData) {
        const parsedData = JSON.parse(localData);
        this.notifyListeners(parsedData);
        console.log('🔄 Force sync completed from localStorage fallback');
        return true;
      }
      
      console.log('🔄 No data found for force sync');
      return false;
    } catch (error) {
      console.error('Error during force sync:', error);
      return false;
    }
  }

  // Get sync status
  getStatus(): {
    isEnabled: boolean;
    lastSyncTime: number;
    syncInterval: number;
    device: string;
    isOnline: boolean;
  } {
    return {
      isEnabled: this.isEnabled,
      lastSyncTime: this.lastSyncTime,
      syncInterval: this.syncInterval,
      device: this.deviceInfo,
      isOnline: this.isOnline
    };
  }

  // Export data for backup
  exportData(): string {
    const syncData = localStorage.getItem(this.syncKey);
    return syncData || '{}';
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      localStorage.setItem(this.syncKey, jsonData);
      sessionStorage.setItem(this.syncKey, jsonData);
      this.triggerCrossDeviceSync(data);
      return true;
    } catch (error) {
      console.error('Error importing mobile sync data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(this.syncKey);
    sessionStorage.removeItem(this.syncKey);
    
    // Clear URL data
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = '';
    window.history.replaceState({}, '', currentUrl.toString());
    
    this.triggerCrossDeviceSync({ 
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
      device: this.deviceInfo,
      userAgent: navigator.userAgent
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

  // Generate shareable URL with data
  generateShareableUrl(): string {
    try {
      const currentData = localStorage.getItem('betting_app_universal_data');
      if (currentData) {
        // Check if data is small enough for URL
        if (currentData.length <= 2000) {
          const encodedData = btoa(currentData);
          if (encodedData.length <= 8000) {
            const currentUrl = new URL(window.location.href);
            // Preserve existing route
            const existingHash = currentUrl.hash;
            let routeHash = '';
            if (existingHash && existingHash.includes('#')) {
              const hashParts = existingHash.split('#');
              if (hashParts.length > 1) {
                routeHash = hashParts[1].split('?')[0];
              }
            }
            
            if (routeHash) {
              currentUrl.hash = `#${routeHash}&sync=${encodedData}`;
            } else {
              currentUrl.hash = `#sync=${encodedData}`;
            }
            return currentUrl.toString();
          }
        }
        
        // If data is too large, return URL with sync indicator
        const currentUrl = new URL(window.location.href);
        const existingHash = currentUrl.hash;
        let routeHash = '';
        if (existingHash && existingHash.includes('#')) {
          const hashParts = existingHash.split('#');
          if (hashParts.length > 1) {
            routeHash = hashParts[1].split('?')[0];
          }
        }
        
        if (routeHash) {
          currentUrl.hash = `#${routeHash}&sync=large`;
        } else {
          currentUrl.hash = `#sync=large`;
        }
        return currentUrl.toString();
      }
      return window.location.href;
    } catch (error) {
      console.error('Error generating shareable URL:', error);
      return window.location.href;
    }
  }

  // Copy shareable URL to clipboard
  async copyShareableUrl(): Promise<boolean> {
    try {
      const url = this.generateShareableUrl();
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('Error copying URL to clipboard:', error);
      return false;
    }
  }
}

// Create singleton instance
export const mobileSyncService = new MobileSyncService();

// Auto-initialize
mobileSyncService.initialize();
