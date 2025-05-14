import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Constante para la URL base del API
const API_GATEWAY = "http://192.168.100.101:3000";
// Alternativa para emulador android:
// const API_GATEWAY = 'http://10.0.2.2:3000';

// Cliente para peticiones que NO requieren autenticación
const apiPublic = axios.create({
  baseURL: API_GATEWAY,
});

// Cliente para peticiones que requieren autenticación
const apiPrivate = axios.create({
  baseURL: API_GATEWAY,
});

// Configuración de interceptor para añadir token a peticiones privadas
apiPrivate.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Using token in request:", token.substring(0, 10) + "...");
      } else {
        console.warn("No token found for request to:", config.url);
      }
      return config;
    } catch (error) {
      console.error("Error getting token:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y renovar tokens
apiPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Comprobar si el error es por token expirado
    if (
      error.response?.status === 401 &&
      (error.response?.data?.message === "Token inválido o expirado" ||
        error.response?.data?.message === "jwt expired")
    ) {
      console.log("Token expirado, intentando renovar sesión...");

      try {
        // Intentar obtener el refreshToken
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        if (refreshToken) {
          // Si hay un refreshToken, intentar renovar el token
          const response = await apiPublic.post("/auth/auth/refresh", {
            refreshToken,
          });

          if (response.data && response.data.token) {
            // Guardar el nuevo token
            await AsyncStorage.setItem("token", response.data.token);
            if (response.data.refreshToken) {
              await AsyncStorage.setItem(
                "refreshToken",
                response.data.refreshToken
              );
            }

            // Repetir la solicitud original con el nuevo token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return apiPrivate(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Error renovando token:", refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Servicio para operaciones relacionadas con cuentas bancarias
export const accountService = {
  // Get user's accounts
  getMyAccounts: async () => {
    try {
      const response = await apiPrivate.get("/accounts/cuentas/mis-cuentas");
      console.log("My accounts response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting accounts:", error);
      throw error;
    }
  },

  // Create a new account
  createAccount: async (accountType) => {
    try {
      const response = await apiPrivate.post("/accounts/cuentas", {
        tipo_cuenta: accountType, // 'CORRIENTE' or 'AHORROS'
      });
      console.log("Create account response:", response.status);
      return response;
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  },

  // Get account by ID
  getAccountById: async (accountId) => {
    try {
      const response = await apiPrivate.get(`/accounts/cuentas/${accountId}`);
      console.log("Account by ID response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting account by ID:", error);
      throw error;
    }
  },

  // Get account by number
  getAccountByNumber: async (accountNumber) => {
    try {
      const response = await apiPrivate.get(
        `/accounts/cuentas/numero/${accountNumber}`
      );
      console.log("Account by number response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting account by number:", error);
      throw error;
    }
  },

  // Cancel an account
  cancelAccount: async (accountId) => {
    try {
      const response = await apiPrivate.delete(
        `/accounts/cuentas/${accountId}`
      );
      console.log("Cancel account response:", response.status);
      return response;
    } catch (error) {
      console.error("Error canceling account:", error);
      throw error;
    }
  },

  // Get account transactions with pagination
  getAccountTransactions: async (accountId, options = { page: 1, limit: 10 }) => {
    try {
      // Agregamos parámetros de consulta para paginación
      const { page, limit } = options;
      const response = await apiPrivate.get(
        `/accounts/cuentas/${accountId}/movimientos`,
        { params: { page, limit } }
      );
      console.log("Account transactions response:", response.status);
      
      // Si no hay datos de paginación en la respuesta, agregar información por defecto
      if (!response.data.pagination) {
        response.data = {
          data: response.data,
          pagination: {
            page,
            limit,
            total: response.data.length || 0,
            pages: Math.ceil((response.data.length || 0) / limit)
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error("Error getting account transactions:", error);
      throw error;
    }
  },

  // Create a new transaction
  createTransaction: async (transaction) => {
    try {
      const response = await apiPrivate.post(
        `/accounts/movimientos`,
        transaction
      );
      console.log("Create transaction response:", response.status);
      
      // Actualizar el saldo de la cuenta después de la transacción
      if (transaction.cuenta_origen) {
        await this.refreshAccountBalance(transaction.cuenta_origen);
      }
      if (transaction.cuenta_destino && transaction.cuenta_destino !== transaction.cuenta_origen) {
        await this.refreshAccountBalance(transaction.cuenta_destino);
      }
      
      return response;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  },
  
  // Refresh account balance after a transaction
  refreshAccountBalance: async (accountId) => {
    try {
      const response = await apiPrivate.get(`/accounts/cuentas/${accountId}`);
      console.log("Account balance refreshed:", response.data.monto_actual);
      
      // Actualizar el caché local
      const accounts = JSON.parse(await AsyncStorage.getItem("userAccounts") || "[]");
      const updatedAccounts = accounts.map(account => {
        if (account._id === accountId) {
          return { ...account, saldo: response.data.monto_actual };
        }
        return account;
      });
      
      await AsyncStorage.setItem("userAccounts", JSON.stringify(updatedAccounts));
      return response;
    } catch (error) {
      console.error("Error refreshing account balance:", error);
      // Silently fail - don't throw the error as this is a background operation
      return null;
    }
  },

  // Add account restriction
  addAccountRestriction: async (accountId, restriction) => {
    try {
      // Validar que el ID de patrón de autenticación sea válido para MongoDB (24 caracteres hexadecimales)
      const isValidMongoId = (id) => {
        return id && /^[0-9a-fA-F]{24}$/.test(id);
      };

      // Asegurar que los montos son números
      const payload = {
        monto_desde: Number(restriction.monto_desde),
        monto_hasta: Number(restriction.monto_hasta),
      };

      // Solo incluir patron_autenticacion si es un ID válido de MongoDB
      if (
        restriction.patron_autenticacion &&
        isValidMongoId(restriction.patron_autenticacion)
      ) {
        payload.patron_autenticacion = restriction.patron_autenticacion;
      }

      console.log("Enviando payload:", JSON.stringify(payload, null, 2));

      const response = await apiPrivate.post(
        `/accounts/cuentas/${accountId}/restricciones`,
        payload
      );

      console.log("Respuesta del servidor:", {
        status: response.status,
        data: response.data,
      });

      return response;
    } catch (error) {
      console.error("Error detallado al añadir restricción:", {
        message: error.message,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data,
        } : "No hay config",
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : "No hay response",
      });
      throw error;
    }
  },

  // Get account restrictions
  getAccountRestrictions: async (accountId) => {
    try {
      const response = await apiPrivate.get(`/accounts/cuentas/${accountId}/restricciones`);
      console.log("Account restrictions response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting account restrictions:", error);
      throw error;
    }
  },

  // Update account restriction
  updateAccountRestriction: async (accountId, restrictionId, updates) => {
    try {
      const payload = {
        monto_desde: Number(updates.monto_desde),
        monto_hasta: Number(updates.monto_hasta),
      };
      
      if (updates.patron_autenticacion) {
        payload.patron_autenticacion = updates.patron_autenticacion;
      }
      
      const response = await apiPrivate.put(
        `/accounts/cuentas/${accountId}/restricciones/${restrictionId}`,
        payload
      );
      console.log("Update restriction response:", response.status);
      return response;
    } catch (error) {
      console.error("Error updating restriction:", error);
      throw error;
    }
  },

  // Remove account restriction
  removeAccountRestriction: async (accountId, restrictionId) => {
    try {
      const response = await apiPrivate.delete(
        `/accounts/cuentas/${accountId}/restricciones/${restrictionId}`
      );
      console.log("Remove restriction response:", response.status);
      return response;
    } catch (error) {
      console.error("Error removing restriction:", error);
      throw error;
    }
  },

  // Método MOCK para huellas
  getFingerprintPatterns: async () => {
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      data: [
        {
          _id: "60d5ecb74e4e8d1b5cbf2456",
          nombre: "Huella Derecha",
          descripcion: "Dedo índice derecho",
          requiere_autenticacion: true,
        },
        {
          _id: "60d5ecb74e4e8d1b5cbf2457",
          nombre: "Huella Izquierda",
          descripcion: "Dedo índice izquierdo",
          requiere_autenticacion: true,
        },
      ],
    };
  },
};

// Servicios de autenticación
export const authService = {
  login: async (username, password) => {
    console.log("Logging in with username:", username);
    try {
      const response = await apiPublic.post("/auth/auth/login", {
        username,
        password,
      });
      console.log("Login response status:", response.status);
      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  getTelegramLink: async () => {
    try {
      console.log("Getting Telegram link");

      const response = await apiPrivate.post("/auth/telegram/link");
      console.log("Telegram link response status:", response.status);

      if (!response.data || !response.data.deepLink) {
        console.error("Unexpected response format:", response.data);
        throw new Error("Respuesta inesperada del servidor");
      }

      let deepLink = response.data.deepLink;
      if (!deepLink.startsWith("https://") && !deepLink.startsWith("tg://")) {
        // Assume it's a bot username and format properly
        deepLink = `https://t.me/${deepLink.replace("@", "")}`;
      }

      return response;
    } catch (error) {
      console.error("Error getting Telegram link:", error);
      throw error;
    }
  },

  generateVerificationCode: async () => {
    try {
      console.log("Sending verification code request");
      const response = await apiPrivate.post("/auth/auth/codigo/generar", {
        tipo: "registro",
      });
      console.log("Verification code response:", response.status);
      return response;
    } catch (error) {
      console.error("Error generating verification code:", error);
      throw error;
    }
  },

  validateVerificationCode: async (data) => {
    try {
      console.log("Validating code with data:", data);
      const validationData = {
        userId: data.userId,
        code: data.code.toString(),
      };
      const response = await apiPublic.post(
        "/auth/auth/codigo/validar",
        validationData
      );
      console.log("Validation response:", response.status, response.data);
      return response;
    } catch (error) {
      console.error("Validation error:", error);
      throw error;
    }
  },

  checkUserTelegramChat: async () => {
    try {
      console.log("Checking if user has Telegram chat linked");
      const response = await apiPrivate.post("auth/telegram/check-chat");
      console.log("Telegram chat check response:", response.data);
      return response;
    } catch (error) {
      console.error("Error checking Telegram chat:", error);
      throw error;
    }
  },
};

// Servicios de usuario
export const userService = {
  createUser: async (userData) => {
    const formattedData = {
      nombre: userData.nombre,
      apellido: userData.apellido,
      cedula: userData.cedula,
      email: userData.email,
      telefono: userData.telefono,
      nombre_usuario: userData.nombreUsuario,
      contraseña: userData.password,
      rol: userData.rol,
    };
    const response = await apiPublic.post("/users/usuarios", formattedData);

    // Guardar el token si viene en la respuesta
    if (response.data.token) {
      await AsyncStorage.setItem("token", response.data.token);
    } else if (response.data.access_token) {
      await AsyncStorage.setItem("token", response.data.access_token);
    }

    return response;
  },

  updateUserRole: async (userId, roleId) => {
    try {
      console.log(`Updating user ${userId} to role ${roleId}`);
      const response = await apiPrivate.put(`/users/usuarios/${userId}/rol`, {
        rolId: roleId,
      });
      console.log("Role update response:", response.status);
      return response;
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    }
  },

  getUserProfile: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await getUserIdFromToken(token);

      if (!userId) throw new Error("ID de usuario no disponible");

      const userResponse = await apiPrivate.get(`/users/usuarios/${userId}`);
      return {
        data: {
          ...userResponse.data,
          // Aseguramos que el nombre de usuario esté disponible
          nombre_usuario: userResponse.data.nombre_usuario || await AsyncStorage.getItem("nombre_usuario"),
        },
      };
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      throw error;
    }
  },

  updateUserProfile: async (userData) => {
    try {
      return apiPrivate.put("/users/usuarios/perfil", userData);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },
};

// Función para decodificar el token y obtener el ID del usuario
const getUserIdFromToken = async (token) => {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    return payload.id_usuario;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
};

// Función auxiliar para codificar/decodificar Base64
const atob = (input) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';

  for (let bc = 0, bs = 0, buffer, i = 0;
      buffer = str.charAt(i++);
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
          bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
      buffer = chars.indexOf(buffer);
  }

  return output;
};