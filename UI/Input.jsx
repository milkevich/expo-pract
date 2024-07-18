import React from 'react';
import { StyleSheet, TextInput, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const Input = ({ value, placeholder, onChangeText, password, includeLabel, label, keyboardType, transparent, autoCapitalize, border, marginBottom, multiline , height, noTopPadding}) => {
    const theme = useTheme();

    const styles = StyleSheet.create({
        inputStyles: {
            backgroundColor: transparent ? 'rgba(0, 0, 0, 0)' : theme.backgroundColors.main,
            borderRadius: theme.other.borderRadius.btn,
            borderColor: border ? theme.backgroundColors.secondary : 'transparent',
            borderWidth: border ? 1 : 0,
            height: multiline ? ( multiline && height ? height : 100) : 46,
            maxHeight: height ? height : 46,
            paddingLeft: 20,
            paddingTop: multiline ? (noTopPadding ? 11 : 15) : 0,
            marginBottom: marginBottom,
            textAlignVertical: 'top',
            color: theme.colors.main, 
        },
    });

    return (
        <>
            {includeLabel ? (
                <>
                    <Text style={{ marginBottom: 10, fontWeight: '600', color: theme.colors.main }}>{label}</Text>
                    <TextInput
                        multiline={multiline}
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize === false ? 'none' : 'sentences'}
                        style={styles.inputStyles}
                        secureTextEntry={password}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={theme.colors.secondary}
                        value={value}
                    />
                </>
            ) : (
                <TextInput
                    multiline={multiline}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize === false ? 'none' : 'sentences'}
                    style={styles.inputStyles}
                    secureTextEntry={password}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.secondary}
                    value={value}
                />
            )}
        </>
    );
};

export default Input;
