import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const Typography = ({
  body,
  headline,
  size,
  weight,
  children,
  color,
  width,
  textAlign,
  overflow,
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    headline: {
      fontSize: size || 32,
      fontFamily: weight ? `Inter-${weight}` : 'Inter-SemiBold',
      color: color || theme.colors.main,
      maxWidth: width,
      fontWeight: weight,
      textAlign: textAlign,
      overflow: 'hidden', 
    },
    body: {
      fontSize: size || 16,
      color: color || theme.colors.third,
      fontFamily: weight ? `Inter-${weight}` : 'Inter-Regular',
      maxWidth: width,
      fontWeight: weight,
      textAlign: textAlign,
      overflow: 'hidden', // This doesn't directly affect the Text component in RN
    },
  });

  return (
    <Text
      style={headline ? styles.headline : styles.body}
      numberOfLines={overflow ? 1 : undefined}
      ellipsizeMode={overflow ? 'tail' : undefined}
    >
      {children}
    </Text>
  );
};

export default Typography;
