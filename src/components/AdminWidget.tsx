
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, ShieldCheck, ChevronDown, ChevronUp, Key, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AdminWidgetProps {
  isAdmin: boolean;
  isAgent?: boolean;
  onToggleAdmin: () => void;
  onToggleAgent?: () => void;
}

const ADMIN_PASSWORD_KEY = "betting_app_admin_password";
const DEFAULT_PASSWORD = "admin123";

const AdminWidget: React.FC<AdminWidgetProps> = ({
  isAdmin,
  isAgent = false,
  onToggleAdmin,
  onToggleAgent
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>(DEFAULT_PASSWORD);
  const [adminModePassword, setAdminModePassword] = useState<string>("");
  const [showAdminModeForm, setShowAdminModeForm] = useState<boolean>(false);

  // Load admin password on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_PASSWORD_KEY);
      if (stored) {
        setAdminPassword(stored);
      } else {
        localStorage.setItem(ADMIN_PASSWORD_KEY, DEFAULT_PASSWORD);
        setAdminPassword(DEFAULT_PASSWORD);
      }
    } catch (error) {
      console.error("Error loading admin password:", error);
    }
  }, []);

  const handleEnterAdminMode = () => {
    if (!adminModePassword) {
      toast.error("Please enter password", {
        description: "Password is required",
        className: "custom-toast-error"
      });
      return;
    }

    if (adminModePassword !== adminPassword) {
      toast.error("Incorrect Password", {
        description: "The password you entered is incorrect",
        className: "custom-toast-error"
      });
      setAdminModePassword("");
      return;
    }

    onToggleAdmin();
    setAdminModePassword("");
    setShowAdminModeForm(false);
    toast.success("Admin Mode Activated", {
      description: "You now have access to admin controls",
      className: "custom-toast-success"
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      toast.error("Please enter current password", {
        description: "Required to verify your identity",
        className: "custom-toast-error"
      });
      return;
    }

    if (currentPassword !== adminPassword) {
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
      setAdminPassword(newPassword);
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

  return (
    <Card className="bg-gray-900 border-2 border-purple-600 w-96 hover:border-purple-700 transition-colors rounded-xl overflow-hidden shadow-[0_0_15px_rgba(147,51,234,0.3)]">
      <CardContent className="p-0">
        {/* Header */}
        <div 
          className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 cursor-pointer flex items-center justify-between rounded-t-xl"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <ShieldCheck className="h-5 w-5 text-white mr-2" />
            <h3 className="font-bold text-white">Admin Panel</h3>
          </div>
          <div>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-white" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white" />
            )}
          </div>
        </div>
        
        {/* Content */}
        {expanded && (
          <div className="p-4 space-y-4">
            {/* Admin Mode Status */}
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-300">Admin Mode</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${isAdmin ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {isAdmin ? '🟢 ACTIVE' : '🔴 INACTIVE'}
                </span>
              </div>

              {!isAdmin ? (
                <>
                  <Button
                    onClick={() => setShowAdminModeForm(!showAdminModeForm)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-2"
                    size="sm"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Enter Admin Mode
                  </Button>

                  {showAdminModeForm && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-700">
                      <label className="text-xs font-semibold text-purple-300">Admin Password</label>
                      <Input
                        type="password"
                        placeholder="Enter admin password"
                        value={adminModePassword}
                        onChange={(e) => setAdminModePassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEnterAdminMode()}
                        className="h-8 text-xs bg-gray-700 border-gray-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleEnterAdminMode}
                          size="sm"
                          className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                        >
                          Enter
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAdminModeForm(false);
                            setAdminModePassword("");
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
            <Button
              onClick={onToggleAdmin}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
                  <Unlock className="h-4 w-4 mr-2" />
                  Exit Admin Mode
            </Button>
              )}
            </div>
            
            {/* Agent Mode Toggle */}
            {onToggleAgent && (
              <Button
                onClick={onToggleAgent}
                variant="outline"
                size="sm"
                className={`w-full flex items-center gap-2 rounded-lg ${isAgent ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
              >
                <AlertCircle className="h-4 w-4" />
                {isAgent ? "Exit Agent Mode" : "Agent Mode"}
              </Button>
            )}

            {/* Password Settings - Only visible in admin mode */}
            {isAdmin && (
              <>
                <div className="h-px bg-purple-600 opacity-30"></div>
                
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-semibold text-gray-300">Password Settings</span>
                    </div>
                    <Button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      variant="outline"
                      size="sm"
                      className={`h-7 text-xs ${showPasswordForm ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600' : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'}`}
                    >
                      {showPasswordForm ? 'Hide' : 'Change'}
                    </Button>
                  </div>

                  {showPasswordForm && (
                    <div className="space-y-2 pt-3 border-t border-gray-700">
                      <label className="text-xs font-semibold text-purple-300">Current Password</label>
                      <Input
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-8 text-xs bg-gray-700 border-gray-600 text-white"
                      />

                      <label className="text-xs font-semibold text-purple-300 block mt-2">New Password</label>
                      <Input
                        type="password"
                        placeholder="Enter new password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-8 text-xs bg-gray-700 border-gray-600 text-white"
                      />

                      <label className="text-xs font-semibold text-purple-300 block mt-2">Confirm Password</label>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-8 text-xs bg-gray-700 border-gray-600 text-white"
                      />

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleChangePassword}
                          size="sm"
                          className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                        >
                          Update
                        </Button>
                        <Button
                          onClick={() => {
                            setShowPasswordForm(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>

                      <div className="text-xs text-gray-400 mt-3 p-2 bg-gray-700 rounded">
                        <p className="font-semibold mb-1">💡 Current Password:</p>
                        <p className="text-yellow-400 font-mono">{adminPassword}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminWidget;
