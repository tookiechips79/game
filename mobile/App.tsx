import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import OnePocketArenaScreen from './src/screens/OnePocketArenaScreen';
import GameHistoryScreen from './src/screens/GameHistoryScreen';
import UserWalletScreen from './src/screens/UserWalletScreen';
import UserSettingsScreen from './src/screens/UserSettingsScreen';

// Providers
import { UserProvider } from './src/contexts/UserContext';
import { GameStateProvider } from './src/contexts/GameStateContext';

/**
 * Simple tab navigation for web/mobile
 */
const TabNavigation = ({ currentTab, setCurrentTab }: any) => {
  const tabs = [
    { id: 'arena', label: '🎱 Betting', component: OnePocketArenaScreen },
    { id: 'history', label: '📜 History', component: GameHistoryScreen },
    { id: 'wallet', label: '💰 Wallet', component: UserWalletScreen },
    { id: 'settings', label: '⚙️ Settings', component: UserSettingsScreen },
  ];

  const CurrentComponent = tabs.find(t => t.id === currentTab)?.component || OnePocketArenaScreen;

  return (
    <View style={styles.tabContainer}>
      {/* Tab buttons */}
      <View style={styles.tabButtons}>
        {tabs.map(tab => (
          <Text
            key={tab.id}
            style={[
              styles.tabButton,
              currentTab === tab.id && styles.tabButtonActive
            ]}
            onPress={() => setCurrentTab(tab.id)}
          >
            {tab.label}
          </Text>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView style={styles.tabContent}>
        <CurrentComponent />
      </ScrollView>
    </View>
  );
};

/**
 * Root App component
 */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState('arena');

  return (
    <UserProvider>
      <GameStateProvider>
        <View style={styles.container}>
          {!isLoggedIn ? (
            <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />
          ) : (
            <TabNavigation currentTab={currentTab} setCurrentTab={setCurrentTab} />
          )}
          <StatusBar barStyle="light-content" />
        </View>
      </GameStateProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 2,
    borderBottomColor: '#fa1593',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  tabButtonActive: {
    color: '#fa1593',
    borderBottomWidth: 3,
    borderBottomColor: '#fa1593',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#000',
  },
});
