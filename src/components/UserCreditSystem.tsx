
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Coins, UserPlus, User as UserIcon, MinusCircle } from "lucide-react";
import UserDropdown from "./UserDropdown";

export const UserSelector: React.FC = () => {
  const { currentUser, setCurrentUser, users } = useUser();
  
  const handleUserChange = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    setCurrentUser(selectedUser || null);
  };
  
  return (
    <div className="mb-4">
      <div className="flex flex-col gap-2">
        <label className="text-white text-sm font-medium">Select User:</label>
        <UserDropdown
          selectedUserId={currentUser?.id || ""}
          onUserChange={handleUserChange}
          placeholder="-- Select User --"
          showCredits={true}
          showMembership={true}
        />
      </div>
    </div>
  );
};

export const CreateUserForm: React.FC = () => {
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const { addUser, setCurrentUser } = useUser();
  
  const handleCreateUser = () => {
    if (!newUserName.trim()) {
      toast.error("Please enter a valid name", {
        className: "custom-toast-error"
      });
      return;
    }
    
    if (!newUserPassword.trim()) {
      toast.error("Please enter a valid password", {
        className: "custom-toast-error"
      });
      return;
    }
    
    const newUser = addUser(newUserName.trim(), newUserPassword.trim());
    if (newUser) {
      setCurrentUser(newUser);
    }
    setNewUserName("");
    setNewUserPassword("");
  };
  
  return (
    <Card className="mb-4 shadow-[0_0_15px_rgba(149,222,255,0.3)] rounded-2xl" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#fa1593' }}>
          <UserPlus className="h-4 w-4" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Enter user name"
            className="bg-gray-700 border-gray-600 rounded-xl text-white"
          />
          <Input
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            placeholder="Enter password"
            className="bg-gray-700 border-gray-600 rounded-xl text-white"
          />
          <Button 
            onClick={handleCreateUser} 
            className="hover:bg-opacity-90 text-white rounded-xl"
            style={{ backgroundColor: '#fa1593' }}
          >
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const UserCreditsManager: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const { users, addCredits, deductCredits, isUsersLoaded } = useUser();
  
  const handleAddCredits = () => {
    if (!selectedUserId) {
      toast.error("Please select a user", {
        className: "custom-toast-error"
      });
      return;
    }
    
    if (!creditAmount || creditAmount <= 0) {
      toast.error("Please enter a valid amount", {
        className: "custom-toast-error"
      });
      return;
    }
    
    addCredits(selectedUserId, creditAmount, true); // Pass isAdmin=true flag
    setCreditAmount(100); // Reset to default value
  };
  
  const handleDeleteCredits = () => {
    if (!selectedUserId) {
      toast.error("Please select a user", {
        className: "custom-toast-error"
      });
      return;
    }
    
    if (!creditAmount || creditAmount <= 0) {
      toast.error("Please enter a valid amount", {
        className: "custom-toast-error"
      });
      return;
    }
    
    const user = users.find(u => u.id === selectedUserId);
    if (!user) {
      toast.error("User not found", {
        className: "custom-toast-error"
      });
      return;
    }
    
    const success = deductCredits(selectedUserId, creditAmount, true); // Pass isAdminAction=true flag
    if (success) {
      toast.success("COINS Deducted", {
        description: `Removed ${creditAmount} COINS from ${user.name}`,
        className: "custom-toast-success"
      });
      setCreditAmount(100); // Reset to default value
    }
  };
  
  return (
    <Card className="mb-4 shadow-[0_0_15px_rgba(149,222,255,0.3)] rounded-2xl" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#fa1593' }}>
          <Coins className="h-4 w-4" />
          Manage COINS (Admin)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <UserDropdown
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
            placeholder="-- Select User --"
            showCredits={true}
            showMembership={false}
          />
          
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(10)}
              className={`text-white border-gray-600 rounded-xl ${creditAmount === 10 ? 'hover:bg-opacity-90' : 'bg-gray-700'}`}
              style={creditAmount === 10 ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : {}}
            >
              10
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(50)}
              className={`text-white border-gray-600 rounded-xl ${creditAmount === 50 ? 'hover:bg-opacity-90' : 'bg-gray-700'}`}
              style={creditAmount === 50 ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : {}}
            >
              50
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(100)}
              className={`text-white border-gray-600 rounded-xl ${creditAmount === 100 ? 'hover:bg-opacity-90' : 'bg-gray-700'}`}
              style={creditAmount === 100 ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : {}}
            >
              100
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(200)}
              className={`text-white border-gray-600 rounded-xl ${creditAmount === 200 ? 'hover:bg-opacity-90' : 'bg-gray-700'}`}
              style={creditAmount === 200 ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : {}}
            >
              200
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(500)}
              className={`text-white border-gray-600 rounded-xl ${creditAmount === 500 ? 'hover:bg-opacity-90' : 'bg-gray-700'}`}
              style={creditAmount === 500 ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : {}}
            >
              500
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(1000)}
              className={`text-white border-gray-600 rounded-xl ${creditAmount === 1000 ? 'hover:bg-opacity-90' : 'bg-gray-700'}`}
              style={creditAmount === 1000 ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : {}}
            >
              1000
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(Number(e.target.value))}
              className="bg-gray-700 border-gray-600 rounded-xl text-white"
            />
            <div className="flex gap-2 w-full">
              <Button 
                onClick={handleAddCredits} 
                className="hover:bg-opacity-90 text-white rounded-xl w-1/2"
                style={{ backgroundColor: '#fa1593' }}
              >
                Add
              </Button>
              <Button 
                onClick={handleDeleteCredits} 
                className="text-white rounded-xl w-1/2 flex items-center gap-2 transition-colors"
                style={{ backgroundColor: '#fa1593' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(250, 21, 147, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fa1593';
                }}
              >
                <MinusCircle className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UserCreditDisplay: React.FC<{ hideCredits?: boolean }> = ({ hideCredits = false }) => {
  const { currentUser } = useUser();
  
  if (!currentUser) return null;
  
  return (
    <Card className="mb-4 shadow-[0_0_15px_rgba(149,222,255,0.3)] rounded-2xl" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#fa1593' }}>
          <UserIcon className="h-4 w-4" />
          Current User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-white">
            <span className="font-bold">{currentUser.name}</span>
            <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
              currentUser.membershipStatus === 'active' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {currentUser.membershipStatus === 'active' ? 'ACTIVE MEMBER' : 'INACTIVE - SUBSCRIBE TO BET'}
            </div>
          </div>
          {!hideCredits && (
            <div className="p-2 rounded-xl text-white font-bold" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
              {currentUser.credits} COINS
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const UserCreditSystem: React.FC<{ isAdmin: boolean, isAgent?: boolean }> = ({ isAdmin, isAgent = false }) => {
  const hideCredits = isAgent && !isAdmin;
  
  return (
    <div className="mb-6">
      <UserCreditDisplay hideCredits={hideCredits} />
      
      {!isAdmin && !isAgent && (
        <div className="flex flex-col gap-4">
          <UserSelector />
        </div>
      )}
      
      {isAdmin && (
        <div className="flex flex-col gap-4">
          <UserCreditsManager />
          <CreateUserForm />
        </div>
      )}
      
      {isAgent && !isAdmin && (
        <div className="flex flex-col gap-4">
          <UserSelector />
        </div>
      )}
    </div>
  );
};

export default UserCreditSystem;
