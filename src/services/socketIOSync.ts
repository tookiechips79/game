import { io, Socket } from 'socket.io-client';
import { UniversalStorageData } from '@/utils/universalStorage';

// Socket.IO configuration
const SOCKET_CONFIG = {
  // For development, we'll use a public Socket.IO server
  // In production, you'd use your own server
  url: 'https://socketio-chat-h9jt.herokuapp.com/', // Public test server
  options: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true,
  }
};

// Message types
interface SocketMessage {
  type: 'data_update' | 'user_join' | 'user_leave' | 'game_update' | 'bet_update';
  data: UniversalStorageData;
  timestamp: number;
  source: string;
  device: string;
  userId?: string;
  roomId?: string;
}

class SocketIOSyncService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: ((data: UniversalStorageData) => void)[] = [];
  private statusListeners: ((status: any) => void)[] = [];
  private lastMessageTime = 0;
  private messageQueue: SocketMessage[] = [];
  private roomId = 'betting-app-room';

  constructor() {
    console.log('🚀 SocketIOSyncService constructor called');
    this.initializeSocket();
  }

  private initializeSocket(): void {
    try {
      console.log('🔧 Initializing Socket.IO with config:', SOCKET_CONFIG);
      
      // Initialize Socket.IO client
      this.socket = io(SOCKET_CONFIG.url, SOCKET_CONFIG.options);

      // Set up connection event handlers
      this.socket.on('connect', () => {
        console.log('🔌 Socket.IO connected successfully');
        console.log('🔍 Socket ID:', this.socket?.id);
        console.log('🔍 Browser:', this.getBrowserInfo());
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.joinRoom();
        this.processMessageQueue();
        this.notifyStatusListeners();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected:', reason);
        this.isConnected = false;
        this.notifyStatusListeners();
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Socket.IO connection error:', error);
        this.handleConnectionError();
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.joinRoom();
        this.processMessageQueue();
        this.notifyStatusListeners();
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Socket.IO reconnection attempt:', attemptNumber);
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('🔌 Socket.IO reconnection error:', error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ Socket.IO reconnection failed');
        this.handleConnectionError();
      });

      // Set up message event handlers
      this.socket.on('data-update', (message: SocketMessage) => {
        this.handleDataUpdate(message);
      });

      this.socket.on('user-join', (message: SocketMessage) => {
        console.log('👤 User joined:', message.userId);
        this.handleDataUpdate(message);
      });

      this.socket.on('user-leave', (message: SocketMessage) => {
        console.log('👤 User left:', message.userId);
        this.handleDataUpdate(message);
      });

      this.socket.on('game-update', (message: SocketMessage) => {
        console.log('🎮 Game state updated');
        this.handleDataUpdate(message);
      });

      this.socket.on('bet-update', (message: SocketMessage) => {
        console.log('💰 Bet updated');
        this.handleDataUpdate(message);
      });

      // Join the betting app room
      this.joinRoom();

    } catch (error) {
      console.error('Failed to initialize Socket.IO:', error);
      this.handleConnectionError();
    }
  }

  private joinRoom(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-room', this.roomId);
      console.log('📡 Joined room:', this.roomId);
    }
  }

  private handleDataUpdate(message: SocketMessage): void {
    try {
      // Validate message
      if (!message.data || !message.timestamp) {
        console.warn('Invalid Socket.IO message received:', message);
        return;
      }

      // Check if message is recent (within last 5 minutes)
      const messageAge = Date.now() - message.timestamp;
      if (messageAge > 5 * 60 * 1000) {
        console.warn('Received stale Socket.IO message, ignoring');
        return;
      }

      // Update last message time
      this.lastMessageTime = Date.now();

      // Notify listeners
      this.listeners.forEach(listener => {
        try {
          listener(message.data);
        } catch (error) {
          console.error('Error in Socket.IO message listener:', error);
        }
      });

      console.log('🔄 Socket.IO data update processed:', message.type);

    } catch (error) {
      console.error('Error handling Socket.IO data update:', error);
    }
  }

  private handleConnectionError(): void {
    this.isConnected = false;
    this.notifyStatusListeners();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect Socket.IO (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      console.log(`🔍 Browser: ${this.getBrowserInfo()}, Device: ${this.getDeviceInfo()}`);
      
      setTimeout(() => {
        this.initializeSocket();
      }, delay);
    } else {
      console.error('❌ Max Socket.IO reconnection attempts reached');
      console.error('🔍 Browser:', this.getBrowserInfo());
      console.error('🔍 Falling back to URL sync mode');
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

  private sendMessage(message: SocketMessage): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket.IO not connected, queuing message');
      this.messageQueue.push(message);
      return;
    }

    try {
      // Send message to Socket.IO server
      this.socket.emit('data-update', message);
      console.log('📤 Socket.IO message sent:', message.type);

    } catch (error) {
      console.error('Failed to send Socket.IO message:', error);
      this.messageQueue.push(message);
    }
  }

  // Public methods
  public sendDataUpdate(data: UniversalStorageData): void {
    const message: SocketMessage = {
      type: 'data_update',
      data,
      timestamp: Date.now(),
      source: 'socketio-sync',
      device: this.getDeviceInfo(),
      userId: this.getUserId(),
      roomId: this.roomId,
    };

    this.sendMessage(message);
  }

  public sendUserJoin(userId: string, data: UniversalStorageData): void {
    const message: SocketMessage = {
      type: 'user_join',
      data,
      timestamp: Date.now(),
      source: 'socketio-sync',
      device: this.getDeviceInfo(),
      userId,
      roomId: this.roomId,
    };

    this.sendMessage(message);
  }

  public sendUserLeave(userId: string, data: UniversalStorageData): void {
    const message: SocketMessage = {
      type: 'user_leave',
      data,
      timestamp: Date.now(),
      source: 'socketio-sync',
      device: this.getDeviceInfo(),
      userId,
      roomId: this.roomId,
    };

    this.sendMessage(message);
  }

  public sendGameUpdate(data: UniversalStorageData): void {
    const message: SocketMessage = {
      type: 'game_update',
      data,
      timestamp: Date.now(),
      source: 'socketio-sync',
      device: this.getDeviceInfo(),
      userId: this.getUserId(),
      roomId: this.roomId,
    };

    this.sendMessage(message);
  }

  public sendBetUpdate(data: UniversalStorageData): void {
    const message: SocketMessage = {
      type: 'bet_update',
      data,
      timestamp: Date.now(),
      source: 'socketio-sync',
      device: this.getDeviceInfo(),
      userId: this.getUserId(),
      roomId: this.roomId,
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
        console.error('Error in Socket.IO status listener:', error);
      }
    });
  }

  public getStatus(): any {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      lastMessageTime: this.lastMessageTime,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      device: this.getDeviceInfo(),
      userId: this.getUserId(),
      roomId: this.roomId,
    };
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  public getConnectionLatency(): number {
    if (!this.socket || !this.isConnected) return -1;
    
    // Simple latency calculation based on last message time
    if (this.lastMessageTime > 0) {
      return Date.now() - this.lastMessageTime;
    }
    
    return -1;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
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

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
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
export const socketIOSyncService = new SocketIOSyncService();
export default socketIOSyncService;
