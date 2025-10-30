import React from 'react';
import { socketIOService } from '@/services/socketIOService';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

const SocketIOStatus: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = React.useState<string>('Disconnected');
  const [socketId, setSocketId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    // Test if the service is available
    console.log('🧪 Testing SocketIOService:', {
      serviceExists: !!socketIOService,
      serviceType: typeof socketIOService,
      hasConnect: typeof socketIOService.connect === 'function',
      hasGetConnectionStatus: typeof socketIOService.getConnectionStatus === 'function'
    });
    
    const updateStatus = () => {
      const status = socketIOService.getConnectionStatus();
      const id = socketIOService.getSocketId();
      const isConnected = socketIOService.isSocketConnected();
      
      const socketInfo = socketIOService.getSocketInfo();
      console.log('🔍 SocketIOStatus update:', {
        status,
        id,
        isConnected,
        socketInfo
      });
      
      // Test if we can manually trigger a connection
      if (!isConnected && socketInfo.exists) {
        console.log('🔄 Attempting manual connection...');
        socketIOService.connect();
      }
      
      setConnectionStatus(status);
      setSocketId(id);
    };

    // Initial status
    updateStatus();

    // Update status every second
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'Connected':
        return <Wifi className="h-3 w-3" style={{ color: '#00FF00' }} />;
      case 'Connecting...':
        return <Loader2 className="h-3 w-3 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="h-3 w-3 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected':
        return 'border text-white';
      case 'Connecting...':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={`${getStatusColor()} text-xs`}
        style={connectionStatus === 'Connected' ? { backgroundColor: 'rgba(0, 255, 0, 0.2)', borderColor: '#00FF00', color: '#00FF00' } : {}}
      >
        {getStatusIcon()}
        <span className="ml-1">{connectionStatus}</span>
      </Badge>
      {socketId && (
        <Badge variant="outline" className="text-xs">
          ID: {socketId.substring(0, 8)}
        </Badge>
      )}
    </div>
  );
};

export default SocketIOStatus;
