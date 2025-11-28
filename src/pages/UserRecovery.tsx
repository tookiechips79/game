import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { User } from "@/types/user";
import { toast } from "sonner";

const UserRecovery = () => {
  const { restoreUsers, users } = useUser();
  const [isRecovering, setIsRecovering] = useState(false);

  const usersToRecover: User[] = [
    {
      id: "111",
      name: "111",
      credits: 1000,
      password: "user111",
      wins: 0,
      losses: 0,
      membershipStatus: "inactive",
    },
    {
      id: "222",
      name: "222",
      credits: 1000,
      password: "user222",
      wins: 0,
      losses: 0,
      membershipStatus: "inactive",
    },
    {
      id: "isaiah-user",
      name: "isaiah",
      credits: 1000,
      password: "isaiah",
      wins: 0,
      losses: 0,
      membershipStatus: "inactive",
    },
  ];

  const handleRecover = () => {
    setIsRecovering(true);
    try {
      // Filter out users that already exist
      const newUsers = usersToRecover.filter(
        (u) => !users.some((existing) => existing.id === u.id)
      );

      if (newUsers.length === 0) {
        toast.info("All users already exist!", {
          description: "No new users to recover",
        });
        setIsRecovering(false);
        return;
      }

      restoreUsers(newUsers);
      console.log(`✅ Recovered ${newUsers.length} users`);
    } catch (error) {
      console.error("Error recovering users:", error);
      toast.error("Failed to recover users", {
        description: "Check console for details",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">User Recovery</h1>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Users to Recover:</h2>
          <div className="space-y-3">
            {usersToRecover.map((user) => {
              const exists = users.some((u) => u.id === user.id);
              return (
                <div
                  key={user.id}
                  className={`p-3 rounded ${
                    exists ? "bg-green-900/30" : "bg-yellow-900/30"
                  }`}
                >
                  <div className="font-bold">{user.name}</div>
                  <div className="text-sm text-gray-400">ID: {user.id}</div>
                  <div className="text-sm">
                    Credits: {user.credits} | Status:{" "}
                    {exists ? "✅ ALREADY EXISTS" : "⏳ NEEDS RECOVERY"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleRecover}
          disabled={isRecovering}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold"
        >
          {isRecovering ? "Recovering..." : "Recover All Users"}
        </Button>

        <div className="mt-8 p-4 bg-blue-900/30 rounded">
          <h3 className="font-bold mb-2">Current Users ({users.length}):</h3>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="text-sm">
                • {u.name} - {u.credits} credits
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRecovery;

