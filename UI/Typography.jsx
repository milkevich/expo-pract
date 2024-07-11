import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

const Typography = ({body, headline, size, weight, children, color, width, textAlign}) => {
    const theme = useTheme()

    const styles = StyleSheet.create({
        headline: {
            fontSize: size ? size : 32,
            fontFamily: weight ? `Inter-${weight}` : 'Inter-SemiBold',
            color: color ? color : theme.colors.main,
            width: width,
            fontWeight: weight,
            textAlign: textAlign,
        },
        body: {
            fontSize: size ? size : 16,
            color: color ? color : theme.colors.third,
            fontFamily: weight ? `Inter-${weight}` : 'Inter-Regular',
            width: width,
            fontWeight: weight,
            textAlign: textAlign,
        }
    })

  return (
    <Text style={headline ? styles.headline : styles.body}>{children}</Text>
  )
}

export default Typography