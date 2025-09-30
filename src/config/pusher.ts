// Pusher Configuration
// Replace these with your actual Pusher credentials

export const PUSHER_CONFIG = {
  // Your actual Pusher credentials
  key: '4c3988c483231609c9f2',
  cluster: 'us3',
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
      key: '4c3988c483231609c9f2',
      cluster: 'us3',
    };
  } else {
    // Production configuration
    return {
      ...PUSHER_CONFIG,
      key: '4c3988c483231609c9f2',
      cluster: 'us3',
    };
  }
};