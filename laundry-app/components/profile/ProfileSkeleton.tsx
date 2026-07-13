import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const ProfileSkeleton = () => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { opacity }]} />
        <Animated.View style={[styles.title, { opacity }]} />
        <Animated.View style={[styles.badge, { opacity }]} />
      </View>

      <View style={styles.section}>
        <Animated.View style={[styles.line, { opacity, width: '80%' }]} />
        <Animated.View style={[styles.line, { opacity, width: '60%' }]} />
        <Animated.View style={[styles.line, { opacity, width: '90%' }]} />
      </View>

      <View style={styles.section}>
        <Animated.View style={[styles.line, { opacity }]} />
        <Animated.View style={[styles.line, { opacity }]} />
      </View>

      <View style={styles.buttons}>
        <Animated.View style={[styles.button, { opacity }]} />
        <Animated.View style={[styles.button, { opacity }]} />
        <Animated.View style={[styles.button, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e1e4e8',
    marginBottom: 15,
  },
  title: {
    width: 150,
    height: 24,
    backgroundColor: '#e1e4e8',
    borderRadius: 4,
    marginBottom: 10,
  },
  badge: {
    width: 80,
    height: 20,
    backgroundColor: '#e1e4e8',
    borderRadius: 10,
  },
  section: {
    marginBottom: 25,
  },
  line: {
    height: 16,
    backgroundColor: '#e1e4e8',
    borderRadius: 4,
    marginBottom: 12,
  },
  buttons: {
    marginTop: 'auto',
  },
  button: {
    height: 50,
    backgroundColor: '#e1e4e8',
    borderRadius: 8,
    marginBottom: 12,
  },
});
