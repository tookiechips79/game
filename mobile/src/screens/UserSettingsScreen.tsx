import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useUser } from '../contexts/UserContext';

export default function UserSettingsScreen() {
  const { currentUser } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingItem}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{currentUser?.name}</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.label}>Account Type</Text>
          <Text style={styles.value}>
            {currentUser?.isMember ? 'Premium' : 'Free'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.label}>Notifications</Text>
          <Text style={styles.toggle}>●</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.label}>Dark Mode</Text>
          <Text style={styles.toggle}>●</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#95deff',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#1a1a2e',
    marginBottom: 8,
    borderRadius: 8,
  },
  label: {
    color: '#fff',
    fontSize: 14,
  },
  value: {
    color: '#fa1593',
    fontSize: 14,
  },
  toggle: {
    color: '#0f0',
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 40,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

