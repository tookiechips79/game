
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ShieldAlert, User, Search } from "lucide-react";
import { toast } from "sonner";

const AdminUserSelector: React.FC = () => {
  const { users, setCurrentUser, getUserById } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    
    if (userId) {
      const user = getUserById(userId);
      if (user) {
        setCurrentUser(user);
        toast.success(`Viewing ${user.name}'s account`, {
          description: "You now have access to this user's account information"
        });
      }
    }
  };
  
  return (
    <Card className="mb-8 bg-red-950/30 border-red-800/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-red-400">
          <ShieldAlert className="h-5 w-5" />
          Admin User Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 text-gray-400">
            <User className="h-5 w-5" />
            <span>Select User:</span>
          </div>
          <div className="flex-1">
            <Select
              value={selectedUserId}
              onValueChange={handleUserChange}
            >
              <SelectTrigger className="w-full bg-gray-700 border-gray-600">
                <SelectValue placeholder="Select a user to view" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.credits} COINS)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-red-400 mt-2">
          <Search className="h-3 w-3 inline mr-1" />
          Admin mode: You can view and manage any user's account details
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminUserSelector;
