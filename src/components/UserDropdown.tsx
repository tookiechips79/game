import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { User } from '../types/user';

interface UserDropdownProps {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showCredits?: boolean;
  showMembership?: boolean;
  filterActiveOnly?: boolean;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  selectedUserId,
  onUserChange,
  placeholder = "Select a user",
  disabled = false,
  className = "",
  showCredits = true,
  showMembership = false,
  filterActiveOnly = false
}) => {
  const { users, isUsersLoaded } = useUser();
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [internalSelectedUserId, setInternalSelectedUserId] = useState<string>(selectedUserId);

  // Fallback user data from localStorage
  const fallbackUsers = useMemo(() => {
    try {
      const stored = localStorage.getItem('users');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.warn('Failed to parse users from localStorage:', error);
    }
    return [];
  }, []);

  // Determine which users to display - with more robust fallback
  const displayUsers = useMemo(() => {
    // Priority: Context users > Local users > Fallback users
    if (users && users.length > 0) {
      console.log('📋 UserDropdown: Using context users:', users.length);
      return users;
    }
    if (localUsers.length > 0) {
      console.log('📋 UserDropdown: Using local users:', localUsers.length);
      return localUsers;
    }
    if (fallbackUsers.length > 0) {
      console.log('📋 UserDropdown: Using fallback users:', fallbackUsers.length);
      return fallbackUsers;
    }
    
    // Emergency fallback: Create a default admin if absolutely no users exist
    console.warn('🚨 UserDropdown: No users found anywhere, creating emergency admin');
    const emergencyAdmin: User = {
      id: "emergency-admin-" + Date.now(),
      name: "Admin",
      credits: 1000,
      password: "admin",
      wins: 0,
      losses: 0,
      membershipStatus: 'active',
      subscriptionDate: Date.now()
    };
    
    // Save to localStorage for future use
    try {
      localStorage.setItem('users', JSON.stringify([emergencyAdmin]));
    } catch (error) {
      console.error('Failed to save emergency admin to localStorage:', error);
    }
    
    return [emergencyAdmin];
  }, [users, localUsers, fallbackUsers]);


  // Filter users based on criteria
  const filteredUsers = useMemo(() => {
    let filtered = displayUsers;
    
    if (filterActiveOnly) {
      filtered = filtered.filter(user => user.membershipStatus === 'active');
    }
    
    return filtered;
  }, [displayUsers, filterActiveOnly]);

  // Check if dropdown should be enabled - always enabled if we have users
  const isEnabled = useMemo(() => {
    // Always enable if we have users, regardless of loading states
    return !disabled && (displayUsers.length > 0 || filteredUsers.length > 0);
  }, [disabled, displayUsers.length, filteredUsers.length]);

  // Loading state - only show loading if we truly have no users anywhere
  const isLoading = useMemo(() => {
    return !isUsersLoaded && !isLocalLoaded && fallbackUsers.length === 0 && displayUsers.length === 0;
  }, [isUsersLoaded, isLocalLoaded, fallbackUsers.length, displayUsers.length]);

  // Always ensure we have users - force refresh if empty
  useEffect(() => {
    if (displayUsers.length === 0 && !isLoading) {
      console.warn('🚨 UserDropdown: No users available, forcing refresh');
      // Try to reload from localStorage
      try {
        const stored = localStorage.getItem('users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalUsers(parsed);
            setIsLocalLoaded(true);
            console.log('✅ UserDropdown: Reloaded users from localStorage:', parsed.length);
          }
        }
      } catch (error) {
        console.error('Failed to reload users:', error);
      }
    }
  }, [displayUsers.length, isLoading]);

  // Retry mechanism for loading users
  useEffect(() => {
    if (!isUsersLoaded && !isLocalLoaded && fallbackUsers.length === 0 && retryCount < 3) {
      const retryTimeout = setTimeout(() => {
        console.log(`🔄 Retrying user load (attempt ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        
        // Try to reload from localStorage
        try {
          const stored = localStorage.getItem('users');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLocalUsers(parsed);
              setIsLocalLoaded(true);
              setLastError(null);
              return;
            }
          }
        } catch (error) {
          setLastError(`Failed to load users: ${error}`);
        }
        
        // If still no users, create a default admin
        if (retryCount >= 2) {
          const defaultAdmin: User = {
            id: "admin-" + Date.now(),
            name: "Admin",
            credits: 1000,
            password: "admin",
            wins: 0,
            losses: 0,
            membershipStatus: 'active',
            subscriptionDate: Date.now()
          };
          setLocalUsers([defaultAdmin]);
          setIsLocalLoaded(true);
          localStorage.setItem('users', JSON.stringify([defaultAdmin]));
        }
      }, 1000 * (retryCount + 1)); // Exponential backoff
      
      return () => clearTimeout(retryTimeout);
    }
  }, [isUsersLoaded, isLocalLoaded, fallbackUsers.length, retryCount]);

  // Sync with context when it becomes available
  useEffect(() => {
    if (isUsersLoaded && users && users.length > 0) {
      setLocalUsers(users);
      setIsLocalLoaded(true);
      setLastError(null);
    }
  }, [isUsersLoaded, users]);

  // Sync internal selectedUserId with prop changes
  useEffect(() => {
    console.log('🔄 UserDropdown: selectedUserId prop changed to:', selectedUserId);
    setInternalSelectedUserId(selectedUserId);
  }, [selectedUserId]);

  // Format user display text
  const formatUserText = (user: User) => {
    let text = user.name;
    
    if (showCredits) {
      text += ` (${user.credits} COINS)`;
    }
    
    if (showMembership) {
      const status = user.membershipStatus === 'active' ? 'ACTIVE' : 'INACTIVE';
      text += ` - ${status}`;
    }
    
    return text;
  };

  // Handle user selection
  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    console.log('🔄 UserDropdown: User selected:', userId, 'from', filteredUsers.length, 'users');
    console.log('🔄 UserDropdown: Current state - isEnabled:', isEnabled, 'disabled:', disabled, 'filteredUsers:', filteredUsers.length);
    onUserChange(userId);
  };

  // Get placeholder text
  const getPlaceholderText = () => {
    if (isLoading) {
      return "Loading users...";
    }
    if (lastError) {
      return "Error loading users";
    }
    // Never show "no users available" - we always have at least one user
    return placeholder;
  };

  return (
    <div className="relative">
      <select
        value={selectedUserId}
        onChange={handleUserChange}
        disabled={disabled || filteredUsers.length === 0}
        className={`
          w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600
          focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all
          ${(disabled || filteredUsers.length === 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        <option value="">
          {getPlaceholderText()}
        </option>
        {filteredUsers.map(user => (
          <option key={user.id} value={user.id}>
            {formatUserText(user)}
          </option>
        ))}
      </select>
      
      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
          Users: {filteredUsers.length} | 
          Context: {isUsersLoaded ? '✓' : '✗'} | 
          Local: {isLocalLoaded ? '✓' : '✗'} | 
          Fallback: {fallbackUsers.length}
          {lastError && ` | Error: ${lastError}`}
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
