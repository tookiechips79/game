import { io, Socket } from 'socket.io-client';

export interface BetSyncData {
  teamAQueue?: any[];
  teamBQueue?: any[];
  bookedBets?: any[];
  nextGameBets?: any[];
  nextTeamAQueue?: any[];
  nextTeamBQueue?: any[];
}

export interface GameStateSyncData {
  teamAScore?: number;
  teamBScore?: number;
  teamABalls?: number;
  teamBBalls?: number;
  isTimerRunning?: boolean;
  timerSeconds?: number;
  isGameActive?: boolean;
  winner?: string | null;
  currentGameNumber?: number; // Added for game number synchronization
  teamAHasBreak?: boolean; // Added for break status synchronization
  gameInfo?: {
    teamAName: string;
    teamBName: string;
    gameTitle: string;
    gameDescription: string;
  };
}

export interface TimerSyncData {
  isTimerRunning: boolean;
  timerSeconds: number;
}

export interface ScoreSyncData {
  teamAScore: number;
  teamBScore: number;
}

class SocketIOService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    console.log('🚀 SocketIOService constructor called');
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      // Check if Socket.IO client is available
      if (typeof io === 'undefined') {
        console.error('❌ Socket.IO client library not loaded!');
        return;
      }
      
      console.log('✅ Socket.IO client library loaded successfully');
      
      // Determine if we're in production by checking the hostname
      const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('192.168');
      
      const serverUrl = isProduction
        ? 'https://game-production-861d.up.railway.app'  // Railway backend
        : `http://${window.location.hostname}:3001`;
      
      console.log('🔌 Connecting to Socket.IO server:', serverUrl);
      console.log('🌐 Current page URL:', window.location.href);
      console.log('📍 Hostname:', window.location.hostname);
      console.log('🏭 Is Production:', isProduction);
      
      // Start connection timing
      const connectionStartTime = Date.now();
      console.log('⏱️ Connection attempt started at:', new Date().toISOString());
      
      this.socket = io(serverUrl, {
        transports: ['polling'],
        timeout: 30000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        query: { 
          timestamp: Date.now()
        }
      });

      console.log('🔌 Socket.IO client created');

      this.setupEventListeners(serverUrl, connectionStartTime);
      
      // Add a timeout check
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          console.warn('⚠️ Socket.IO connection not established after 15 seconds');
        }
      }, 15000);
      
    } catch (error) {
      console.error('⚠️ Failed to initialize Socket.IO:', error);
    }
  }

  private setupEventListeners(serverUrl: string, connectionStartTime: number) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      const connectionTime = Date.now() - connectionStartTime;
      console.log('✅ Socket.IO connected:', this.socket?.id);
      console.log('🌐 Server URL:', serverUrl);
      console.log('⏱️ Connection time:', connectionTime + 'ms');
      console.log('🔗 Transport used:', this.socket?.io.engine.transport.name);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      console.log('🔄 Will attempt to reconnect automatically...');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      const connectionTime = Date.now() - connectionStartTime;
      console.error('❌ Socket.IO connection error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type,
        transport: error.transport
      });
      console.error('⏱️ Connection failed after:', connectionTime + 'ms');
      console.log('🔄 Will attempt to reconnect automatically...');
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket.IO reconnect error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnect failed - giving up');
      this.isConnected = false;
    });

    this.socket.on('reconnecting', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnecting... attempt', attemptNumber);
    });

    // Add connection attempt tracking
    this.socket.on('connect_attempt', () => {
      console.log('🔄 Socket.IO connection attempt started');
    });
  }

  // Socket.IO handles reconnection automatically with the configuration above

  // Public methods for emitting events
  public emitBetUpdate(betData: BetSyncData) {
    if (this.isSocketConnected()) {
      console.log('📤 Emitting bet update:', betData);
      this.socket?.emit('bet-update', betData);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit bet update');
    }
  }

  public emitGameStateUpdate(gameStateData: GameStateSyncData) {
    if (this.isSocketConnected()) {
      console.log('📤 Emitting game state update:', gameStateData);
      this.socket?.emit('game-state-update', gameStateData);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit game state update');
    }
  }

  public emitTimerUpdate(timerData: TimerSyncData) {
    if (this.isSocketConnected()) {
      console.log('📤 Emitting timer update:', timerData);
      this.socket?.emit('timer-update', timerData);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit timer update');
    }
  }

  public emitScoreUpdate(scoreData: ScoreSyncData) {
    if (this.isSocketConnected()) {
      console.log('📤 Emitting score update:', scoreData);
      this.socket?.emit('score-update', scoreData);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit score update');
    }
  }

  // Public methods for listening to events
  public onBetUpdate(callback: (data: BetSyncData) => void) {
    if (this.socket) {
      this.socket.on('bet-update', callback);
    }
  }

  public onGameStateUpdate(callback: (data: GameStateSyncData) => void) {
    if (this.socket) {
      this.socket.on('game-state-update', callback);
    }
  }

  public onTimerUpdate(callback: (data: TimerSyncData) => void) {
    if (this.socket) {
      this.socket.on('timer-update', callback);
    }
  }

  public onScoreUpdate(callback: (data: ScoreSyncData) => void) {
    if (this.socket) {
      this.socket.on('score-update', callback);
    }
  }

  // Utility methods
  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public getConnectionStatus(): string {
    if (this.isSocketConnected()) {
      return 'Connected';
    } else if (this.socket?.connecting) {
      return 'Connecting...';
    } else {
      return 'Disconnected';
    }
  }

  public emitTimerHeartbeat() {
    if (this.socket && this.isSocketConnected()) {
      this.socket.emit('timer-heartbeat');
    }
  }

  public emitBreakStatusUpdate(teamAHasBreak: boolean) {
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Emitting dedicated break status update:', teamAHasBreak);
      this.socket.emit('break-status-update', { teamAHasBreak });
    }
  }

  public onBreakStatusUpdate(callback: (data: { teamAHasBreak: boolean }) => void) {
    if (this.socket) {
      this.socket.on('break-status-update', (data: { teamAHasBreak: boolean }) => {
        console.log('📥 Received dedicated break status update:', data);
        callback(data);
      });
    }
  }

  // REMOVED: Game history update functions - bet history is now completely local and immutable
  // No external updates can modify bet history

  public emitTotalBookedCoinsUpdate(totalBookedAmount: number, nextTotalBookedAmount: number) {
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Emitting total booked coins update:', { totalBookedAmount, nextTotalBookedAmount });
      this.socket.emit('total-booked-coins-update', { totalBookedAmount, nextTotalBookedAmount });
    }
  }

  public onTotalBookedCoinsUpdate(callback: (data: { totalBookedAmount: number, nextTotalBookedAmount: number }) => void) {
    if (this.socket) {
      this.socket.on('total-booked-coins-update', (data: { totalBookedAmount: number, nextTotalBookedAmount: number }) => {
        console.log('📥 Received total booked coins update:', data);
        callback(data);
      });
    }
  }

  // Bet Receipts Synchronization Methods
  // REMOVED: Bet receipts update functions - bet receipts are now completely local
  // No external updates can modify bet receipts

  // User Wallet Synchronization Methods
  public emitUserWalletUpdate(users: any[]) {
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Emitting user wallet update:', users.length, 'users');
      this.socket.emit('user-wallet-update', { users });
    }
  }

  public onUserWalletUpdate(callback: (data: { users: any[] }) => void) {
    if (this.socket) {
      this.socket.on('user-wallet-update', (data: { users: any[] }) => {
        console.log('📥 Received user wallet update:', data.users.length, 'users');
        callback(data);
      });
    }
  }

  // Request wallet data from server
  public requestWalletData() {
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Requesting wallet data from server');
      this.socket.emit('request-wallet-data');
    }
  }

  public onWalletDataResponse(callback: (data: { users: any[] }) => void) {
    if (this.socket) {
      this.socket.on('wallet-data-response', (data: { users: any[] }) => {
        console.log('📥 Received wallet data response:', data.users.length, 'users');
        callback(data);
      });
    }
  }

  // User login tracking for connected users coins calculation
  public emitUserLogin(userData: { id: string; name: string; credits: number }) {
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Emitting user login:', userData.name, 'with', userData.credits, 'coins');
      this.socket.emit('user-login', userData);
    }
  }

  // User logout tracking for connected users coins calculation
  public emitUserLogout(userData: { id: string; name: string; credits: number }) {
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Emitting user logout:', userData.name, 'with', userData.credits, 'coins');
      this.socket.emit('user-logout', userData);
    }
  }

  // Listen for connected users coins updates
  public onConnectedUsersCoinsUpdate(callback: (data: { totalCoins: number; connectedUserCount: number; connectedUsers: any[] }) => void) {
    if (this.socket) {
      this.socket.on('connected-users-coins-update', (data) => {
        console.log('📥 Received connected users coins update:', data.totalCoins, 'coins from', data.connectedUserCount, 'users');
        callback(data);
      });
    }
  }

  // Request connected users data refresh
  public requestConnectedUsersData() {
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Requesting connected users data refresh');
      this.socket.emit('request-connected-users-data');
    }
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  public getSocketInfo(): { exists: boolean; connected: boolean; id?: string } {
    return {
      exists: !!this.socket,
      connected: this.socket?.connected || false,
      id: this.socket?.id
    };
  }

  public connect() {
    if (this.socket && !this.isSocketConnected()) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

// Create singleton instance
export const socketIOService = new SocketIOService();

// Test if the service is working
console.log('🔧 SocketIOService singleton created:', socketIOService);

// Export the class for testing
export default SocketIOService;
