import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '../contexts/UserContext';

export default function UserWalletScreen() {
  const { currentUser } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Wallet</Text>
      <View style={styles.walletCard}>
        <Text style={styles.label}>Available Credits</Text>
        <Text style={styles.balance}>{currentUser?.credits || 0}</Text>
        <Text style={styles.coins}>COINS</Text>
      </View>
      <Text style={styles.placeholder}>More wallet features coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fa1593',
    marginBottom: 30,
  },
  walletCard: {
    backgroundColor: '#1a1a2e',
    padding: 30,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fa1593',
    alignItems: 'center',
  },
  label: {
    color: '#999',
    fontSize: 14,
    marginBottom: 10,
  },
  balance: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fa1593',
  },
  coins: {
    color: '#95deff',
    fontSize: 16,
    marginTop: 5,
  },
  placeholder: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});


