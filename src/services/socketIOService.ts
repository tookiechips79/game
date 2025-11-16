import { io, Socket } from 'socket.io-client';

// DEBUG FLAG - Set to false in production
const DEBUG = false;
const log = (label: string, data?: any) => {
  if (DEBUG) console.log(label, data);
};
const warn = (label: string, data?: any) => {
  if (DEBUG) console.warn(label, data);
};

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

// 🎯 Arena Labels for clear differentiation
const getArenaLabel = (arenaId: string): string => {
  if (arenaId === 'one_pocket') return '🎯 [1-POCKET]';
  return '🎱 [9-BALL]';
};

class SocketIOService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private arenaId: string = 'default';
  private lastIdentifiedArena: string = 'default';

  constructor() {
    log('🚀 SocketIOService constructor called');
    this.updateArenaId();
    // Initialize lastIdentifiedArena from the current hash to ensure correct arena on first emit
    this.lastIdentifiedArena = this.getArenaId();
    log(`📍 Initialized lastIdentifiedArena to: ${this.lastIdentifiedArena}`);
    this.initializeSocket();
  }

  private updateArenaId() {
    // Detect arena from URL hash (using hash routing)
    const hash = window.location.hash;
    log(`🔍 [DEBUG] Raw hash value: "${hash}"`);
    log(`🔍 [DEBUG] Checking if hash includes "/one-pocket-arena":`, hash.includes('/one-pocket-arena'));
    if (hash.includes('/one-pocket-arena')) {
      this.arenaId = 'one_pocket';
    } else {
      this.arenaId = 'default';
    }
    log(`📍 Arena ID set to: ${this.arenaId} (from hash: ${hash})`);
  }

  private getArenaId(): string {
    // Detect arena from URL hash at runtime (using hash routing)
    const hash = window.location.hash;
    log(`🔍 [DEBUG-GET] Raw hash value: "${hash}"`);
    if (hash.includes('/one-pocket-arena')) {
      return 'one_pocket';
    }
    return 'default';
  }

  // Check if we need to re-identify with a different arena
  private checkAndReidentifyArena() {
    const currentArena = this.getArenaId();
    if (currentArena !== this.lastIdentifiedArena && this.socket?.connected) {
      log(`🔄 Arena change detected: ${this.lastIdentifiedArena} → ${currentArena}. Re-identifying...`);
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
      
      log('✅ Socket.IO client library loaded successfully');
      
      // Detect protocol: use HTTPS on production, HTTP on localhost
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      
      // IMPORTANT: Use server-based Socket.IO for ALL environments
      // This ensures all clients (web, mobile, tablet) connect to the same data source
      // 
      // LOCAL: http://localhost:3001 (both frontend and backend on same machine)
      // RENDER: https://gamebird-app.onrender.com (same domain, different ports internally)
      // RESULT: All clients always connect to the backend server, never direct connections
      
      let serverUrl: string;
      
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development via localhost: connect to backend on port 3001
        serverUrl = `http://localhost:3001`;
      } else if (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        // Local network IP (e.g., 192.168.x.x): connect to backend on same IP + port 3001
        // This allows iPad/mobile on same WiFi to connect via IP
        serverUrl = `http://${window.location.hostname}:3001`;
      } else {
        // Production (Render, AWS, etc.): 
        // Both frontend and backend run on same server
        // Connect to same domain - Socket.IO auto-routes to backend
        serverUrl = `${protocol}//${window.location.hostname}`;
      }
      
      console.log(`✅ Socket.IO Server URL: ${serverUrl}`);
      
      log('🔌 Connecting to Socket.IO');
      log('🌐 Current page URL:', window.location.href);
      log('📍 Hostname:', window.location.hostname);
      log('🔒 Protocol:', protocol);
      log('📌 Server URL:', serverUrl);
      log('🌍 Environment detected:', 
        window.location.hostname.includes('render.com') || window.location.hostname.includes('onrender.com')
          ? 'Render Deployment'
          : window.location.hostname === 'localhost' ? 'Local Development' : 'Other');
      console.log(`🌐 Server URL: ${serverUrl}`);
      console.log(`⏱️ Connection attempts: ${this.reconnectAttempts + 1}`);
      
      // Start connection timing
      const connectionStartTime = Date.now();
      log('⏱️ Connection attempt started at:', new Date().toISOString());
      
      const ioOptions = {
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        secure: window.location.protocol === 'https:',
        rejectUnauthorized: false,
        path: '/socket.io/',
        upgrade: true,
        upgradeTimeout: 10000,
        // Critical for CORS on production
        withCredentials: false,
        // Ensure it works with same-origin or cross-origin
        extraHeaders: {
          'Accept-Language': 'en-US'
        }
      };
      
      this.socket = io(serverUrl, ioOptions);

      log('🔌 Socket.IO client created');

      this.setupEventListeners(serverUrl, connectionStartTime);
      
      // Add a timeout check
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          warn('⚠️ Socket.IO connection not established after 15 seconds');
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
      log('✅ Socket.IO connected:', this.socket?.id);
      log('🌐 Server URL:', serverUrl);
      log('⏱️ Connection time:', connectionTime + 'ms');
      log('🔗 Transport used:', this.socket?.io.engine.transport.name);
      log('📱 Device info:', {
        userAgent: navigator.userAgent,
        isMobile: /iPhone|iPad|Android|Mobile/.test(navigator.userAgent),
        viewport: `${window.innerWidth}x${window.innerHeight}`
      });
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Send arena ID to server
      const currentArenaId = this.getArenaId();
      log(`📤 Sending arena ID to server: ${currentArenaId}`);
      this.socket?.emit('set-arena', { arenaId: currentArenaId });
      
      // Request current game state immediately on connection - CRITICAL FOR MOBILE
      log('📤 [URGENT] Requesting current game state from server (mobile optimization)');
      this.socket?.emit('request-game-state', { arenaId: currentArenaId });
    });

    this.socket.on('disconnect', (reason) => {
      log('❌ Socket.IO disconnected:', reason);
      log('🔄 Will attempt to reconnect automatically...');
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
      log('🔄 Will attempt to reconnect automatically...');
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
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
      log('🔄 Socket.IO reconnecting... attempt', attemptNumber);
    });

    // Add connection attempt tracking
    this.socket.on('connect_attempt', () => {
      log('🔄 Socket.IO connection attempt started');
    });
  }

  // Socket.IO handles reconnection automatically with the configuration above

  // Public methods for emitting events
  public emitBetUpdate(betData: BetSyncData) {
    this.checkAndReidentifyArena();
    if (this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      log(`📤 Emitting bet update for arena '${arenaId}':`, betData);
      log(`📤 [EMIT CHECK] teamAQueue - type: ${typeof betData.teamAQueue}, isArray: ${Array.isArray(betData.teamAQueue)}, value:`, betData.teamAQueue);
      log(`📤 [EMIT CHECK] teamBQueue - type: ${typeof betData.teamBQueue}, isArray: ${Array.isArray(betData.teamBQueue)}, value:`, betData.teamBQueue);
      log(`📤 [EMIT CHECK] bookedBets - type: ${typeof betData.bookedBets}, isArray: ${Array.isArray(betData.bookedBets)}, value:`, betData.bookedBets);
      const dataToSend = { ...betData, arenaId };
      log(`📤 [FINAL DATA] About to emit:`, dataToSend);
      this.socket?.emit('bet-update', dataToSend);
    } else {
      warn('⚠️ Socket not connected, cannot emit bet update');
    }
  }

  public emitGameStateUpdate(gameStateData: GameStateSyncData) {
    this.checkAndReidentifyArena();
    if (this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      const arenaLabel = getArenaLabel(arenaId);
      console.log(`📤 ${arenaLabel} Emitting game state update:`, gameStateData);
      this.socket?.emit('game-state-update', { ...gameStateData, arenaId });
    } else {
      warn('⚠️ Socket not connected, cannot emit game state update');
    }
  }

  public emitTimerUpdate(timerData: TimerSyncData) {
    this.checkAndReidentifyArena();
    if (this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      log(`📤 Emitting timer update for arena '${arenaId}':`, timerData);
      this.socket?.emit('timer-update', { ...timerData, arenaId });
    } else {
      warn('⚠️ Socket not connected, cannot emit timer update');
    }
  }

  public emitScoreUpdate(scoreData: ScoreSyncData) {
    this.checkAndReidentifyArena();
    if (this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      const arenaLabel = getArenaLabel(arenaId);
      console.log(`📤 ${arenaLabel} Emitting score update:`, scoreData);
      this.socket?.emit('score-update', { ...scoreData, arenaId });
    } else {
      warn('⚠️ Socket not connected, cannot emit score update');
    }
  }

  // Public methods for listening to events
  public onBetUpdate(callback: (data: BetSyncData) => void) {
    if (this.socket) {
      log('📥 [LISTENER] Setting up bet-update listener');
      this.socket.on('bet-update', (data: BetSyncData) => {
        const arenaLabel = getArenaLabel(data.arenaId || 'default');
        const currentArenaLabel = getArenaLabel(this.arenaId);
        console.log(`📥 ${arenaLabel} bet-update received (Current arena: ${currentArenaLabel})`);
        callback(data);
      });
    }
  }

  public onGameStateUpdate(callback: (data: GameStateSyncData) => void) {
    if (this.socket) {
      this.socket.on('game-state-update', (data: GameStateSyncData) => {
        const arenaLabel = getArenaLabel(data.arenaId || 'default');
        const currentArenaLabel = getArenaLabel(this.arenaId);
        console.log(`📥 ${arenaLabel} game-state-update received (Current arena: ${currentArenaLabel})`);
        // Pass data with arena info for filtering in GameStateContext
        callback(data);
      });
    }
  }

  public onTimerUpdate(callback: (data: TimerSyncData) => void) {
    if (this.socket) {
      this.socket.on('timer-update', (data: TimerSyncData) => {
        const arenaLabel = getArenaLabel(data.arenaId || 'default');
        const currentArenaLabel = getArenaLabel(this.arenaId);
        console.log(`📥 ${arenaLabel} timer-update received (Current arena: ${currentArenaLabel})`);
        callback(data);
      });
    }
  }

  public onScoreUpdate(callback: (data: ScoreSyncData) => void) {
    if (this.socket) {
      this.socket.on('score-update', (data: any) => {
        const arenaLabel = getArenaLabel(data.arenaId || 'default');
        const currentArenaLabel = getArenaLabel(this.arenaId);
        console.log(`📥 ${arenaLabel} score-update received (Current arena: ${currentArenaLabel})`);
        callback(data);
      });
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
      log(`📤 Requesting game state for arena '${arenaId}'`);
      this.socket?.emit('request-game-state', { arenaId });
    } else {
      warn('⚠️ Socket not connected, cannot request game state');
    }
  }

  // Break Status Synchronization
  public emitBreakStatusUpdate(teamAHasBreak: boolean) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      log('📤 Emitting break status update:', { teamAHasBreak, arenaId });
      this.socket.emit('break-status-update', { teamAHasBreak, arenaId });
    }
  }

  public onBreakStatusUpdate(callback: (data: { teamAHasBreak: boolean, arenaId?: string }) => void) {
    if (this.socket) {
      this.socket.on('break-status-update', (data: { teamAHasBreak: boolean, arenaId?: string }) => {
        const arenaLabel = getArenaLabel(data.arenaId || 'default');
        const currentArenaLabel = getArenaLabel(this.arenaId);
        console.log(`📥 ${arenaLabel} break-status-update received (Current arena: ${currentArenaLabel})`);
        callback(data);
      });
    }
  }

  // Total Booked Coins - Emit separately to update wallet
  public emitTotalBookedCoinsUpdate(totalBookedAmount: number, nextTotalBookedAmount: number) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      const arenaLabel = getArenaLabel(arenaId);
      console.log(`📤 ${arenaLabel} Emitting total booked coins update`);
      this.socket.emit('total-booked-coins-update', { totalBookedAmount, nextTotalBookedAmount, arenaId });
    }
  }

  public onTotalBookedCoinsUpdate(callback: (data: { totalBookedAmount: number, nextTotalBookedAmount: number, arenaId?: string }) => void) {
    if (this.socket) {
      this.socket.on('total-booked-coins-update', (data: { totalBookedAmount: number, nextTotalBookedAmount: number, arenaId?: string }) => {
        const arenaLabel = getArenaLabel(data.arenaId || 'default');
        const currentArenaLabel = getArenaLabel(this.arenaId);
        console.log(`📥 ${arenaLabel} total-booked-coins-update received (Current arena: ${currentArenaLabel})`);
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
      log('📤 Emitting user wallet update:', users.length, 'users');
      this.socket.emit('user-wallet-update', { users });
    }
  }

  public onUserWalletUpdate(callback: (data: { users: any[] }) => void) {
    if (this.socket) {
      this.socket.on('user-wallet-update', (data: { users: any[] }) => {
        log('📥 Received user wallet update:', data.users.length, 'users');
        callback(data);
      });
    }
  }

  // Request wallet data from server
  public requestWalletData() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      log('📤 Requesting wallet data from server');
      this.socket.emit('request-wallet-data');
    }
  }

  public onWalletDataResponse(callback: (data: { users: any[] }) => void) {
    if (this.socket) {
      this.socket.on('wallet-data-response', (data: { users: any[] }) => {
        log('📥 Received wallet data response:', data.users.length, 'users');
        callback(data);
      });
    }
  }

  // User login tracking for connected users coins calculation
  public emitUserLogin(userData: { id: string; name: string; credits: number }) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      log('📤 Emitting user login:', userData.name, 'with', userData.credits, 'coins');
      this.socket.emit('user-login', userData);
    }
  }

  // User logout tracking for connected users coins calculation
  public emitUserLogout(userData: { id: string; name: string; credits: number }) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      log('📤 Emitting user logout:', userData.name, 'with', userData.credits, 'coins');
      this.socket.emit('user-logout', userData);
    }
  }

  // Listen for connected users coins updates
  public onConnectedUsersCoinsUpdate(callback: (data: { totalCoins: number; connectedUserCount: number; connectedUsers: any[] }) => void) {
    if (this.socket) {
      this.socket.on('connected-users-coins-update', (data) => {
        log('📥 Received connected users coins update:', data.totalCoins, 'coins from', data.connectedUserCount, 'users');
        callback(data);
      });
    }
  }

  // Request connected users data refresh
  public requestConnectedUsersData() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      log('📤 Requesting connected users data refresh');
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
      log('📤 Emitting game history update:', gameHistory.length, 'records');
      this.socket.emit('game-history-update', { gameHistory, arenaId });
    }
  }

  public onGameHistoryUpdate(callback: (data: { gameHistory: any[], arenaId?: string }) => void) {
    if (this.socket) {
      // Remove any existing listeners first to prevent duplicates
      this.socket.off('game-history-update');
      
      this.socket.on('game-history-update', (data: { gameHistory: any[], arenaId?: string }) => {
        log('📥 [SocketIOService] Received game history update:', data.gameHistory?.length, 'records');
        log('🔔 [SocketIOService] Calling callback with', data.gameHistory?.length, 'records');
        callback(data);
      });
    }
  }

  // Bet Receipts Synchronization
  public emitBetReceiptsUpdate(betReceipts: any[]) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      log('📤 Emitting bet receipts update:', betReceipts.length, 'receipts');
      this.socket.emit('bet-receipts-update', { betReceipts, arenaId });
    }
  }

  public onBetReceiptsUpdate(callback: (data: { betReceipts: any[], arenaId?: string }) => void) {
    if (this.socket) {
      // Remove any existing listeners first to prevent duplicates
      this.socket.off('bet-receipts-update');
      
      this.socket.on('bet-receipts-update', (data: { betReceipts: any[], arenaId?: string }) => {
        log('📥 [SocketIOService] Received bet receipts update:', data.betReceipts?.length, 'receipts');
        log('🔔 [SocketIOService] Calling callback with', data.betReceipts?.length, 'receipts');
        callback(data);
      });
    }
  }

  // Clear All Data - Admin command to clear everything on all clients
  public emitClearAllData() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      log('📤 Emitting clear all data command');
      this.socket.emit('clear-all-data', { timestamp: Date.now() });
    }
  }

  public onClearAllData(callback: () => void) {
    if (this.socket) {
      this.socket.off('clear-all-data');
      this.socket.on('clear-all-data', () => {
        log('📥 [SocketIOService] Received clear all data command');
        callback();
      });
    }
  }

  // Pause listeners during clear - broadcast to all clients
  public emitPauseListeners() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      log('📤 Emitting pause listeners command to ALL clients');
      this.socket.emit('pause-listeners', { timestamp: Date.now() });
    }
  }

  public onPauseListeners(callback: () => void) {
    if (this.socket) {
      this.socket.off('pause-listeners');
      this.socket.on('pause-listeners', () => {
        log('📥 [SocketIOService] Received pause listeners command');
        callback();
      });
    }
  }

  // Resume listeners after clear - broadcast to all clients
  public emitResumeListeners() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      log('📤 Emitting resume listeners command to ALL clients');
      this.socket.emit('resume-listeners', { timestamp: Date.now() });
    }
  }

  public onResumeListeners(callback: () => void) {
    if (this.socket) {
      this.socket.off('resume-listeners');
      this.socket.on('resume-listeners', () => {
        log('📥 [SocketIOService] Received resume listeners command');
        callback();
      });
    }
  }

  // Peer-to-Peer Game History Sharing Methods
  public requestGameHistoryFromClients() {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      log('📤 [P2P] Requesting game history from other clients');
      this.socket.emit('request-game-history-from-clients');
    }
  }

  public onClientRequestsGameHistory(callback: (data: { clientId: string; requestedAt: number }) => void) {
    if (this.socket) {
      this.socket.off('client-requesting-game-history');
      this.socket.on('client-requesting-game-history', (data) => {
        log('📨 [P2P] Another client requesting game history');
        callback(data);
      });
    }
  }

  public sendGameHistoryToClient(gameHistory: any[]) {
    if (this.socket && this.isSocketConnected()) {
      log('📤 [P2P] Sending game history to peers:', gameHistory.length, 'records');
      this.socket.emit('provide-game-history-to-client', { gameHistory });
    }
  }

  public onReceiveGameHistoryFromClients(callback: (data: { gameHistory: any[]; providedBy: string; providedAt: number }) => void) {
    if (this.socket) {
      this.socket.off('receive-game-history-from-clients');
      this.socket.on('receive-game-history-from-clients', (data) => {
        log('📥 [P2P] Received game history from peers:', data.gameHistory?.length, 'records');
        callback(data);
      });
    }
  }

  // Sound Broadcasting Methods
  public emitSoundEvent(soundType: string) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      log(`🔊 Emitting sound event '${soundType}' for arena '${arenaId}'`);
      this.socket.emit('play-sound', { soundType, arenaId, timestamp: Date.now() });
    }
  }

  public onSoundEvent(callback: (data: { soundType: string; arenaId?: string; timestamp: number }) => void) {
    if (this.socket) {
      this.socket.off('play-sound');
      this.socket.on('play-sound', (data) => {
        log(`🔊 Received sound event: '${data.soundType}' from arena '${data.arenaId}'`);
        callback(data);
      });
    }
  }

  // Cross-Device Synchronization - Emit complete game state for new/reconnecting devices
  public emitFullGameStateSync(fullGameState: any) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      log(`📡 Emitting FULL game state sync for arena '${arenaId}' to other devices`);
      this.socket.emit('full-state-sync', { gameState: fullGameState, arenaId, timestamp: Date.now() });
    }
  }

  public onFullGameStateSync(callback: (data: { gameState: any; arenaId?: string; timestamp: number }) => void) {
    if (this.socket) {
      this.socket.off('full-state-sync');
      this.socket.on('full-state-sync', (data) => {
        log(`📡 Received FULL game state sync from arena '${data.arenaId}':`, data.gameState);
        callback(data);
      });
    }
  }

  // Emit team names specifically for cross-device sync
  public emitTeamNamesUpdate(teamAName: string, teamBName: string) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      log(`👥 Emitting team names update for arena '${arenaId}': ${teamAName} vs ${teamBName}`);
      this.socket.emit('team-names-update', { teamAName, teamBName, arenaId, timestamp: Date.now() });
    }
  }

  public onTeamNamesUpdate(callback: (data: { teamAName: string; teamBName: string; arenaId?: string; timestamp: number }) => void) {
    if (this.socket) {
      this.socket.off('team-names-update');
      this.socket.on('team-names-update', (data) => {
        const arenaLabel = getArenaLabel(data.arenaId || 'default');
        const currentArenaLabel = getArenaLabel(this.arenaId);
        console.log(`📥 ${arenaLabel} team-names-update received (Current arena: ${currentArenaLabel})`);
        callback(data);
      });
    }
  }

  // Emit admin state changes for cross-device sync
  public emitAdminStateUpdate(adminState: any) {
    this.checkAndReidentifyArena();
    if (this.socket && this.isSocketConnected()) {
      const arenaId = this.getArenaId();
      log(`⚙️ Emitting admin state update for arena '${arenaId}'`);
      this.socket.emit('admin-state-update', { adminState, arenaId, timestamp: Date.now() });
    }
  }

  public onAdminStateUpdate(callback: (data: { adminState: any; arenaId?: string; timestamp: number }) => void) {
    if (this.socket) {
      this.socket.off('admin-state-update');
      this.socket.on('admin-state-update', (data) => {
        log(`⚙️ Received admin state update for arena '${data.arenaId}'`);
        callback(data);
      });
    }
  }

  // 🎯 NEW: Listener for complete arena state snapshot when switching arenas
  // This ensures client gets ALL data from server as source of truth
  public onArenaStateSnapshot(callback: (data: { arenaId: string; gameState: any; timestamp: number }) => void) {
    if (this.socket) {
      this.socket.on('arena-state-snapshot', (data) => {
        log(`📡 [ARENA-STATE-SNAPSHOT] Received complete state for arena '${data.arenaId}'`, data);
        callback(data);
      });
    }
  }

  // Cleanup methods for proper listener removal
  // 🎯 CRITICAL: These must be called when arena changes to prevent cross-arena contamination
  public offBetUpdate() {
    if (this.socket) {
      this.socket.off('bet-update');
      log(`🧹 [CLEANUP] Removed bet-update listener`);
    }
  }

  public offGameStateUpdate() {
    if (this.socket) {
      this.socket.off('game-state-update');
      log(`🧹 [CLEANUP] Removed game-state-update listener`);
    }
  }

  public offScoreUpdate() {
    if (this.socket) {
      this.socket.off('score-update');
      log(`🧹 [CLEANUP] Removed score-update listener`);
    }
  }

  public offTimerUpdate() {
    if (this.socket) {
      this.socket.off('timer-update');
      log(`🧹 [CLEANUP] Removed timer-update listener`);
    }
  }

  public offBreakStatusUpdate() {
    if (this.socket) {
      this.socket.off('break-status-update');
      log(`🧹 [CLEANUP] Removed break-status-update listener`);
    }
  }

  public offTotalBookedCoinsUpdate() {
    if (this.socket) {
      this.socket.off('total-booked-coins-update');
      log(`🧹 [CLEANUP] Removed total-booked-coins-update listener`);
    }
  }

  public offTeamNamesUpdate() {
    if (this.socket) {
      this.socket.off('team-names-update');
      log(`🧹 [CLEANUP] Removed team-names-update listener`);
    }
  }

  public offAdminStateUpdate() {
    if (this.socket) {
      this.socket.off('admin-state-update');
      log(`🧹 [CLEANUP] Removed admin-state-update listener`);
    }
  }

  public offArenaStateSnapshot() {
    if (this.socket) {
      this.socket.off('arena-state-snapshot');
      log(`🧹 [CLEANUP] Removed arena-state-snapshot listener`);
    }
  }

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

// Export the class for testing
export default SocketIOService;
