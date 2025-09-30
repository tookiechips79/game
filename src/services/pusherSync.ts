import Pusher from 'pusher-js';
import { UniversalStorageData } from '@/utils/universalStorage';
import { getPusherConfig } from '@/config/pusher';

// Get Pusher configuration
const PUSHER_CONFIG = getPusherConfig();

// Message types
interface PusherMessage {
  type: 'data_update' | 'user_join' | 'user_leave' | 'game_update' | 'bet_update';
  data: UniversalStorageData;
  timestamp: number;
  source: string;
  device: string;
  userId?: string;
  roomId?: string;
}

class PusherSyncService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private listeners: ((data: UniversalStorageData) => void)[] = [];
  private statusListeners: ((status: any) => void)[] = [];
  private lastMessageTime = 0;
  private messageQueue: PusherMessage[] = [];

  constructor() {
    console.log('🚀 PusherSyncService constructor called');
    // Add Safari-specific initialization delay
    const isSafari = this.getBrowserInfo() === 'Safari';
    if (isSafari) {
      console.log('🍎 Safari detected, adding initialization delay for WebSocket compatibility');
      setTimeout(() => {
        this.initializePusher();
      }, 1000);
    } else {
      console.log('🌐 Non-Safari browser detected, initializing immediately');
      this.initializePusher();
    }
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private initializePusher(): void {
    console.log('🔧 Initializing Pusher with config:', PUSHER_CONFIG);
    try {
      // Initialize Pusher with Safari-compatible settings
      this.pusher = new Pusher(PUSHER_CONFIG.key, {
        cluster: PUSHER_CONFIG.cluster,
        authEndpoint: PUSHER_CONFIG.authEndpoint,
        enabledTransports: ['ws', 'wss', 'xhr_polling', 'xhr_streaming'],
        disabledTransports: [],
        forceTLS: true,
      });

      // Set up connection event handlers
      this.pusher.connection.bind('connected', () => {
        console.log('🔌 Pusher connected successfully');
        console.log('🔍 Browser:', this.getBrowserInfo());
        console.log('🔍 Transport:', (this.pusher.connection as any).transport?.name || 'unknown');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.subscribeToChannel();
        this.processMessageQueue();
        this.notifyStatusListeners();
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('🔌 Pusher disconnected');
        this.isConnected = false;
        this.notifyStatusListeners();
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error('🔌 Pusher connection error:', error);
        console.error('🔍 Browser:', this.getBrowserInfo());
        console.error('🔍 Error details:', error);
        this.handleConnectionError();
      });

      this.pusher.connection.bind('state_change', (states: any) => {
        console.log('🔌 Pusher state changed:', states.previous, '->', states.current);
        this.notifyStatusListeners();
      });

    } catch (error) {
      console.error('Failed to initialize Pusher:', error);
      this.handleConnectionError();
    }
  }

  private subscribeToChannel(): void {
    if (!this.pusher) return;

    try {
      // Subscribe to the main betting data channel
      this.channel = this.pusher.subscribe(PUSHER_CONFIG.channels.BETTING_DATA);

      // Listen for data updates
      this.channel.bind(PUSHER_CONFIG.events.DATA_UPDATE, (message: PusherMessage) => {
        this.handleDataUpdate(message);
      });

      // Listen for user events
      this.channel.bind(PUSHER_CONFIG.events.USER_JOIN, (message: PusherMessage) => {
        console.log('👤 User joined:', message.userId);
        this.handleDataUpdate(message);
      });

      this.channel.bind(PUSHER_CONFIG.events.USER_LEAVE, (message: PusherMessage) => {
        console.log('👤 User left:', message.userId);
        this.handleDataUpdate(message);
      });

      // Listen for game state updates
      this.channel.bind(PUSHER_CONFIG.events.GAME_UPDATE, (message: PusherMessage) => {
        console.log('🎮 Game state updated');
        this.handleDataUpdate(message);
      });

      // Listen for bet updates
      this.channel.bind(PUSHER_CONFIG.events.BET_UPDATE, (message: PusherMessage) => {
        console.log('💰 Bet updated');
        this.handleDataUpdate(message);
      });

      console.log('📡 Subscribed to Pusher channel:', PUSHER_CONFIG.channels.BETTING_DATA);

    } catch (error) {
      console.error('Failed to subscribe to Pusher channel:', error);
    }
  }

  private handleDataUpdate(message: PusherMessage): void {
    try {
      // Validate message
      if (!message.data || !message.timestamp) {
        console.warn('Invalid Pusher message received:', message);
        return;
      }

      // Check if message is recent (within last 5 minutes)
      const messageAge = Date.now() - message.timestamp;
      if (messageAge > 5 * 60 * 1000) {
        console.warn('Received stale Pusher message, ignoring');
        return;
      }

      // Update last message time
      this.lastMessageTime = Date.now();

      // Notify listeners
      this.listeners.forEach(listener => {
        try {
          listener(message.data);
        } catch (error) {
          console.error('Error in Pusher message listener:', error);
        }
      });

      console.log('🔄 Pusher data update processed:', message.type);

    } catch (error) {
      console.error('Error handling Pusher data update:', error);
    }
  }

  private handleConnectionError(): void {
    this.isConnected = false;
    this.notifyStatusListeners();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect to Pusher (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      console.log(`🔍 Browser: ${this.getBrowserInfo()}, Device: ${this.getDeviceInfo()}`);
      
      setTimeout(() => {
        this.initializePusher();
      }, delay);
    } else {
      console.error('❌ Max Pusher reconnection attempts reached');
      console.error('🔍 Browser:', this.getBrowserInfo());
      console.error('🔍 This might be a Safari WebSocket issue. Falling back to URL sync.');
    }
  }

  private processMessageQueue(): void {
    if (this.messageQueue.length > 0 && this.isConnected) {
      console.log(`📤 Processing ${this.messageQueue.length} queued messages`);
      
      this.messageQueue.forEach(message => {
        this.sendMessage(message);
      });
      
      this.messageQueue = [];
    }
  }

  private sendMessage(message: PusherMessage): void {
    if (!this.channel || !this.isConnected) {
      console.warn('Pusher not connected, queuing message');
      this.messageQueue.push(message);
      return;
    }

    try {
      // Send message to Pusher channel
      this.channel.trigger(PUSHER_CONFIG.events.DATA_UPDATE, message);
      console.log('📤 Pusher message sent:', message.type);

    } catch (error) {
      console.error('Failed to send Pusher message:', error);
      this.messageQueue.push(message);
    }
  }

  // Public methods
  public sendDataUpdate(data: UniversalStorageData): void {
    const message: PusherMessage = {
      type: 'data_update',
      data,
      timestamp: Date.now(),
      source: 'pusher-sync',
      device: this.getDeviceInfo(),
      userId: this.getUserId(),
      roomId: 'betting-app',
    };

    this.sendMessage(message);
  }

  public sendUserJoin(userId: string, data: UniversalStorageData): void {
    const message: PusherMessage = {
      type: 'user_join',
      data,
      timestamp: Date.now(),
      source: 'pusher-sync',
      device: this.getDeviceInfo(),
      userId,
      roomId: 'betting-app',
    };

    this.sendMessage(message);
  }

  public sendUserLeave(userId: string, data: UniversalStorageData): void {
    const message: PusherMessage = {
      type: 'user_leave',
      data,
      timestamp: Date.now(),
      source: 'pusher-sync',
      device: this.getDeviceInfo(),
      userId,
      roomId: 'betting-app',
    };

    this.sendMessage(message);
  }

  public sendGameUpdate(data: UniversalStorageData): void {
    const message: PusherMessage = {
      type: 'game_update',
      data,
      timestamp: Date.now(),
      source: 'pusher-sync',
      device: this.getDeviceInfo(),
      userId: this.getUserId(),
      roomId: 'betting-app',
    };

    this.sendMessage(message);
  }

  public sendBetUpdate(data: UniversalStorageData): void {
    const message: PusherMessage = {
      type: 'bet_update',
      data,
      timestamp: Date.now(),
      source: 'pusher-sync',
      device: this.getDeviceInfo(),
      userId: this.getUserId(),
      roomId: 'betting-app',
    };

    this.sendMessage(message);
  }

  public addListener(callback: (data: UniversalStorageData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public addStatusListener(callback: (status: any) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  private notifyStatusListeners(): void {
    const status = this.getStatus();
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in Pusher status listener:', error);
      }
    });
  }

  public getStatus(): any {
    return {
      isConnected: this.isConnected,
      connectionState: this.pusher?.connection?.state || 'disconnected',
      lastMessageTime: this.lastMessageTime,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      device: this.getDeviceInfo(),
      userId: this.getUserId(),
    };
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  public getConnectionLatency(): number {
    if (!this.pusher || !this.isConnected) return -1;
    
    // Simple latency calculation based on last message time
    if (this.lastMessageTime > 0) {
      return Date.now() - this.lastMessageTime;
    }
    
    return -1;
  }

  public disconnect(): void {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
    this.channel = null;
    this.isConnected = false;
    this.listeners = [];
    this.statusListeners = [];
    this.messageQueue = [];
  }

  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'Mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }

  private getUserId(): string {
    // Get current user ID from localStorage or context
    try {
      const currentUser = localStorage.getItem('betting_app_current_user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        return user.id || 'anonymous';
      }
    } catch (error) {
      console.warn('Failed to get user ID:', error);
    }
    return 'anonymous';
  }
}

// Export singleton instance
export const pusherSyncService = new PusherSyncService();
export default pusherSyncService;
