import { io, Socket } from 'socket.io-client';

export interface BetSyncData {
  teamAQueue?: any[];
  teamBQueue?: any[];
  bookedBets?: any[];
  nextGameBets?: any[];
  nextTeamAQueue?: any[];
  nextTeamBQueue?: any[];
  totalBookedAmount?: number;
  nextTotalBookedAmount?: number;
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
  serverStartTime?: number | null;  // Server's start time in milliseconds (null if paused)
  accumulatedTime?: number;  // Time accumulated before this session started
  arenaId?: string;  // Arena identifier
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
  private arenaId: string = 'default';
  private lastIdentifiedArena: string = 'default';

  constructor() {
    console.log('🚀 SocketIOService constructor called');
    this.updateArenaId();
    // Initialize lastIdentifiedArena from the current hash to ensure correct arena on first emit
    this.lastIdentifiedArena = this.getArenaId();
    console.log(`📍 Initialized lastIdentifiedArena to: ${this.lastIdentifiedArena}`);
    this.initializeSocket();
  }

  private updateArenaId() {
    // Detect arena from URL hash (using hash routing)
    const hash = window.location.hash;
    console.log(`🔍 [DEBUG] Raw hash value: "${hash}"`);
    console.log(`🔍 [DEBUG] Checking if hash includes "/one-pocket-arena":`, hash.includes('/one-pocket-arena'));
    if (hash.includes('/one-pocket-arena')) {
      this.arenaId = 'one_pocket';
    } else {
      this.arenaId = 'default';
    }
    console.log(`📍 Arena ID set to: ${this.arenaId} (from hash: ${hash})`);
  }

  private getArenaId(): string {
    // Detect arena from URL hash at runtime (using hash routing)
    const hash = window.location.hash;
    console.log(`🔍 [DEBUG-GET] Raw hash value: "${hash}"`);
    if (hash.includes('/one-pocket-arena')) {
      return 'one_pocket';
    }
    return 'default';
  }

  // Check if we need to re-identify with a different arena
  private checkAndReidentifyArena() {
    const currentArena = this.getArenaId();
    if (currentArena !== this.lastIdentifiedArena && this.socket?.connected) {
      console.log(`🔄 Arena change detected: ${this.lastIdentifiedArena} → ${currentArena}. Re-identifying...`);
      this.socket?.emit('set-arena', { arenaId: currentArena });
      this.lastIdentifiedArena = currentArena;
    }
  }

