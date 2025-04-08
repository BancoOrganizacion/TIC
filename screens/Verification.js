import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VerificationScreen = ({ route, navigation }) => {
  const { userId, initialCode, telegramLink } = route.params;
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenTelegram = async () => {
    try {
      // Abrir Telegram con el enlace
      const canOpen = await Linking.canOpenURL(telegramLink);
      if (canOpen) {
        await Linking.openURL(telegramLink);
      } else {
        Alert.alert(
          'Telegram no instalado',
          'Por favor instala Telegram para continuar',
          [
            { text: 'OK' },
            { text: 'Instalar', onPress: () => Linking.openURL('market://details?id=org.telegram.messenger') }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir Telegram');
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa un código válido');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.validateVerificationCode(userId, code);
      if (response.data.valid) {
        Alert.alert('Éxito', 'Tu número ha sido verificado');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', 'Código inválido o expirado');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifica tu número</Text>
      
      <Text style={styles.subtitle}>
        Hemos enviado un código a tu Telegram
      </Text>

      <Text style={styles.codeHint}>
        Código generado: {initialCode}
      </Text>

      <TouchableOpacity 
        style={styles.telegramButton}
        onPress={handleOpenTelegram}
      >
        <Ionicons name="paper-plane" size={20} color="white" />
        <Text style={styles.telegramButtonText}>Abrir Telegram</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>o ingresa el código manualmente</Text>

      <TextInput
        style={styles.codeInput}
        placeholder="Código de 6 dígitos"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleVerifyCode}
        disabled={isLoading}
      >
        <Text style={styles.verifyButtonText}>
          {isLoading ? 'Verificando...' : 'Verificar Código'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  codeHint: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#888',
    fontSize: 14,
  },
  telegramButton: {
    flexDirection: 'row',
    backgroundColor: '#0088cc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  telegramButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 15,
    color: '#888',
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#5C2684',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default VerificationScreen;