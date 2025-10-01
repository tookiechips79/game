// Simple Mock Socket.IO server for development
console.log('🚀 Loading mock Socket.IO server...');

// Simple mock server
class SimpleMockServer {
  constructor() {
    this.clients = new Map();
    console.log('✅ Simple mock server created');
  }

  connect() {
    const clientId = 'client_' + Date.now();
    this.clients.set(clientId, { connected: true });
    console.log('🔌 Client connected:', clientId);
    
    // Simulate connection success
    setTimeout(() => {
      const event = new CustomEvent('mock-connect', { detail: { clientId } });
      window.dispatchEvent(event);
      console.log('📡 Connect event dispatched');
    }, 100);
    
    return clientId;
  }

  getClientCount() {
    return this.clients.size;
  }

  emitToAll(event, data) {
    console.log('📡 Mock server broadcasting:', event, 'to', this.clients.size, 'clients');
    
    // Use localStorage for cross-browser sync
    const syncData = {
      type: event,
      payload: data,
      timestamp: Date.now(),
      browserId: this.getBrowserId()
    };
    
    // Use a unique key to trigger storage events
    const uniqueKey = `betting_app_sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(uniqueKey, JSON.stringify(syncData));
    
    // Clean up after a delay
    setTimeout(() => {
      localStorage.removeItem(uniqueKey);
    }, 1000);
  }

  getBrowserId() {
    let browserId = localStorage.getItem('betting_app_browser_id');
    if (!browserId) {
      browserId = 'browser_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('betting_app_browser_id', browserId);
    }
    return browserId;
  }
}

// Simple mock client
class SimpleMockClient {
  constructor(url) {
    this.url = url;
    this.connected = false;
    this.listeners = new Map();
    
    console.log('🔌 Simple mock client created for:', url);
    console.log('🔌 Initial connected state:', this.connected);
    
    // Listen for connect events
    window.addEventListener('mock-connect', (e) => {
      console.log('🎉 Mock client received connect event');
      this.connected = true;
      console.log('🎉 Connected state updated to:', this.connected);
      this.emit('connect');
    });

    // Listen for localStorage changes from other browsers
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('betting_app_sync_') && e.newValue) {
        try {
          const syncData = JSON.parse(e.newValue);
          const currentBrowserId = localStorage.getItem('betting_app_browser_id');
          
          // Only process if it's from a different browser
          if (syncData.browserId && syncData.browserId !== currentBrowserId) {
            console.log('📡 Mock client: Received cross-browser sync:', syncData.type, 'from browser:', syncData.browserId);
            // Notify listeners without triggering emit (to avoid infinite loops)
            this.notifyListeners(syncData.type, syncData.payload);
          }
        } catch (error) {
          console.error('Error parsing localStorage sync data:', error);
        }
      }
    });
    
    // Auto-connect
    setTimeout(() => {
      console.log('🔌 Auto-connecting...');
      if (window.mockSocketIOServer) {
        window.mockSocketIOServer.connect();
      } else {
        console.log('❌ Mock server not available for connection');
      }
    }, 50);
  }

  emit(event, data) {
    console.log('📤 Mock client emitting:', event, data);
    
    // Broadcast to other clients via mock server
    if (event === 'bet-update' || event === 'game-state-update') {
      console.log('📡 Broadcasting to other clients via mock server');
      if (window.mockSocketIOServer) {
        window.mockSocketIOServer.emitToAll(event, data);
      }
    }
    
    // Notify local listeners
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  on(event, callback) {
    console.log('👂 Mock client listening for:', event);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    console.log('👂 Total listeners for', event + ':', this.listeners.get(event).length);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Helper method to notify listeners without triggering emit
  notifyListeners(event, data) {
    console.log('🔔 Mock client: Notifying listeners for:', event);
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in mock Socket.IO listener:', error);
      }
    });
  }
}

// Create global instances
if (typeof window !== 'undefined') {
  console.log('🌐 Window available, setting up mock server...');
  
  // Create mock server (using the name the debug component expects)
  window.mockSocketIOServer = new SimpleMockServer();
  console.log('✅ Mock server created:', window.mockSocketIOServer);
  
  // Override Socket.IO
  window.io = (url, options) => {
    console.log('🔌 Creating mock Socket.IO client for:', url);
    const client = new SimpleMockClient(url);
    console.log('✅ Mock Socket.IO client created:', client);
    return client;
  };
  
  console.log('🎯 Mock Socket.IO setup complete');
  
  // Test immediately
  console.log('🧪 Testing mock setup...');
  const testClient = window.io('http://localhost:8080');
  console.log('Test client created:', !!testClient);
  console.log('Test client connected:', testClient.connected);
  
  // Check connection after delay
  setTimeout(() => {
    console.log('🧪 Test client connected after delay:', testClient.connected);
  }, 200);
  
} else {
  console.log('❌ Window not available');
}