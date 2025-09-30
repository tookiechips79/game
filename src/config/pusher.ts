// Pusher Configuration
// Replace these with your actual Pusher credentials

export const PUSHER_CONFIG = {
  // Get these from your Pusher dashboard: https://dashboard.pusher.com/
  key: 'your-pusher-key', // Replace with your actual Pusher key
  cluster: 'us2', // Replace with your cluster (us2, eu, ap-southeast-1, etc.)
  encrypted: true,
  
  // Optional: For private channels (requires backend authentication)
  authEndpoint: '/api/pusher/auth',
  
  // Channel names for your betting app
  channels: {
    BETTING_DATA: 'betting-data',
    USER_UPDATES: 'user-updates', 
    GAME_STATE: 'game-state',
    ADMIN_UPDATES: 'admin-updates',
  },
  
  // Event names
  events: {
    DATA_UPDATE: 'data-update',
    USER_JOIN: 'user-join',
    USER_LEAVE: 'user-leave',
    GAME_UPDATE: 'game-update',
    BET_UPDATE: 'bet-update',
    ADMIN_UPDATE: 'admin-update',
  }
};

// Development vs Production configuration
export const getPusherConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // Development configuration
    return {
      ...PUSHER_CONFIG,
      // You can use test keys for development
      key: 'your-dev-pusher-key',
      cluster: 'us2',
    };
  } else {
    // Production configuration
    return {
      ...PUSHER_CONFIG,
      // Use production keys
      key: 'your-prod-pusher-key',
      cluster: 'us2',
    };
  }
};
