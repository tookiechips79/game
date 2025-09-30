// WebSocket Sync Service
// This service provides real-time data synchronization using WebSockets
// with fallback to URL-based sync for maximum compatibility

import { UniversalStorageData } from '@/utils/universalStorage';

interface WebSocketMessage {
  type: 'data_update' | 'ping' | 'pong' | 'sync_request' | 'sync_response' | 'user_join' | 'user_leave';
  data?: UniversalStorageData;
  timestamp: number;
  source: string;
  device: string;
  userId?: string;
  roomId?: string;
}

interface WebSocketStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastPing: number;
  lastPong: number;
  latency: number;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  connectionUrl: string;
}

class WebSocketSyncService {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus;
  private listeners: ((data: UniversalStorageData) => void)[] = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;
  private roomId: string = 'betting-app-global';
  private userId: string;
  private deviceInfo: string;

  // WebSocket server options (you can change these)
  private wsUrls = [
    'wss://echo.websocket.org', // Public test server
    'wss://ws.postman-echo.com/raw', // Postman echo server
    // Add your own WebSocket server here
  ];

  constructor() {
    this.userId = this.generateUserId();
    this.deviceInfo = this.getDeviceInfo();
    this.status = {
      isConnected: false,
      isConnecting: false,
      lastPing: 0,
      lastPong: 0,
      latency: 0,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      connectionUrl: ''
    };
  }

  // Initialize WebSocket connection
  initialize(): void {
    this.isEnabled = true;
    console.log('🔌 WebSocket sync service initializing...');
    this.connect();
  }

  // Generate unique user ID
  private generateUserId(): string {
    let userId = localStorage.getItem('websocket_user_id');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('websocket_user_id', userId);
    }
    return userId;
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

  // Connect to WebSocket server
  private connect(): void {
    if (!this.isEnabled || this.status.isConnecting || this.status.isConnected) {
      return;
    }

    this.status.isConnecting = true;
    console.log('🔌 Attempting WebSocket connection...');

    // Try each WebSocket URL
    for (const url of this.wsUrls) {
      try {
        this.status.connectionUrl = url;
        this.ws = new WebSocket(url);
        this.setupWebSocketEvents();
        break;
      } catch (error) {
        console.warn(`Failed to connect to ${url}:`, error);
        continue;
      }
    }

    if (!this.ws) {
      console.warn('⚠️ No WebSocket servers available, falling back to URL sync');
      this.status.isConnecting = false;
      return;
    }
  }

  // Setup WebSocket event handlers
  private setupWebSocketEvents(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      this.status.isConnected = true;
      this.status.isConnecting = false;
      this.status.reconnectAttempts = 0;
      this.startPing();
      this.joinRoom();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.warn('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket connection closed');
      this.status.isConnected = false;
      this.status.isConnecting = false;
      this.stopPing();
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.status.isConnected = false;
      this.status.isConnecting = false;
    };
  }

  // Handle incoming WebSocket messages
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'pong':
        this.handlePong(message);
        break;
      case 'data_update':
        this.handleDataUpdate(message);
        break;
      case 'sync_response':
        this.handleSyncResponse(message);
        break;
      case 'user_join':
        console.log(`👤 User joined: ${message.userId}`);
        break;
      case 'user_leave':
        console.log(`👤 User left: ${message.userId}`);
        break;
    }
  }

  // Handle pong message
  private handlePong(message: WebSocketMessage): void {
    this.status.lastPong = Date.now();
    this.status.latency = this.status.lastPong - this.status.lastPing;
  }

  // Handle data update
  private handleDataUpdate(message: WebSocketMessage): void {
    if (message.data) {
      // Update local storage
      localStorage.setItem('betting_app_universal_data', JSON.stringify(message.data));
      
      // Notify listeners
      this.notifyListeners(message.data);
      
      console.log('📡 Data received via WebSocket');
    }
  }

  // Handle sync response
  private handleSyncResponse(message: WebSocketMessage): void {
    if (message.data) {
      // Update local storage
      localStorage.setItem('betting_app_universal_data', JSON.stringify(message.data));
      
      // Notify listeners
      this.notifyListeners(message.data);
      
      console.log('📡 Sync response received via WebSocket');
    }
  }

  // Join room
  private joinRoom(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const message: WebSocketMessage = {
      type: 'user_join',
      timestamp: Date.now(),
      source: 'websocket-sync',
      device: this.deviceInfo,
      userId: this.userId,
      roomId: this.roomId
    };

    this.ws.send(JSON.stringify(message));
  }

  // Start ping mechanism
  private startPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000); // Ping every 30 seconds
  }

  // Stop ping mechanism
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Send ping message
  private sendPing(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const message: WebSocketMessage = {
      type: 'ping',
      timestamp: Date.now(),
      source: 'websocket-sync',
      device: this.deviceInfo,
      userId: this.userId
    };

    this.status.lastPing = Date.now();
    this.ws.send(JSON.stringify(message));
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (!this.isEnabled || this.status.reconnectAttempts >= this.status.maxReconnectAttempts) {
      console.log('⚠️ Max reconnection attempts reached, falling back to URL sync');
      return;
    }

    this.status.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.status.reconnectAttempts), 30000); // Exponential backoff

    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.status.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Send data update
  sendDataUpdate(data: UniversalStorageData): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('⚠️ WebSocket not connected, data not sent');
      return;
    }

    const message: WebSocketMessage = {
      type: 'data_update',
      data: data,
      timestamp: Date.now(),
      source: 'websocket-sync',
      device: this.deviceInfo,
      userId: this.userId,
      roomId: this.roomId
    };

    this.ws.send(JSON.stringify(message));
    console.log('📡 Data sent via WebSocket');
  }

  // Force sync
  async forceSync(): Promise<boolean> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    const message: WebSocketMessage = {
      type: 'sync_request',
      timestamp: Date.now(),
      source: 'websocket-sync',
      device: this.deviceInfo,
      userId: this.userId,
      roomId: this.roomId
    };

    this.ws.send(JSON.stringify(message));
    return true;
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
        console.error('Error in WebSocket sync listener:', error);
      }
    });
  }

  // Get connection status
  getStatus(): WebSocketStatus {
    return { ...this.status };
  }

  // Stop the service
  stop(): void {
    this.isEnabled = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.stopPing();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    console.log('🔌 WebSocket sync service stopped');
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
      this.sendDataUpdate(data);
      return true;
    } catch (error) {
      console.error('Error importing WebSocket data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem('betting_app_universal_data');
    
    const clearData: UniversalStorageData = {
      gameState: null,
      users: [],
      currentUser: null,
      betHistory: [],
      userBetReceipts: [],
      creditTransactions: [],
      localAdminState: null
    };
    
    this.sendDataUpdate(clearData);
  }
}

// Create singleton instance
export const websocketSyncService = new WebSocketSyncService();

// Auto-initialize
websocketSyncService.initialize();
