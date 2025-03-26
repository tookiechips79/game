
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Coins, UserPlus, User as UserIcon, MinusCircle } from "lucide-react";

export const UserSelector: React.FC = () => {
  const { users, currentUser, setCurrentUser } = useUser();
  
  return (
    <div className="mb-4">
      <div className="flex flex-col gap-2">
        <label className="text-white text-sm font-medium">Select User:</label>
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-gray-800 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-white"
          value={currentUser?.id || ""}
          onChange={(e) => {
            const selectedUser = users.find(u => u.id === e.target.value);
            setCurrentUser(selectedUser || null);
          }}
        >
          <option value="">-- Select User --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.credits} COINS
            </option>
          ))}
        </select>
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
      toast.error("Please enter a valid name");
      return;
    }
    
    if (!newUserPassword.trim()) {
      toast.error("Please enter a valid password");
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
    <Card className="bg-gray-800/70 border-[#a3e635]/30 shadow-[0_0_15px_rgba(249,115,22,0.3)] mb-4 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#a3e635] flex items-center gap-2">
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
            className="bg-[#a3e635] hover:bg-[#a3e635]/90 text-black rounded-xl"
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
  const { users, addCredits, deductCredits } = useUser();
  
  const handleAddCredits = () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    
    if (!creditAmount || creditAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    addCredits(selectedUserId, creditAmount, true); // Pass isAdmin=true flag
    setCreditAmount(100); // Reset to default value
  };
  
  const handleDeleteCredits = () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    
    if (!creditAmount || creditAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    const user = users.find(u => u.id === selectedUserId);
    if (!user) {
      toast.error("User not found");
      return;
    }
    
    const success = deductCredits(selectedUserId, creditAmount, true); // Pass isAdminAction=true flag
    if (success) {
      toast.success("COINS Deducted", {
        description: `Removed ${creditAmount} COINS from ${user.name}`
      });
      setCreditAmount(100); // Reset to default value
    }
  };
  
  return (
    <Card className="bg-gray-800/70 border-[#a3e635]/30 shadow-[0_0_15px_rgba(249,115,22,0.3)] mb-4 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#a3e635] flex items-center gap-2">
          <Coins className="h-4 w-4" />
          Manage COINS (Admin)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-gray-700 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">-- Select User --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.credits} COINS
              </option>
            ))}
          </select>
          
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(10)}
              className={`${creditAmount === 10 ? 'bg-[#a3e635] text-black' : 'bg-gray-700 text-white'} border-gray-600 rounded-xl`}
            >
              10
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(50)}
              className={`${creditAmount === 50 ? 'bg-[#a3e635] text-black' : 'bg-gray-700 text-white'} border-gray-600 rounded-xl`}
            >
              50
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(100)}
              className={`${creditAmount === 100 ? 'bg-[#a3e635] text-black' : 'bg-gray-700 text-white'} border-gray-600 rounded-xl`}
            >
              100
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(200)}
              className={`${creditAmount === 200 ? 'bg-[#a3e635] text-black' : 'bg-gray-700 text-white'} border-gray-600 rounded-xl`}
            >
              200
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(500)}
              className={`${creditAmount === 500 ? 'bg-[#a3e635] text-black' : 'bg-gray-700 text-white'} border-gray-600 rounded-xl`}
            >
              500
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCreditAmount(1000)}
              className={`${creditAmount === 1000 ? 'bg-[#a3e635] text-black' : 'bg-gray-700 text-white'} border-gray-600 rounded-xl`}
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
                className="bg-gradient-to-r from-[#a3e635] to-[#84cc16] hover:from-[#a3e635] hover:to-[#65a30d] text-black rounded-xl w-1/2"
              >
                Add
              </Button>
              <Button 
                onClick={handleDeleteCredits} 
                className="bg-gradient-to-r from-[#FF3366] to-[#FF0066] hover:from-[#FF3366] hover:to-[#CC0052] text-white rounded-xl w-1/2 flex items-center gap-2"
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
    <Card className="bg-gray-800/70 border-[#a3e635]/30 shadow-[0_0_15px_rgba(249,115,22,0.3)] mb-4 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#a3e635] flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          Current User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-white">
            <span className="font-bold">{currentUser.name}</span>
          </div>
          {!hideCredits && (
            <div className="bg-[#a3e635]/20 p-2 rounded-xl text-[#a3e635] font-bold">
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
