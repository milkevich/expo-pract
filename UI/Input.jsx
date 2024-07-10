import React from 'react'
import { StyleSheet, TextInput, Text } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

const Input = ({ value, placeholder, onChangeText, password, includeLabel, label, keyboardType, transparent, autoCapitalize }) => {

    const theme = useTheme()

    const styles = StyleSheet.create({
        inputStyles: {
            backgroundColor: transparent ? 'rgba(0, 0, 0, 0)' : theme.backgroundColors.main,
            borderRadius: theme.other.borderRadius.btn,
            borderColor: theme.backgroundColors.secondary,
            borderWidth: '1px solid',
            height: 46,
            paddingLeft: 20,
            marginBottom: 10,
        },
    })

    return (
        <>
            {includeLabel ? 
            <>
            <Text style={{marginBottom: 10, fontWeight: 600, color: theme.colors.main}}>{label}</Text>
            <TextInput keyboardType={keyboardType} autoCapitalize={autoCapitalize === false ? 'none' : 'sentences'} style={styles.inputStyles} secureTextEntry={password} onChangeText={onChangeText} placeholder={placeholder} value={value} />
            </>
            : 
            <TextInput keyboardType={keyboardType} autoCapitalize={autoCapitalize === false ? 'none' : 'sentences'} style={styles.inputStyles} secureTextEntry={password} onChangeText={onChangeText} placeholder={placeholder} value={value} />
            }
        </>
    )
}

export default Input