import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

const Button = ({ children, highlight, onPress, color, transparent, width, height }) => {

    const theme = useTheme()

    const styles = StyleSheet.create({
        buttonBg: {
            backgroundColor: color ? color : theme.backgroundColors.main,
            borderRadius: theme.other.borderRadius.btn,
            borderColor: theme.backgroundColors.main,
            borderWidth: '1px solid',
            height: height ? height : 46,
            justifyContent: 'center',
            alignItems: 'center',
            width: width && width,
        },
        buttonText: {
            color: theme.colors.main,
            fontWeight: 600,
            fontFamily: 'Inter-SemiBold',
        }
    })  

    const stylesH = StyleSheet.create({
        buttonBg: {
            backgroundColor: theme.backgroundColors.highlight,
            borderRadius: theme.other.borderRadius.btn,
            borderColor: theme.backgroundColors.highlight,
            borderWidth: '1px solid',
            height: height ? height : 46,
            justifyContent: 'center',
            alignItems: 'center',
            width: width && width,
        },
        buttonText: {
            color: theme.colors.main2,
            fontWeight: 600,
            fontFamily: 'Inter-SemiBold',
        }
    })  

  return (
    <TouchableOpacity onPress={onPress} style={highlight ? stylesH.buttonBg : styles.buttonBg}>
        <Text style={highlight ? stylesH.buttonText : styles.buttonText}>{children}</Text>
    </TouchableOpacity>
  )
}

export default Button