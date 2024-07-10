import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

const Typography = ({body, headline, size, weight, children, color}) => {
    const theme = useTheme()

    const styles = StyleSheet.create({
        headline: {
            fontSize: size ? size : 32,
            fontFamily: 'Inter-SemiBold',
            color: color ? color : theme.colors.main,
        },
        body: {
            fontSize: size ? size : 16,
            color: color ? color : theme.colors.third,
            fontFamily: 'Inter-Regular',
        }
    })

  return (
    <Text weight={weight} size={size} style={headline ? styles.headline : styles.body}>{children}</Text>
  )
}

export default Typography