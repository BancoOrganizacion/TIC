import React from "react";
import { SafeAreaView, View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import Greeting from "./Greeting";
import Header from "./Header";
import BottomNavBar from "./BottomNavBar";

/**
 * Layout estandarizado para todas las pantallas
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido de la pantalla
 * @param {string} props.title - Título para el Header (opcional)
 * @param {boolean} props.showBack - Mostrar botón de regreso (default: true)
 * @param {Function} props.onBackPress - Función para el botón de regreso
 * @param {boolean} props.showGreeting - Mostrar componente Greeting (default: true)
 * @param {boolean} props.showHeader - Mostrar componente Header (default: true)
 * @param {boolean} props.showNavBar - Mostrar BottomNavBar (default: true)
 * @param {React.ReactNode} props.headerRight - Contenido personalizado para mostrar en el lado derecho del header
 * @param {Object} props.contentContainerStyle - Estilos adicionales para el contenedor de contenido del ScrollView
 * @param {Object} props.contentStyle - Estilos adicionales para el contenedor principal
 * @param {boolean} props.scrollable - Hacer el contenido scrollable (default: true)
 * @param {boolean} props.avoidKeyboard - Evitar teclado (default: true en iOS)
 * @param {Object} props.headerStyle - Estilos adicionales para el Header
 * @param {Object} props.greetingStyle - Estilos adicionales para el Greeting
 */
const AppLayout = ({
  children,
  title,
  showBack = true,
  onBackPress,
  showGreeting = true,
  showHeader = true,
  showNavBar = true,
  headerRight,
  contentContainerStyle,
  contentStyle,
  scrollable = true,
  avoidKeyboard = Platform.OS === "ios",
  headerStyle,
  greetingStyle
}) => {
  const Content = scrollable ? ScrollView : View;
  
  const mainContentStyles = [
    styles.content,
    !scrollable && styles.staticContent,
    showNavBar && styles.contentWithNavBar,
    contentStyle,
  ];

  // Si es scrollable, estos estilos van en contentContainerStyle
  // Si no es scrollable, estos estilos van directo al componente View
  const scrollViewContentContainerStyle = scrollable 
    ? [styles.scrollContent, contentContainerStyle]
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={avoidKeyboard ? "padding" : undefined}
        style={styles.keyboardView}
      >
        {showGreeting && <Greeting style={greetingStyle} />}
        
        {showHeader && title && (
          <Header
            title={title}
            showBack={showBack}
            onBackPress={onBackPress}
            headerRight={headerRight}
            style={headerStyle}
          />
        )}

        {scrollable ? (
          <Content 
            style={mainContentStyles}
            contentContainerStyle={scrollViewContentContainerStyle}
          >
            {children}
          </Content>
        ) : (
          <View style={[mainContentStyles, contentContainerStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
      
      {showNavBar && <BottomNavBar />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  staticContent: {
    paddingBottom: 20,
  },
  scrollContent: {
    paddingBottom: 100, 
  },
  contentWithNavBar: {
    marginBottom: 60, 
  },
});

export default AppLayout;