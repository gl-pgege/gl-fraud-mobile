import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import BackspaceButton from './BackspaceButton';
import MakeCallButton from '../../components/Call/MakeCallButton';
import ToggleClientInputButton from './ToggleClientInputButton';
import Dialpad from '../../components/Dialpad';
import OutgoingRemoteParticipant from './OutgoingRemoteParticipant';
import useDialer from './hooks';

const Dialer: React.FC = () => {
  const { dialpad, makeCall, outgoing, recipientToggle } = useDialer();
  const [names, setNames] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialpad, setShowDialpad] = useState(false);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await fetch(
          'https://adapted-calm-crow.ngrok-free.app/voice-data',
        );
        const data = await response.json();
        setNames(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch names.');
      } finally {
        setLoading(false);
      }
    };

    fetchNames();
  }, []);

  const handleSelectName = async (voiceId: string) => {
    try {
      const response = await fetch(
        'https://adapted-calm-crow.ngrok-free.app/set-voice',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId }),
        },
      );

      if (response.ok) {
        setShowDialpad(true);
      } else {
        Alert.alert('Error', 'Failed to set voice.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set voice.');
    }
  };

  if (!showDialpad) {
    return (
      <View style={styles.container} testID="nameList">
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FlatList
            data={names}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => handleSelectName(item.id)}>
                <Text style={styles.listText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  const backspaceButton = dialpad.backspace.isDisabled ? (
    <View style={styles.emptyButton} />
  ) : (
    <BackspaceButton onPress={dialpad.backspace.handle} />
  );

  return (
    <View style={styles.container} testID="dialer">
      <View style={styles.remoteParticipant}>
        <OutgoingRemoteParticipant
          outgoingIdentity={outgoing.client.value}
          outgoingNumber={outgoing.number.value}
          recipientType={recipientToggle.type}
          setOutgoingIdentity={outgoing.client.setValue}
        />
      </View>
      <View style={styles.dialpad}>
        <Dialpad
          disabled={dialpad.input.isDisabled}
          onPress={dialpad.input.handle}
        />
      </View>
      <View style={styles.buttons}>
        <ToggleClientInputButton
          disabled={recipientToggle.isDisabled}
          onPress={recipientToggle.handle}
          recipientType={recipientToggle.type}
        />
        <MakeCallButton
          disabled={makeCall.isDisabled}
          onPress={makeCall.handle}
        />
        {backspaceButton}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  listText: {
    fontSize: 16,
  },
  remoteParticipant: {
    padding: 16,
    height: '25%',
    flexDirection: 'column-reverse',
  },
  dialpad: {
    height: '55%',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    height: '20%',
  },
  emptyButton: {
    width: 96,
  },
});

export default Dialer;
