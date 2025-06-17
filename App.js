import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { navigationRef } from "./services/NavigationService";

// Importa las pantallas
import SplashScreen from "./screens/SplashScreen";
import Login from "./screens/Login";
import Home from "./screens/Home";
import Register from "./screens/Register";
import Code from "./screens/Verification";
import CreateRestriction from "./screens/CreateRestriction";
import RestrictionsList from "./screens/RestrictionsList";
import EditRestriction from "./screens/EditRestriction";
import ProfileScreen from "./screens/ProfileScreen";
import AccountSelector from "./screens/AccountSelector";
import TransactionHistory from "./screens/TransactionHistory";
import UserProfile from "./screens/UserProfile";
import EditProfile from "./screens/EditProfile";
import FingerprintsList from "./screens/FingerprintsList";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>      
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Verification" component={Code} />
        <Stack.Screen name="RestrictionsList" component={RestrictionsList} />
        <Stack.Screen name="CreateRestriction" component={CreateRestriction} />
        <Stack.Screen name="EditRestriction" component={EditRestriction} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="AccountSelector" component={AccountSelector} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistory} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="FingerprintsList" component={FingerprintsList} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}