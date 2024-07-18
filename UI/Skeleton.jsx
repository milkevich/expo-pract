import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const Skeleton = ({ height = 100, width = screenWidth - 42 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width], 
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Animated.View
        style={[
          styles.shimmerWrapper,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0, 0.05)', 'transparent']}
          start={[0, 0.1]}
          end={[0.5, 0.1]}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderRadius: 20,
    marginTop: 14
  },
  shimmerWrapper: {
    width: '200%',
    height: '100%',
    position: 'absolute',
  },
  shimmer: {
    width: '50%',
    height: '100%',
  },
});

export default Skeleton;
