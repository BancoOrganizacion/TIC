import React from "react";
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity } from "react-native";

/**
 * Componente FormField reutilizable para campos de formulario
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.value - Valor actual del campo
 * @param {Function} props.onChangeText - Función para manejar cambios en el texto
 * @param {string} props.placeholder - Texto de placeholder
 * @param {string} props.errorMessage - Mensaje de error (si existe)
 * @param {boolean} props.isPassword - Indica si es un campo de contraseña
 * @param {boolean} props.isPasswordVisible - Indica si la contraseña está visible (solo para campos de contraseña)
 * @param {Function} props.togglePasswordVisibility - Función para alternar visibilidad de contraseña
 * @param {string} props.keyboardType - Tipo de teclado (por defecto 'default')
 * @param {boolean} props.autoCapitalize - Comportamiento de capitalización (por defecto 'sentences')
 * @param {number} props.maxLength - Longitud máxima de caracteres permitidos
 * @param {Object} props.style - Estilos adicionales para el campo
 */
const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  errorMessage,
  isPassword = false,
  isPasswordVisible = false,
  togglePasswordVisibility,
  keyboardType = "default",
  autoCapitalize = "sentences",
  maxLength,
  style
}) => {
  const hasError = !!errorMessage;
  
  // Función para renderizar el icono de ojo para contraseñas
  const renderPasswordIcon = () => {
    if (!isPassword) return null;
    
    return (
      <TouchableOpacity
        onPress={togglePasswordVisibility}
        style={styles.eyeIconContainer}
      >
        <Image
          source={
            isPasswordVisible
              ? require("../assets/images/eye-visible.png")
              : require("../assets/images/eye-hidden.png")
          }
          style={styles.eyeIcon}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer, 
        hasError ? styles.errorInput : null
      ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          style={styles.input}
          secureTextEntry={isPassword && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
        {renderPasswordIcon()}
      </View>
      
      {hasError && (
        <View style={styles.errorContainer}>
          <Image
            source={require("../assets/images/error.png")}
            style={styles.errorIcon}
          />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  label: {
    color: "#424242",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#000000",
  },
  eyeIconContainer: {
    padding: 12,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    tintColor: "#737373",
  },
  errorInput: {
    borderColor: "#D32F2F", // Color rojo para campos con error
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  errorIcon: {
    width: 16,
    height: 16,
    tintColor: "#D32F2F",
    marginRight: 8,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default FormField;