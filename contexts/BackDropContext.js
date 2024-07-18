import React, { createContext, useState, useContext } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const BackdropContext = createContext();

export const useBackdrop = () => {
    return useContext(BackdropContext);
};

export const BackdropProvider = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    const showBackdrop = () => {
        setIsVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const hideBackdrop = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setIsVisible(false);
        });
    };

    return (
        <BackdropContext.Provider value={{ showBackdrop, hideBackdrop }}>
            {children}
            {isVisible && (
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
            )}
        </BackdropContext.Provider>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
    },
});
