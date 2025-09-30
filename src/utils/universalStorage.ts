// Universal Storage Utility
// This provides a unified storage interface that can work across browsers
// and syncs with a hybrid sync service (WebSocket + URL) for maximum compatibility

import { hybridSyncService } from '@/services/hybridSync';

export interface UniversalStorageData {
  gameState: any;
  users: any[];
  currentUser: any;
  betHistory: any[];
  userBetReceipts: any[];
  creditTransactions: any[];
  localAdminState: any;
}

class UniversalStorage {
  private storageKey = 'betting_app_universal_data';
  private listeners: ((data: UniversalStorageData) => void)[] = [];

  // Get all data from storage
  getData(): UniversalStorageData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading universal storage:', error);
    }
    
    // Return default data structure
    return {
      gameState: null,
      users: [],
      currentUser: null,
      betHistory: [],
      userBetReceipts: [],
      creditTransactions: [],
      localAdminState: null
    };
  }

  // Save all data to storage
  setData(data: UniversalStorageData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.notifyListeners(data);
      
      // Send hybrid update for cross-device compatibility (WebSocket + URL)
      console.log('🔄 Data changed, triggering hybrid sync...');
      hybridSyncService.sendDataUpdate(data);
    } catch (error) {
      console.error('Error saving universal storage:', error);
    }
  }

  // Update specific section of data
  updateSection(section: keyof UniversalStorageData, data: any): void {
    const currentData = this.getData();
    currentData[section] = data;
    this.setData(currentData);
  }

  // Get specific section
  getSection(section: keyof UniversalStorageData): any {
    const data = this.getData();
    return data[section];
  }

  // Clear all data
  clear(): void {
    localStorage.removeItem(this.storageKey);
    this.notifyListeners(this.getData());
  }

  // Listen for changes
  addListener(callback: (data: UniversalStorageData) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
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
        console.error('Error in storage listener:', error);
      }
    });
  }

  // Listen for storage events from other tabs
  setupCrossTabSync(): void {
    // Listen for localStorage changes
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
          const newData = JSON.parse(event.newValue);
          this.notifyListeners(newData);
        } catch (error) {
          console.error('Error parsing cross-tab storage event:', error);
        }
      }
    });

    // Listen for hybrid sync events
    hybridSyncService.addListener((data) => {
      this.notifyListeners(data);
    });
  }

  // Export data for backup
  exportData(): string {
    return JSON.stringify(this.getData(), null, 2);
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.setData(data);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

// Create singleton instance
export const universalStorage = new UniversalStorage();

// Setup cross-tab synchronization
universalStorage.setupCrossTabSync();
