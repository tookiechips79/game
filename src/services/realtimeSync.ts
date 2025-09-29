// Real-Time Sync Service
// This service simulates WebSocket-like real-time synchronization
// using browser APIs for cross-browser data sharing

import { UniversalStorageData } from '@/utils/universalStorage';

interface SyncMessage {
  type: 'data_update' | 'ping' | 'pong' | 'sync_request' | 'sync_response';
  data?: UniversalStorageData;
  timestamp: number;
  source: string;
  browser: string;
  sessionId: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  lastPing: number;
  lastPong: number;
  latency: number;
  browser: string;
  sessionId: string;
}

class RealtimeSyncService {
  private syncKey = 'betting_app_realtime_sync';
  private pingInterval: number = 2000; // 2 seconds for ping
  private syncInterval: number = 1000; // 1 second for sync
  private isEnabled: boolean = false;
  private pingTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: ((data: UniversalStorageData) => void)[] = [];
  private connectionStatus: ConnectionStatus;
  private sessionId: string;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.connectionStatus = {
      isConnected: false,
      lastPing: 0,
      lastPong: 0,
      latency: 0,
      browser: this.getBrowserInfo(),
      sessionId: this.sessionId
    };
  }

  // Initialize the real-time sync service
  initialize(): void {
    this.isEnabled = true;
    console.log('Real-time sync service initialized');
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.connectionStatus.isConnected = true;
      this.startPing();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.connectionStatus.isConnected = false;
      this.stopPing();
    });
    
    // Start real-time sync
    this.startRealtimeSync();
    
    // Setup cross-tab communication
    this.setupCrossTabCommunication();
    
    // Initial connection
    this.connect();
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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

  // Connect to real-time sync
  private connect(): void {
    if (!this.isOnline) return;
    
    this.connectionStatus.isConnected = true;
    this.startPing();
    console.log('Connected to real-time sync');
  }

  // Start ping mechanism
  private startPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    this.pingTimer = setInterval(() => {
      this.sendPing();
    }, this.pingInterval);
  }

  // Stop ping mechanism
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  // Send ping message
  private sendPing(): void {
    if (!this.isOnline) return;
    
    const message: SyncMessage = {
      type: 'ping',
      timestamp: Date.now(),
      source: 'realtime-sync',
      browser: this.connectionStatus.browser,
      sessionId: this.sessionId
    };
    
    this.connectionStatus.lastPing = Date.now();
    this.broadcastMessage(message);
  }

  // Start real-time synchronization
  private startRealtimeSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.connectionStatus.isConnected) {
        this.syncData();
      }
    }, this.syncInterval);
  }

  // Stop real-time synchronization
  private stopRealtimeSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Sync data in real-time
  private syncData(): void {
    try {
      // Get current data from localStorage
      const currentData = localStorage.getItem('betting_app_universal_data');
      if (currentData) {
        const data: UniversalStorageData = JSON.parse(currentData);
        this.broadcastDataUpdate(data);
      }
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }

  // Broadcast data update
  private broadcastDataUpdate(data: UniversalStorageData): void {
    const message: SyncMessage = {
      type: 'data_update',
      data: data,
      timestamp: Date.now(),
      source: 'realtime-sync',
      browser: this.connectionStatus.browser,
      sessionId: this.sessionId
    };
    
    this.broadcastMessage(message);
  }

  // Broadcast message to all tabs
  private broadcastMessage(message: SyncMessage): void {
    try {
      // Store message in localStorage for cross-tab communication
      const messageKey = `${this.syncKey}_${Date.now()}`;
      localStorage.setItem(messageKey, JSON.stringify(message));
      
      // Dispatch custom event for immediate processing
      const event = new CustomEvent('realtime-sync-message', {
        detail: message
      });
      window.dispatchEvent(event);
      
      // Clean up old messages
      this.cleanupOldMessages();
    } catch (error) {
      console.error('Error broadcasting message:', error);
    }
  }

  // Clean up old messages
  private cleanupOldMessages(): void {
    try {
      const keys = Object.keys(localStorage);
      const syncKeys = keys.filter(key => key.startsWith(this.syncKey));
      
      // Keep only the last 10 messages
      if (syncKeys.length > 10) {
        syncKeys.sort().slice(0, syncKeys.length - 10).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.error('Error cleaning up messages:', error);
    }
  }

  // Setup cross-tab communication
  private setupCrossTabCommunication(): void {
    // Listen for storage changes
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith(this.syncKey) && event.newValue) {
        try {
          const message: SyncMessage = JSON.parse(event.newValue);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing sync message:', error);
        }
      }
    });

    // Listen for custom events
    window.addEventListener('realtime-sync-message', (event: any) => {
      if (event.detail) {
        this.handleMessage(event.detail);
      }
    });

    // Listen for focus events
    window.addEventListener('focus', () => {
      if (this.isOnline) {
        this.connect();
      }
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.connect();
      }
    });
  }

  // Handle incoming message
  private handleMessage(message: SyncMessage): void {
    // Don't process messages from the same session
    if (message.sessionId === this.sessionId) {
      return;
    }

    switch (message.type) {
      case 'ping':
        this.handlePing(message);
        break;
      case 'pong':
        this.handlePong(message);
        break;
      case 'data_update':
        this.handleDataUpdate(message);
        break;
      case 'sync_request':
        this.handleSyncRequest(message);
        break;
      case 'sync_response':
        this.handleSyncResponse(message);
        break;
    }
  }

  // Handle ping message
  private handlePing(message: SyncMessage): void {
    // Respond with pong
    const pongMessage: SyncMessage = {
      type: 'pong',
      timestamp: Date.now(),
      source: 'realtime-sync',
      browser: this.connectionStatus.browser,
      sessionId: this.sessionId
    };
    
    this.broadcastMessage(pongMessage);
  }

  // Handle pong message
  private handlePong(message: SyncMessage): void {
    this.connectionStatus.lastPong = Date.now();
    this.connectionStatus.latency = this.connectionStatus.lastPong - this.connectionStatus.lastPing;
    this.connectionStatus.isConnected = true;
  }

  // Handle data update
  private handleDataUpdate(message: SyncMessage): void {
    if (message.data) {
      // Update local storage
      localStorage.setItem('betting_app_universal_data', JSON.stringify(message.data));
      
      // Notify listeners
      this.notifyListeners(message.data);
    }
  }

  // Handle sync request
  private handleSyncRequest(message: SyncMessage): void {
    // Respond with current data
    const currentData = localStorage.getItem('betting_app_universal_data');
    if (currentData) {
      const data: UniversalStorageData = JSON.parse(currentData);
      const responseMessage: SyncMessage = {
        type: 'sync_response',
        data: data,
        timestamp: Date.now(),
        source: 'realtime-sync',
        browser: this.connectionStatus.browser,
        sessionId: this.sessionId
      };
      
      this.broadcastMessage(responseMessage);
    }
  }

  // Handle sync response
  private handleSyncResponse(message: SyncMessage): void {
    if (message.data) {
      // Update local storage
      localStorage.setItem('betting_app_universal_data', JSON.stringify(message.data));
      
      // Notify listeners
      this.notifyListeners(message.data);
    }
  }

  // Stop the service
  stop(): void {
    this.isEnabled = false;
    this.connectionStatus.isConnected = false;
    
    this.stopPing();
    this.stopRealtimeSync();
    
    console.log('Real-time sync service stopped');
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
        console.error('Error in real-time sync listener:', error);
      }
    });
  }

  // Send data update
  sendDataUpdate(data: UniversalStorageData): void {
    if (this.isEnabled && this.isOnline) {
      this.broadcastDataUpdate(data);
    }
  }

  // Force sync
  async forceSync(): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }
    
    try {
      // Request sync from other tabs
      const syncRequest: SyncMessage = {
        type: 'sync_request',
        timestamp: Date.now(),
        source: 'realtime-sync',
        browser: this.connectionStatus.browser,
        sessionId: this.sessionId
      };
      
      this.broadcastMessage(syncRequest);
      return true;
    } catch (error) {
      console.error('Error forcing sync:', error);
      return false;
    }
  }

  // Get connection status
  getStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Get sync status
  getSyncStatus(): {
    isEnabled: boolean;
    isConnected: boolean;
    isOnline: boolean;
    latency: number;
    browser: string;
    sessionId: string;
  } {
    return {
      isEnabled: this.isEnabled,
      isConnected: this.connectionStatus.isConnected,
      isOnline: this.isOnline,
      latency: this.connectionStatus.latency,
      browser: this.connectionStatus.browser,
      sessionId: this.sessionId
    };
  }

  // Export data
  exportData(): string {
    const data = localStorage.getItem('betting_app_universal_data');
    return data || '{}';
  }

  // Import data
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      localStorage.setItem('betting_app_universal_data', jsonData);
      this.broadcastDataUpdate(data);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem('betting_app_universal_data');
    
    // Clear sync messages
    const keys = Object.keys(localStorage);
    keys.filter(key => key.startsWith(this.syncKey)).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Broadcast clear message
    const clearData: UniversalStorageData = {
      gameState: null,
      users: [],
      currentUser: null,
      betHistory: [],
      userBetReceipts: [],
      creditTransactions: [],
      localAdminState: null
    };
    
    this.broadcastDataUpdate(clearData);
  }
}

// Create singleton instance
export const realtimeSyncService = new RealtimeSyncService();

// Auto-initialize
realtimeSyncService.initialize();
