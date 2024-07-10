import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

const Divider = ({ includeOr, top, bottom }) => {
  const theme = useTheme()

  return (
    <View style={[styles.container, { marginTop: top ? top : 20, marginBottom: bottom ? bottom : 20 }]}>
      <View style={[styles.line, { backgroundColor: theme.other.border }]} />
      {includeOr && <Text style={[styles.text, { color: theme.other.border }]}>or</Text>}
      <View style={[styles.line, { backgroundColor: theme.other.border }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    marginHorizontal: 10,
  },
})

export default Divider
