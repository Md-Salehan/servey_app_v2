import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Voice from '@react-native-voice/voice';

export default function VoiceTest() {
  const [result, setResult] = useState('');
  const [listening, setListening] = useState(false);

  const attachHandlers = () => {
    Voice.onSpeechStart = () => setListening(true);
    Voice.onSpeechEnd = () => setListening(false);
    Voice.onSpeechResults = e => {
      setResult(e.value?.[0] || '');
    };
    Voice.onSpeechError = e => {
      console.log('Speech error:', e);
      setListening(false);
    };
  };

  const startListening = async () => {
    try {
      setResult('');

      // ✅ Attach handlers JUST BEFORE start
      attachHandlers();

      await Voice.start('en-IN');
    } catch (e) {
      console.log('Start error:', e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.log('Stop error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Voice Test</Text>

      <Text style={styles.status}>
        Status: {listening ? 'Listening…' : 'Idle'}
      </Text>

      <Button title="Start Listening" onPress={startListening} />
      <View style={{ height: 12 }} />
      <Button title="Stop Listening" onPress={stopListening} />

      <Text style={styles.resultLabel}>Result:</Text>
      <Text style={styles.result}>{result || '(no speech yet)'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  status: {
    textAlign: 'center',
    marginBottom: 16,
  },
  resultLabel: {
    marginTop: 24,
    fontWeight: 'bold',
  },
  result: {
    marginTop: 8,
    fontSize: 16,
  },
});
