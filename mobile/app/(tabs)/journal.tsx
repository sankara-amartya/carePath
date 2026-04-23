import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

export default function JournalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Journal Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.textOnDark,
    fontFamily: 'DMSans_500Medium',
  }
});
