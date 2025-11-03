import React, { useState, useEffect } from 'react';
import { socketIOService } from '@/services/socketIOService';
import { useGameState } from '@/contexts/GameStateContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SocketIOStatus: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { gameState } = useGameState();
  const [socketInfo, setSocketInfo] = useState(socketIOService.getSocketInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setSocketInfo(socketIOService.getSocketInfo());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const connectionStatus = socketInfo.connected ? 'Connected ✅' : 'Disconnected ❌';
  const dataLoaded = gameState.teamAQueue?.length > 0 || gameState.teamBQueue?.length > 0;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-xs">
      <Card className="bg-gray-900 border-cyan-500/50">
        <CardHeader className="p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs flex items-center gap-2">
              <span className={dataLoaded ? 'text-green-500' : 'text-yellow-500'}>●</span>
              Socket Status
            </CardTitle>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="p-3 border-t border-cyan-500/30 space-y-2 text-xs">
            <div>
              <span className="text-cyan-400">Status:</span> {connectionStatus}
            </div>
            <div>
              <span className="text-cyan-400">Socket ID:</span> {socketInfo.id?.slice(0, 8) || 'N/A'}
            </div>
            <div>
              <span className="text-cyan-400">Data Loaded:</span> {dataLoaded ? '✅ Yes' : '⏳ Waiting'}
            </div>
            <div className="text-gray-400 text-xs">
              <span className="text-cyan-400">Queue Status:</span>
              <div className="ml-2">
                • Team A: {gameState.teamAQueue?.length || 0} bets
              </div>
              <div className="ml-2">
                • Team B: {gameState.teamBQueue?.length || 0} bets
              </div>
              <div className="ml-2">
                • Booked: {gameState.bookedBets?.length || 0} bets
              </div>
            </div>
            <div>
              <span className="text-cyan-400">Device:</span>
            </div>
            <div className="text-gray-300 text-xs ml-2">
              {/iPhone|iPad|Android|Mobile/.test(navigator.userAgent) ? '📱 Mobile' : '🖥️ Desktop'}
              <br />
              {window.innerWidth}x{window.innerHeight}
            </div>
            <Button 
              onClick={() => socketIOService.requestGameState()}
              size="sm"
              className="w-full mt-2 text-xs h-6"
              variant="outline"
            >
              Sync Data
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default SocketIOStatus;
