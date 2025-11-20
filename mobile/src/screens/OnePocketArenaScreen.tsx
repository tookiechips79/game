import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useGameState } from '../contexts/GameStateContext';
import { useUser } from '../contexts/UserContext';
import { socketIOService } from '../services/socketIOService';

export default function OnePocketArenaScreen() {
  const { gameState, updateGameState } = useGameState();
  const { currentUser, betHistory } = useUser();
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Glow animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Join arena on mount
    socketIOService.emitSetArena('one_pocket');

    // Listen for real-time updates
    socketIOService.onGameStateUpdate((data) => {
      console.log('📥 Game state updated:', data);
    });

    return () => {
      // Cleanup listeners
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>One Pocket Arena</Text>
      </View>

      {/* Score Display */}
      <View style={styles.scoreBoard}>
        <View style={styles.teamScore}>
          <Text style={styles.teamName}>Team A</Text>
          <Text style={styles.score}>{gameState?.teamAGames || 0}</Text>
          <Text style={styles.balls}>{gameState?.teamABalls || 0} balls</Text>
        </View>

        {/* Animated VS */}
        <Animated.View
          style={[
            styles.vsContainer,
            {
              shadowOpacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              shadowRadius: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [5, 20],
              }),
            },
          ]}
        >
          <Text style={styles.vsText}>VS</Text>
        </Animated.View>

        <View style={styles.teamScore}>
          <Text style={styles.teamName}>Team B</Text>
          <Text style={styles.score}>{gameState?.teamBGames || 0}</Text>
          <Text style={styles.balls}>{gameState?.teamBBalls || 0} balls</Text>
        </View>
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <Text style={styles.infoLabel}>Current Game</Text>
        <Text style={styles.gameNumber}>Game #{gameState?.currentGameNumber || 1}</Text>
      </View>

      {/* Betting Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Bet</Text>
        <View style={styles.betButtons}>
          <TouchableOpacity style={[styles.betButton, styles.teamAButton]}>
            <Text style={styles.betButtonText}>Bet Team A</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.betButton, styles.teamBButton]}>
            <Text style={styles.betButtonText}>Bet Team B</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Games */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Games</Text>
        {betHistory && betHistory.length > 0 ? (
          betHistory.slice(0, 3).map((game) => (
            <View key={game.id} style={styles.gameCard}>
              <Text style={styles.gameCardTitle}>Game #{game.gameNumber}</Text>
              <Text style={styles.gameCardWinner}>
                {game.winningTeam} Won
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No games yet</Text>
        )}
      </View>

      {/* User Info */}
      {currentUser && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Info</Text>
          <View style={styles.userCard}>
            <Text style={styles.userLabel}>Username: {currentUser.name}</Text>
            <Text style={styles.userLabel}>Credits: {currentUser.credits}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fa1593',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fa1593',
    marginBottom: 10,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#1a1a2e',
    marginVertical: 15,
    marginHorizontal: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fa1593',
  },
  teamScore: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    color: '#95deff',
    marginBottom: 8,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fa1593',
    marginBottom: 5,
  },
  balls: {
    fontSize: 12,
    color: '#666',
  },
  vsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 21, 147, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fa1593',
    minWidth: 80,
    shadowColor: '#fa1593',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 15,
  },
  vsText: {
    fontSize: 32,
    color: '#fa1593',
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  gameInfo: {
    alignItems: 'center',
    marginVertical: 15,
  },
  infoLabel: {
    color: '#666',
    fontSize: 12,
  },
  gameNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#95deff',
    marginTop: 5,
  },
  section: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fa1593',
    marginBottom: 15,
  },
  betButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  betButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  teamAButton: {
    backgroundColor: '#0066cc',
  },
  teamBButton: {
    backgroundColor: '#ff00ff',
  },
  betButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gameCard: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#fa1593',
  },
  gameCardTitle: {
    color: '#95deff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameCardWinner: {
    color: '#fa1593',
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  userCard: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 8,
  },
  userLabel: {
    color: '#95deff',
    marginBottom: 8,
  },
});

