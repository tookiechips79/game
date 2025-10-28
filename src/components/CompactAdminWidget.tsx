import React, { useState, useEffect, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ChevronUp, ChevronDown, Lock, Unlock, Key, UserPlus, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import UserDropdown from "./UserDropdown";
import UserCreditSystem from "@/components/UserCreditSystem";
import { Link } from "react-router-dom";

interface CompactAdminWidgetProps {
  isAdmin: boolean;
  isAgent?: boolean;
  onToggleAdmin?: () => void;
  setAdminLocked?: (locked: boolean) => void;
  adminLocked?: boolean;
  openPasswordModal?: () => void;
}

const ADMIN_PASSWORD_KEY = "betting_app_admin_password";
const DEFAULT_PASSWORD = "admin123";

const CompactAdminWidget = React.forwardRef<
  { openModal: () => void },
  CompactAdminWidgetProps
>(({
  isAdmin,
  isAgent = false,
  onToggleAdmin,
  setAdminLocked,
  adminLocked: adminLockedProp
}, ref) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  
  // CRITICAL: Track admin lock separately from isAdmin prop
  // adminLocked = true means user hasn't entered password yet (password form shows)
  // adminLocked = false means user has entered correct password (admin controls show)
  const [adminLocked, setAdminLockedState] = useState<boolean>(false);
  const [adminModePassword, setAdminModePassword] = useState<string>("");
  const [storedPassword, setStoredPassword] = useState<string>(DEFAULT_PASSWORD);
  
  // State for password change form
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  
  // State for password modal popup
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);

  // User Management states
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserPassword, setNewUserPassword] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<number>(100);

  // Get user functions from context
  const { addUser, setCurrentUser, addCredits, deductCredits, users } = useUser();

  // Handle Create User
  const handleCreateUser = () => {
    if (!newUserName.trim()) {
      toast.error("Please enter a valid name", { className: "custom-toast-error" });
      return;
    }
    if (!newUserPassword.trim()) {
      toast.error("Please enter a valid password", { className: "custom-toast-error" });
      return;
    }
    const newUser = addUser(newUserName.trim(), newUserPassword.trim());
    if (newUser) {
      setCurrentUser(newUser);
      toast.success("User Created", { description: `New user "${newUserName}" created successfully`, className: "custom-toast-success" });
      setNewUserName("");
      setNewUserPassword("");
    }
  };

  // Handle Add Credits
  const handleAddCredits = () => {
    if (!selectedUserId) {
      toast.error("Please select a user", { className: "custom-toast-error" });
      return;
    }
    if (!creditAmount || creditAmount <= 0) {
      toast.error("Please enter a valid amount", { className: "custom-toast-error" });
      return;
    }
    addCredits(selectedUserId, creditAmount, true);
    toast.success("COINS Added", { description: `Added ${creditAmount} COINS`, className: "custom-toast-success" });
    setCreditAmount(100);
  };

  // Handle Remove Credits
  const handleRemoveCredits = () => {
    if (!selectedUserId) {
      toast.error("Please select a user", { className: "custom-toast-error" });
      return;
    }
    if (!creditAmount || creditAmount <= 0) {
      toast.error("Please enter a valid amount", { className: "custom-toast-error" });
      return;
    }
    const user = users.find(u => u.id === selectedUserId);
    if (!user) {
      toast.error("User not found", { className: "custom-toast-error" });
      return;
    }
    deductCredits(selectedUserId, creditAmount, true);
    toast.success("COINS Removed", { description: `Removed ${creditAmount} COINS from ${user.name}`, className: "custom-toast-success" });
    setCreditAmount(100);
  };
  
  // Expose openModal method to parent via ref
  useImperativeHandle(ref, () => ({
    openModal: () => {
      console.log('🔐 [CompactAdminWidget] openModal called via ref');
      setShowPasswordModal(true);
      setAdminModePassword("");
      setAdminLockedState(true);
    }
  }), []);

  // Load admin password on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_PASSWORD_KEY);
      if (stored) {
        setStoredPassword(stored);
      } else {
        localStorage.setItem(ADMIN_PASSWORD_KEY, DEFAULT_PASSWORD);
        setStoredPassword(DEFAULT_PASSWORD);
      }
      // Don't auto-lock on mount - only lock when admin button is clicked
    } catch (error) {
      console.error("Error loading admin password:", error);
    }
  }, []);

  // Watch for changes in the adminLockedProp from parent (when admin button is clicked)
  useEffect(() => {
    console.log('🔐 [CompactAdminWidget] adminLockedProp changed:', adminLockedProp);
    // When adminLockedProp is true (admin button was clicked), open the modal
    if (adminLockedProp === true) {
      console.log('🔐 [CompactAdminWidget] Admin button was clicked, opening password modal NOW');
      setShowPasswordModal(true);
      setAdminModePassword(""); // Clear password input when modal opens
      setAdminLockedState(true);
    } else if (adminLockedProp === false) {
      // When admin button is clicked while unlocked, it locks (adminLockedProp = false doesn't mean close modal)
      console.log('🔐 [CompactAdminWidget] Admin is now unlocked, closing modal');
      setShowPasswordModal(false);
      setAdminLockedState(false);
    }
  }, [adminLockedProp]);

  // Watch for changes in local adminLocked state
  useEffect(() => {
    console.log('🔐 [CompactAdminWidget] local adminLocked state changed:', adminLocked);
  }, [adminLocked]);

  const handleEnterAdminMode = (): boolean => {
    console.log('🔐 [Password Check] Entered password:', adminModePassword);
    console.log('🔐 [Password Check] Stored password:', storedPassword);
    
    if (!adminModePassword) {
      toast.error("Please enter password", {
        description: "Password is required",
        className: "custom-toast-error"
      });
      return false;
    }

    if (adminModePassword !== storedPassword) {
      console.log('❌ [Password Check] Password mismatch!');
      toast.error("Incorrect Password", {
        description: "The password you entered is incorrect",
        className: "custom-toast-error"
      });
      setAdminModePassword("");
      return false;
    }

    console.log('✅ [Password Check] Password is correct!');
    return true;
  };

  const handleConfirmEnter = () => {
    if (handleEnterAdminMode()) {
      console.log('✅ [Admin Unlock] Unlocking admin mode');
      toast.success("Admin Mode Unlocked", {
        description: "You now have access to admin controls",
        className: "custom-toast-success"
      });
      setAdminModePassword("");
      setShowPasswordModal(false);
      // UNLOCK ADMIN MODE (make adminLocked = false)
      setAdminLockedState(false);
      // Notify parent that admin is unlocked
      if (setAdminLocked) {
        setAdminLocked(false);
      }
      // Also toggle the isAdmin prop
      if (onToggleAdmin) {
        onToggleAdmin();
      }
    } else {
      console.log('❌ [Admin Unlock] Password validation failed, NOT unlocking');
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      toast.error("Please enter current password", {
        description: "Required to verify your identity",
        className: "custom-toast-error"
      });
      return;
    }

    if (currentPassword !== storedPassword) {
      toast.error("Current password is incorrect", {
        description: "Unable to change password",
        className: "custom-toast-error"
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Please enter new password", {
        description: "New password and confirmation required",
        className: "custom-toast-error"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", {
        description: "Confirmation password must match new password",
        className: "custom-toast-error"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters",
        className: "custom-toast-error"
      });
      return;
    }

    try {
      localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
      setStoredPassword(newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      
      toast.success("Password changed successfully", {
        description: "Your admin password has been updated",
        className: "custom-toast-success"
      });
    } catch (error) {
      console.error("Error saving password:", error);
      toast.error("Failed to save password", {
        description: "Please try again",
        className: "custom-toast-error"
      });
    }
  };

  if (isHidden) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full text-white hover:bg-opacity-90"
        style={{ backgroundColor: '#fa1593', borderColor: '#fa1593' }}
        onClick={() => setIsHidden(false)}
      >
        <ShieldCheck className="h-4 w-4 mr-2 text-white" />
        Show Admin Panel
      </Button>
    );
  }

  return (
    <Card className="w-full hover:bg-opacity-90 transition-colors rounded-xl overflow-hidden shadow-[0_0_15px_rgba(250,21,147,0.3)]" style={{ borderColor: '#fa1593', backgroundColor: '#052240' }}>
      <CardContent className="p-0">
        {/* Header */}
        <div
          className="p-2 cursor-pointer flex items-center justify-between rounded-t-xl"
          style={{ background: 'linear-gradient(to right, #fa1593, #004b6b)' }}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <ShieldCheck className="h-4 w-4 text-white mr-2" />
            <h3 className="font-bold text-white text-sm">Admin Panel</h3>
            {adminLocked && <Lock className="h-3 w-3 text-red-400 ml-2" />}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-white hover:text-white hover:bg-opacity-80"
              style={{ backgroundColor: 'transparent' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsHidden(true);
              }}
            >
              <ShieldCheck className="h-3 w-3" />
            </Button>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-white" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white" />
            )}
          </div>
        </div>

        {/* Content */}
        {expanded && (
          <div className="p-3 space-y-3" style={{ backgroundColor: '#004b6b' }}>
            {/* ADMIN CONTROLS - ONLY SHOW WHEN UNLOCKED (!adminLocked) */}
            {!adminLocked && (
              <>
                {/* Combined User Management Panel */}
                <Card className="rounded-lg border-2" style={{ borderColor: '#fa1593', backgroundColor: '#052240' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-2" style={{ color: '#95deff' }}>
                      <UserPlus className="h-4 w-4" />
                      User Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Create New User Section */}
                    <div className="p-2 rounded border-2" style={{ borderColor: '#750037', backgroundColor: '#004b6b' }}>
                      <label className="text-xs font-semibold text-white block mb-2">Create New User</label>
                      <Input
                        type="text"
                        placeholder="User name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="rounded text-white text-xs mb-2 h-7"
                        style={{ backgroundColor: '#052240', borderColor: '#fa1593' }}
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="rounded text-white text-xs mb-2 h-7"
                        style={{ backgroundColor: '#052240', borderColor: '#fa1593' }}
                      />
                      <Button 
                        onClick={handleCreateUser}
                        className="w-full text-white h-6 text-xs font-semibold"
                        style={{ backgroundColor: '#95deff', color: '#004b6b' }}>
                        Create User
                      </Button>
                    </div>

                    {/* Manage COINS Section */}
                    <div className="p-2 rounded border-2" style={{ borderColor: '#750037', backgroundColor: '#004b6b' }}>
                      <label className="text-xs font-semibold text-white flex items-center gap-1 mb-2">
                        <Coins className="h-3 w-3" style={{ color: '#fa1593' }} />
                        Manage COINS
                      </label>
                      <UserDropdown
                        selectedUserId={selectedUserId}
                        onUserChange={setSelectedUserId}
                        placeholder="Select user"
                        showCredits={true}
                        showMembership={false}
                      />
                      <div className="grid grid-cols-3 gap-1 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreditAmount(10)}
                          className={`text-white text-xs h-6 font-semibold`}
                          style={creditAmount === 10 ? { backgroundColor: '#fa1593', borderColor: '#fa1593', color: 'white' } : { backgroundColor: '#052240', borderColor: '#95deff', color: '#95deff' }}>
                          10
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreditAmount(50)}
                          className={`text-white text-xs h-6 font-semibold`}
                          style={creditAmount === 50 ? { backgroundColor: '#fa1593', borderColor: '#fa1593', color: 'white' } : { backgroundColor: '#052240', borderColor: '#95deff', color: '#95deff' }}>
                          50
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreditAmount(100)}
                          className={`text-white text-xs h-6 font-semibold`}
                          style={creditAmount === 100 ? { backgroundColor: '#fa1593', borderColor: '#fa1593', color: 'white' } : { backgroundColor: '#052240', borderColor: '#95deff', color: '#95deff' }}>
                          100
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreditAmount(200)}
                          className={`text-white text-xs h-6 font-semibold`}
                          style={creditAmount === 200 ? { backgroundColor: '#fa1593', borderColor: '#fa1593', color: 'white' } : { backgroundColor: '#052240', borderColor: '#95deff', color: '#95deff' }}>
                          200
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreditAmount(500)}
                          className={`text-white text-xs h-6 font-semibold`}
                          style={creditAmount === 500 ? { backgroundColor: '#fa1593', borderColor: '#fa1593', color: 'white' } : { backgroundColor: '#052240', borderColor: '#95deff', color: '#95deff' }}>
                          500
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreditAmount(1000)}
                          className={`text-white text-xs h-6 font-semibold`}
                          style={creditAmount === 1000 ? { backgroundColor: '#fa1593', borderColor: '#fa1593', color: 'white' } : { backgroundColor: '#052240', borderColor: '#95deff', color: '#95deff' }}>
                          1000
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        <Button 
                          onClick={handleAddCredits}
                          className="text-white h-6 text-xs font-semibold"
                          style={{ backgroundColor: '#95deff', color: '#004b6b' }}>
                          Add
                        </Button>
                        <Button 
                          onClick={handleRemoveCredits}
                          className="text-white h-6 text-xs font-semibold"
                          style={{ backgroundColor: '#fa1593', color: 'white' }}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Password Settings */}
                <div className="h-px" style={{ backgroundColor: '#fa1593', opacity: 0.5 }}></div>
                
                <div className="p-2 rounded-lg border-2" style={{ borderColor: '#fa1593', backgroundColor: '#004b6b' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" style={{ color: '#95deff' }} />
                      <span className="text-xs font-semibold text-white">Change Password</span>
                    </div>
                    <Button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      variant="outline"
                      size="sm"
                      className={`h-6 text-xs px-2 text-white font-semibold`}
                      style={showPasswordForm ? { backgroundColor: '#95deff', borderColor: '#95deff', color: '#004b6b' } : { backgroundColor: '#052240', borderColor: '#95deff', color: '#95deff' }}
                    >
                      {showPasswordForm ? 'Hide' : 'Edit'}
                    </Button>
                  </div>

                  {showPasswordForm && (
                    <div className="space-y-2 mt-2">
                      <Input
                        type="password"
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-7 text-xs text-white"
                        style={{ backgroundColor: '#052240', borderColor: '#fa1593' }}
                      />
                      <Input
                        type="password"
                        placeholder="New Password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-7 text-xs text-white"
                        style={{ backgroundColor: '#052240', borderColor: '#fa1593' }}
                      />
                      <Input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-7 text-xs text-white"
                        style={{ backgroundColor: '#052240', borderColor: '#fa1593' }}
                      />
                      <Button
                        onClick={handleChangePassword}
                        className="w-full text-white h-6 text-xs font-semibold"
                        style={{ backgroundColor: '#95deff', color: '#004b6b' }}
                      >
                        Update Password
                      </Button>
                    </div>
                  )}
                </div>

                {/* Reload Coins Button */}
                <Link to="/reload-coins" className="w-full">
                  <Button
                    className="w-full text-white h-8 text-xs font-semibold flex items-center justify-center"
                    style={{ backgroundColor: '#fa1593', color: 'white' }}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Reload Coins
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </CardContent>

      {/* PASSWORD MODAL POPUP */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="w-96 rounded-2xl shadow-2xl" style={{
            borderColor: '#fa1593',
            backgroundColor: '#052240',
            background: 'linear-gradient(135deg, #052240 0%, #004b6b 100%)',
            border: '2px solid #fa1593',
            boxShadow: '0 0 30px rgba(250, 21, 147, 0.5)'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5" style={{ color: '#fa1593' }} />
                <h2 className="text-lg font-bold text-white">🔒 Admin Access</h2>
              </div>
              
              <p className="text-sm text-[#95deff] mb-4">Enter the admin password to unlock scoreboard controls.</p>
              
              <Input
                type="password"
                placeholder="Admin Password"
                value={adminModePassword}
                onChange={(e) => setAdminModePassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmEnter();
                  }
                }}
                autoFocus
                className="h-10 text-sm bg-[#004b6b] border-2 border-[#95deff] text-white placeholder-gray-400 focus:border-[#fa1593] mb-6"
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmEnter}
                  className="flex-1 bg-[#fa1593] hover:bg-[#fa1593]/80 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(250,21,147,0.4)]"
                >
                  🔓 Unlock
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setAdminModePassword("");
                  }}
                  variant="outline"
                  className="flex-1 bg-[#004b6b] text-[#95deff] hover:bg-[#004b6b]/80 border-[#95deff] rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
});

export default CompactAdminWidget;
