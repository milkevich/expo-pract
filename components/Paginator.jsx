import React from 'react';
import { Animated, View, useWindowDimensions, StyleSheet } from 'react-native';

const Paginator = ({ data, scrollX, style }) => {
    const { width } = useWindowDimensions();

    return (
        <View style={[{ flexDirection: 'row', height: 60 }, style]}>
            {data.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [10, 20, 10],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={i.toString()}
                        style={[styles.dot, { width: dotWidth, opacity }]}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    dot: {
        height: 7,
        borderRadius: 5,
        backgroundColor: '#fff',
        marginHorizontal: 6,
    },
});

export default Paginator;
