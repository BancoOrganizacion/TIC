import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*const API_AUTH = 'http://192.168.0.102:3002'; //CAMBIAR POR TU IP LOCAL
const API_USERS = 'http://192.168.0.102:3001'; // X2*/
const API_GATEWAY = 'http://192.168.0.102:3000';
//emulador android
/*const API_AUTH = 'http://10.0.2.2:3002'; 
const API_USERS = 'http://10.0.2.2:3001';*/
//const API_GATEWAY = 'http://10.0.2.2:3000';

// Cliente para manejar todas las peticiones
const api = axios.create({
  baseURL: API_GATEWAY
});


// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error al obtener token:', error);
    }
    return config;
  },
  error => Promise.reject(error)
);

// Servicios de autenticación
export const authService = {
  login: (username, password) => {
    return api.post('/auth/auth/login', { username, password });
  }
};

// Servicios de usuarios
export const userService = {
  getRoles: () => {
    return api.get('/users/roles');
  },
  createUser: (userData) => {
    return api.post('/users/usuarios', userData);
  },
  updateUserProfile: (userData) => {
    const userId = userData.id || ''; // O guarda el ID del usuario en AsyncStorage
    return api.put(`/users/usuarios/${userId}`, userData);
  },
  getUserProfile: async () => {
    try {
      // Obtener el ID del usuario del token JWT decodificado
      const token = await AsyncStorage.getItem('token');
      const userId = await getUserIdFromToken(token);
      
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }
      
      const response = await api.get(`/users/usuarios/${userId}`);
      return response;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  }
};

// Función para decodificar el token y obtener el ID del usuario
const getUserIdFromToken = async (token) => {
  if (!token) return null;
  
  try {
    // Decodificar el token JWT (puedes usar bibliotecas como jwt-decode)
    // Por simplicidad, acá estoy extrayendo el payload manualmente
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    return payload.id_usuario; // Este es el campo que guarda el API Gateway en el token
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
};