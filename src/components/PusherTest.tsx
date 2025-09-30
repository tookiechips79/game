import React, { useState, useEffect } from 'react';
import { socketIOSyncService } from '@/services/socketIOSync';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, TestTube } from 'lucide-react';

const PusherTest: React.FC = () => {
  const [status, setStatus] = useState(socketIOSyncService.getStatus());
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(socketIOSyncService.getStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    const results: string[] = [];
    
    // Test 1: Check Socket.IO connection
    results.push(`🔍 Testing Socket.IO connection...`);
    results.push(`Socket ID: ${status.socketId || 'unknown'}`);
    results.push(`Connected: ${status.isConnected ? '✅ Yes' : '❌ No'}`);
    results.push(`Last message: ${status.lastMessageTime > 0 ? new Date(status.lastMessageTime).toLocaleTimeString() : 'Never'}`);
    
    // Test 2: Check browser info
    results.push(`🔍 Browser: ${status.device || 'unknown'}`);
    results.push(`User ID: ${status.userId || 'anonymous'}`);
    results.push(`Room ID: ${status.roomId || 'unknown'}`);
    
    // Test 3: Test message sending
    if (status.isConnected) {
      results.push(`📤 Testing message send...`);
      try {
        socketIOSyncService.sendDataUpdate({
          test: true,
          timestamp: Date.now(),
          message: 'Test message from SocketIOTest component'
        } as any);
        results.push(`✅ Message sent successfully`);
      } catch (error) {
        results.push(`❌ Failed to send message: ${error}`);
      }
    } else {
      results.push(`❌ Cannot test message - not connected`);
    }
    
    // Test 4: Check fallback status
    results.push(`🔍 Fallback status: ${status.queuedMessages > 0 ? `${status.queuedMessages} queued` : 'No queued messages'}`);
    
    setTestResults(results);
    setIsTesting(false);
  };

  const getStatusColor = () => {
    if (status.isConnected) return 'default';
    if (status.reconnectAttempts > 0) return 'secondary';
    return 'destructive';
  };

  const getStatusIcon = () => {
    if (status.isConnected) return <Wifi className="h-3 w-3" />;
    return <WifiOff className="h-3 w-3" />;
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Socket.IO Connection Test
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">
              {status.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </Badge>
          <Button
            size="sm"
            onClick={runConnectionTest}
            disabled={isTesting}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium mb-2">Connection Status</h4>
          <div className="space-y-1 text-sm">
            <div>Socket ID: <span className="font-mono">{status.socketId || 'unknown'}</span></div>
            <div>Connected: <span className={status.isConnected ? 'text-green-600' : 'text-red-600'}>{status.isConnected ? 'Yes' : 'No'}</span></div>
            <div>Reconnect attempts: <span className="font-mono">{status.reconnectAttempts}</span></div>
            <div>Queued messages: <span className="font-mono">{status.queuedMessages}</span></div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Device Info</h4>
          <div className="space-y-1 text-sm">
            <div>Device: <span className="font-mono">{status.device || 'unknown'}</span></div>
            <div>User ID: <span className="font-mono">{status.userId || 'anonymous'}</span></div>
            <div>Room ID: <span className="font-mono">{status.roomId || 'unknown'}</span></div>
            <div>Last message: <span className="font-mono">
              {status.lastMessageTime > 0 ? new Date(status.lastMessageTime).toLocaleTimeString() : 'Never'}
            </span></div>
          </div>
        </div>
      </div>

      {testResults.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Test Results</h4>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono space-y-1">
            {testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PusherTest;
