import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// Importa las pantallas
import SplashScreen from "./screens/SplashScreen";
import Login from "./screens/Login";
import Home from "./screens/Home";
import Register from "./screens/Register";
import Code from "./screens/Code";  
import CreateRestriction from "./screens/CreateRestriction";
import RestrictionsList from "./screens/RestrictionsList";
import EditRestriction from "./screens/EditRestriction";
import ProfileScreen from "./screens/ProfileScreen";
import TransactionHistory from "./screens/TransactionHistory";
import UserProfile from "./screens/UserProfile";
import EditProfile from "./screens/EditProfile";


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
        <Stack.Screen name="CreateRestriction" component={CreateRestriction} />
        <Stack.Screen name="EditRestriction" component={EditRestriction} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistory} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
