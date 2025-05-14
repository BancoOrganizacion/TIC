import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BackButton from "./BackButton";

/**
 * Componente Header - Encabezado con título centrado y botón de retroceso opcional
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título a mostrar en el encabezado
 * @param {Function} props.onBackPress - Función a ejecutar al presionar el botón de retroceso
 * @param {boolean} props.showBack - Indica si mostrar el botón de retroceso (default: true)
 * @param {React.ReactNode} props.headerRight - Contenido personalizado para mostrar en el lado derecho del header
 * @param {Object} props.style - Estilos adicionales para el encabezado
 * @param {Object} props.titleStyle - Estilos adicionales para el título
 */
const Header = ({ 
  title, 
  onBackPress, 
  showBack = true,
  headerRight,
  style,
  titleStyle 
}) => {
  return (
    <View style={[styles.container, style]}>
      {showBack ? (
        <View style={styles.backButtonContainer}>
          <BackButton onPress={onBackPress} />
        </View>
      ) : (
        <View style={styles.placeholderLeft} />
      )}
      
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      
      {/* Contenido personalizado a la derecha o espacio vacío */}
      {headerRight ? (
        <View style={styles.rightContainer}>
          {headerRight}
        </View>
      ) : (
        <View style={styles.placeholderRight} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  backButtonContainer: {
    width: 50,
    alignItems: "flex-start",
  },
  placeholderLeft: {
    width: 50,
  },
  placeholderRight: {
    width: 50,
  },
  rightContainer: {
    width: 50,
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    color: "#1C1B1F",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Header;