  private initializeSocket() {
    try {
      // Check if Socket.IO client is available
      if (typeof io === 'undefined') {
        console.error('❌ Socket.IO client library not loaded!');
        return;
      }
      
      console.log('✅ Socket.IO client library loaded successfully');
      
      // For Render deployment, backend and frontend are on the same domain
      // For local dev, use localhost:3001
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const serverUrl = isLocalhost ? `http://${window.location.hostname}:3001` : undefined;
      
      console.log('🔌 Connecting to Socket.IO');
      console.log('🌐 Current page URL:', window.location.href);
      console.log('📍 Hostname:', window.location.hostname);
      console.log('🏭 Is Localhost:', isLocalhost);
      console.log('📌 Server URL:', serverUrl || 'same domain (Render)');
      
      // Start connection timing
      const connectionStartTime = Date.now();
      console.log('⏱️ Connection attempt started at:', new Date().toISOString());
      
      const ioOptions = {
        transports: ['polling', 'websocket'],
        timeout: 30000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      };
      
      this.socket = serverUrl ? io(serverUrl, ioOptions) : io(ioOptions);

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
      
      // Send arena ID to server
      const currentArenaId = this.getArenaId();
      console.log(`📤 Sending arena ID to server: ${currentArenaId}`);
      this.socket?.emit('set-arena', { arenaId: currentArenaId });
      
      // Request current game state immediately on connection
      console.log('📤 Requesting current game state from server');
      this.socket?.emit('request-game-state', { arenaId: currentArenaId });
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
    this.checkAndReidentifyArena();
    if (this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      console.log(`📤 Emitting bet update for arena '${arenaId}':`, betData);
      console.log(`📤 [EMIT CHECK] teamAQueue - type: ${typeof betData.teamAQueue}, isArray: ${Array.isArray(betData.teamAQueue)}, value:`, betData.teamAQueue);
      console.log(`📤 [EMIT CHECK] teamBQueue - type: ${typeof betData.teamBQueue}, isArray: ${Array.isArray(betData.teamBQueue)}, value:`, betData.teamBQueue);
      console.log(`📤 [EMIT CHECK] bookedBets - type: ${typeof betData.bookedBets}, isArray: ${Array.isArray(betData.bookedBets)}, value:`, betData.bookedBets);
      const dataToSend = { ...betData, arenaId };
      console.log(`📤 [FINAL DATA] About to emit:`, dataToSend);
      this.socket?.emit('bet-update', dataToSend);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit bet update');
    }
  }

  public emitGameStateUpdate(gameStateData: GameStateSyncData) {
    this.checkAndReidentifyArena();
    if (this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      console.log(`📤 Emitting game state update for arena '${arenaId}':`, gameStateData);
      this.socket?.emit('game-state-update', { ...gameStateData, arenaId });
    } else {
      console.warn('⚠️ Socket not connected, cannot emit game state update');
    }
  }

  public emitTimerUpdate(timerData: TimerSyncData) {
    this.checkAndReidentifyArena();
    if (this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      console.log(`📤 Emitting timer update for arena '${arenaId}':`, timerData);
      this.socket?.emit('timer-update', { ...timerData, arenaId });
    } else {
      console.warn('⚠️ Socket not connected, cannot emit timer update');
    }
  }

  public emitScoreUpdate(scoreData: ScoreSyncData) {
    this.checkAndReidentifyArena();
    if (this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      console.log(`📤 Emitting score update for arena '${arenaId}':`, scoreData);
      this.socket?.emit('score-update', { ...scoreData, arenaId });
    } else {
      console.warn('⚠️ Socket not connected, cannot emit score update');
    }
  }

  // Public methods for listening to events
  public onBetUpdate(callback: (data: BetSyncData) => void) {
    if (this.socket) {
      console.log('📥 [LISTENER] Setting up bet-update listener');
      this.socket.on('bet-update', (data: BetSyncData) => {
        console.log('📥 [CALLBACK] bet-update callback triggered with data:', data);
        callback(data);
      });
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
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      this.socket.emit('timer-heartbeat');
    }
  }

  // Request latest game state from server (used when switching arenas)
  public requestGameState() {
    this.checkAndReidentifyArena();
    if (this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      console.log(`📤 Requesting game state for arena '${arenaId}'`);
      this.socket?.emit('request-game-state', { arenaId });
    } else {
      console.warn('⚠️ Socket not connected, cannot request game state');
    }
  }

  public emitBreakStatusUpdate(teamAHasBreak: boolean) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      console.log('📤 Emitting dedicated break status update:', teamAHasBreak);
      this.socket.emit('break-status-update', { teamAHasBreak, arenaId });
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

  // Total Booked Coins - Emit separately to update wallet
  public emitTotalBookedCoinsUpdate(totalBookedAmount: number, nextTotalBookedAmount: number) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      console.log('📤 Emitting total booked coins update');
      this.socket.emit('total-booked-coins-update', { totalBookedAmount, nextTotalBookedAmount, arenaId });
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
    this.checkAndReidentifyArena();
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
    this.checkAndReidentifyArena();
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
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Emitting user login:', userData.name, 'with', userData.credits, 'coins');
      this.socket.emit('user-login', userData);
    }
  }

  // User logout tracking for connected users coins calculation
  public emitUserLogout(userData: { id: string; name: string; credits: number }) {
    this.checkAndReidentifyArena();
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
    this.checkAndReidentifyArena();
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

  // Game History Synchronization
  public emitGameHistoryUpdate(gameHistory: any[]) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      console.log('📤 Emitting game history update:', gameHistory.length, 'records');
      this.socket.emit('game-history-update', { gameHistory, arenaId });
    }
  }

  public onGameHistoryUpdate(callback: (data: { gameHistory: any[] }) => void) {
    if (this.socket) {
      // Remove any existing listeners first to prevent duplicates
      this.socket.off('game-history-update');
      
      this.socket.on('game-history-update', (data: { gameHistory: any[] }) => {
        console.log('📥 [SocketIOService] Received game history update:', data.gameHistory?.length, 'records');
        console.log('🔔 [SocketIOService] Calling callback with', data.gameHistory?.length, 'records');
        callback(data);
      });
    }
  }

  // Bet Receipts Synchronization
  public emitBetReceiptsUpdate(betReceipts: any[]) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      console.log('📤 Emitting bet receipts update:', betReceipts.length, 'receipts');
      this.socket.emit('bet-receipts-update', { betReceipts, arenaId });
    }
  }

  public onBetReceiptsUpdate(callback: (data: { betReceipts: any[] }) => void) {
    if (this.socket) {
      // Remove any existing listeners first to prevent duplicates
      this.socket.off('bet-receipts-update');
      
      this.socket.on('bet-receipts-update', (data: { betReceipts: any[] }) => {
        console.log('📥 [SocketIOService] Received bet receipts update:', data.betReceipts?.length, 'receipts');
        console.log('🔔 [SocketIOService] Calling callback with', data.betReceipts?.length, 'receipts');
        callback(data);
      });
    }
  }

  // Clear All Data - Admin command to clear everything on all clients
  public emitClearAllData() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Emitting clear all data command');
      this.socket.emit('clear-all-data', { timestamp: Date.now() });
    }
  }

  public onClearAllData(callback: () => void) {
    if (this.socket) {
      this.socket.off('clear-all-data');
      this.socket.on('clear-all-data', () => {
        console.log('📥 [SocketIOService] Received clear all data command');
        callback();
      });
    }
  }

  // Pause listeners during clear - broadcast to all clients
  public emitPauseListeners() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Emitting pause listeners command to ALL clients');
      this.socket.emit('pause-listeners', { timestamp: Date.now() });
    }
  }

  public onPauseListeners(callback: () => void) {
    if (this.socket) {
      this.socket.off('pause-listeners');
      this.socket.on('pause-listeners', () => {
        console.log('📥 [SocketIOService] Received pause listeners command');
        callback();
      });
    }
  }

  // Resume listeners after clear - broadcast to all clients
  public emitResumeListeners() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 Emitting resume listeners command to ALL clients');
      this.socket.emit('resume-listeners', { timestamp: Date.now() });
    }
  }

  public onResumeListeners(callback: () => void) {
    if (this.socket) {
      this.socket.off('resume-listeners');
      this.socket.on('resume-listeners', () => {
        console.log('📥 [SocketIOService] Received resume listeners command');
        callback();
      });
    }
  }

  // Peer-to-Peer Game History Sharing Methods
  public requestGameHistoryFromClients() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 [P2P] Requesting game history from other clients');
      this.socket.emit('request-game-history-from-clients');
    }
  }

  public onClientRequestsGameHistory(callback: (data: { clientId: string; requestedAt: number }) => void) {
    if (this.socket) {
      this.socket.off('client-requesting-game-history');
      this.socket.on('client-requesting-game-history', (data) => {
        console.log('📨 [P2P] Another client requesting game history');
        callback(data);
      });
    }
  }

  public sendGameHistoryToClient(gameHistory: any[]) {
    if (this.socket && this.isSocketConnected()) {
      console.log('📤 [P2P] Sending game history to peers:', gameHistory.length, 'records');
      this.socket.emit('provide-game-history-to-client', { gameHistory });
    }
  }

  public onReceiveGameHistoryFromClients(callback: (data: { gameHistory: any[]; providedBy: string; providedAt: number }) => void) {
    if (this.socket) {
      this.socket.off('receive-game-history-from-clients');
      this.socket.on('receive-game-history-from-clients', (data) => {
        console.log('📥 [P2P] Received game history from peers:', data.gameHistory?.length, 'records');
        callback(data);
      });
    }
  }

  // Cleanup methods for proper listener removal
  public offGameHistoryUpdate() {
    if (this.socket) {
      this.socket.off('game-history-update');
    }
  }

  public offBetReceiptsUpdate() {
    if (this.socket) {
      this.socket.off('bet-receipts-update');
    }
  }

  public offClearAllData() {
    if (this.socket) {
      this.socket.off('clear-all-data');
    }
  }

  public offPauseListeners() {
    if (this.socket) {
      this.socket.off('pause-listeners');
    }
  }

  public offResumeListeners() {
    if (this.socket) {
      this.socket.off('resume-listeners');
    }
  }

  public offClientRequestsGameHistory() {
    if (this.socket) {
      this.socket.off('client-requesting-game-history');
    }
  }

  public offReceiveGameHistoryFromClients() {
    if (this.socket) {
      this.socket.off('receive-game-history-from-clients');
    }
  }
}

// Create singleton instance
export const socketIOService = new SocketIOService();

// Test if the service is working
console.log('🔧 SocketIOService singleton created:', socketIOService);

// Export the class for testing
export default SocketIOService;
