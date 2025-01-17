import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// Importa las pantallas
import SplashScreen from "./screens/SplashScreen";
import Login from "./screens/Login";
import Home from "./screens/RestrictionsList";
import Register from "./screens/Register";
import Code from "./screens/Code";  
import RestrictionsList from "./screens/RestrictionsList";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Code" component={Code} />
        <Stack.Screen name="RestrictionsList" component={RestrictionsList} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
