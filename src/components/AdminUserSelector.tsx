
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ShieldAlert, User, Search } from "lucide-react";
import { toast } from "sonner";
import UserDropdown from "./UserDropdown";

const AdminUserSelector: React.FC = () => {
  const { users, setCurrentUser, getUserById, isUsersLoaded } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  const handleUserChange = (userId: string) => {
    console.log('🔄 AdminUserSelector: User changed to:', userId);
    setSelectedUserId(userId);
    
    if (userId) {
      // Try to find user in context first, then in all available users
      let user = getUserById(userId);
      
      if (!user) {
        // Fallback: search in localStorage
        try {
          const storedUsers = localStorage.getItem('users');
          if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            user = parsedUsers.find((u: any) => u.id === userId);
          }
        } catch (error) {
          console.error('Error finding user in localStorage:', error);
        }
      }
      
      if (user) {
        console.log('✅ Found user:', user.name, user.id);
        setCurrentUser(user);
        toast.success(`Viewing ${user.name}'s account`, {
          description: "You now have access to this user's account information"
        });
      } else {
        console.error('❌ User not found:', userId);
        toast.error("User not found", {
          description: "The selected user could not be found"
        });
      }
    }
  };
  
  return (
    <Card className="mb-8 rounded-xl" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#fa1593' }}>
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
            <UserDropdown
              selectedUserId={selectedUserId}
              onUserChange={handleUserChange}
              placeholder="Select a user to view"
              showCredits={true}
              showMembership={false}
            />
          </div>
        </div>
        <p className="text-xs mt-2" style={{ color: '#fa1593' }}>
          <Search className="h-3 w-3 inline mr-1" />
          Admin mode: You can view and manage any user's account details
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminUserSelector;
