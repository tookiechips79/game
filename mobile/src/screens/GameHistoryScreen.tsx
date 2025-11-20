import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useUser } from '../contexts/UserContext';

export default function GameHistoryScreen() {
  const { betHistory } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game History</Text>

      {betHistory && betHistory.length > 0 ? (
        <FlatList
          data={betHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.gameCard}>
              <View style={styles.gameHeader}>
                <Text style={styles.gameNumber}>Game #{item.gameNumber}</Text>
                <Text style={styles.winner}>{item.winningTeam} Won</Text>
              </View>
              <View style={styles.gameDetails}>
                <Text style={styles.detail}>
                  {item.teamAName}: {item.teamAScore}
                </Text>
                <Text style={styles.detail}>
                  {item.teamBName}: {item.teamBScore}
                </Text>
              </View>
              {item.totalAmount > 0 && (
                <Text style={styles.amount}>
                  Total: {item.totalAmount} coins
                </Text>
              )}
            </View>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No game history yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fa1593',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  gameCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#fa1593',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gameNumber: {
    color: '#95deff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  winner: {
    color: '#fa1593',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameDetails: {
    marginBottom: 8,
  },
  detail: {
    color: '#999',
    fontSize: 13,
    marginBottom: 4,
  },
  amount: {
    color: '#0f0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

