import { useGameState } from "@/contexts/GameStateContext";
import { useUser } from "@/contexts/UserContext";

const DebugGameState = () => {
  const { gameState } = useGameState();
  const { users } = useUser();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug Game State</h1>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Betting Queues */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Betting Queues</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-bold text-green-400">Team A Queue:</div>
              <div className="bg-black p-2 rounded mt-1">
                {gameState.teamAQueue?.length || 0} bets
              </div>
              <pre className="bg-black p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                {JSON.stringify(gameState.teamAQueue, null, 2)}
              </pre>
            </div>
            
            <div>
              <div className="font-bold text-blue-400">Team B Queue:</div>
              <div className="bg-black p-2 rounded mt-1">
                {gameState.teamBQueue?.length || 0} bets
              </div>
              <pre className="bg-black p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                {JSON.stringify(gameState.teamBQueue, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Pending Bets */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Pending Bets (Users)</h2>
          <div className="space-y-4 text-sm">
            {users.map((user) => (
              <div key={user.id}>
                <div className="font-bold text-yellow-400">{user.name}</div>
                <div className="bg-black p-2 rounded mt-1">
                  {user.pendingBets?.length || 0} pending bets, {user.credits} credits
                </div>
                <pre className="bg-black p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                  {JSON.stringify(user.pendingBets, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-gray-900 rounded-lg p-6 col-span-2">
          <h2 className="text-xl font-bold mb-4">Game Info</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-bold">Current Game:</div>
              <div>#{gameState.currentGameNumber}</div>
            </div>
            <div>
              <div className="font-bold">Team A Games:</div>
              <div>{gameState.teamAGames}</div>
            </div>
            <div>
              <div className="font-bold">Team B Games:</div>
              <div>{gameState.teamBGames}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugGameState;

