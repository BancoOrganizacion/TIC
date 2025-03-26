import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_AUTH = 'http://192.168.0.104:3002'; //CAMBIAR POR TU IP LOCAL
const API_USERS = 'http://192.168.0.104:3001'; // X2

/*//emulador android
const API_AUTH = 'http://10.0.2.2:3002'; 
const API_USERS = 'http://10.0.2.2:3001';*/

// Cliente para interceptar y manejar tokens JWT
const authApi = axios.create({
  baseURL: API_AUTH
});

const usersApi = axios.create({
  baseURL: API_USERS
});

// Interceptor para agregar el token a las peticiones autenticadas
authApi.interceptors.request.use(
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

usersApi.interceptors.request.use(
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
    return authApi.post('/auth/login', { username, password });
  }
};

// Servicios de usuarios
export const userService = {
  getRoles: () => {
    return usersApi.get('/roles');
  },
  createUser: (userData) => {
    return usersApi.post('/usuarios', userData);
  },
  getUserProfile: () => {
    return usersApi.get('/usuarios/perfil');
  }
};