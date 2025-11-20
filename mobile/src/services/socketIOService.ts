import io, { Socket } from 'socket.io-client';

class SocketIOService {
  private socket: Socket | null = null;
  private serverUrl: string = 'http://localhost:3001';

  constructor() {
    // Get server URL from environment or use default
    this.serverUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  }

  connect() {
    if (this.socket?.connected) {
      console.log('✅ Already connected to Socket.IO');
      return;
    }

    console.log(`🔌 Connecting to Socket.IO at ${this.serverUrl}`);

    this.socket = io(this.serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
    });

    this.socket.on('disconnect', () => {
      console.log('⚠️ Disconnected from Socket.IO server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Arena Management
  emitSetArena(arenaId: string) {
    if (!this.isConnected()) {
      console.warn('⚠️ Not connected to server');
      return;
    }
    this.socket?.emit('set-arena', { arenaId });
  }

  // Game History
  onGameHistoryUpdate(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('game-history-update', callback);
  }

  emitNewGameAdded(gameData: any) {
    if (!this.isConnected()) {
      console.warn('⚠️ Not connected to server');
      return;
    }
    this.socket?.emit('new-game-added', gameData);
  }

  emitRequestGameHistory() {
    if (!this.isConnected()) {
      console.warn('⚠️ Not connected to server');
      return;
    }
    this.socket?.emit('request-game-history', {});
  }

  // Game State Updates
  onGameStateUpdate(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('game-state-update', callback);
  }

  emitGameStateUpdate(stateData: any) {
    if (!this.isConnected()) {
      console.warn('⚠️ Not connected to server');
      return;
    }
    this.socket?.emit('game-state-update', stateData);
  }

  // Betting Updates
  onBetUpdate(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('bet-update', callback);
  }

  emitBetUpdate(betData: any) {
    if (!this.isConnected()) {
      console.warn('⚠️ Not connected to server');
      return;
    }
    this.socket?.emit('bet-update', betData);
  }

  // Cleanup
  offGameHistoryUpdate() {
    if (!this.socket) return;
    this.socket.off('game-history-update');
  }

  offGameStateUpdate() {
    if (!this.socket) return;
    this.socket.off('game-state-update');
  }

  offBetUpdate() {
    if (!this.socket) return;
    this.socket.off('bet-update');
  }
}

// Export singleton instance
export const socketIOService = new SocketIOService();


