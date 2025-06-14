import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Constante para la URL base del API
const API_GATEWAY = "http://192.168.18.21:3000";
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
        tipo_cuenta: accountType,
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
      console.log(`Solicitando transacciones para cuenta ${accountId}, página ${page}, límite ${limit}`);      const response = await apiPrivate.get(
        `/accounts/cuentas/${accountId}/movimientos`,
        { params: { page, limit } }
      );
      console.log("Account transactions response:", response.status);

      if (response.data && !response.data.pagination) {
        // Si la respuesta es un array directo
        if (Array.isArray(response.data)) {
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
        // Si la respuesta es un objeto pero no tiene paginación
        else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Buscar arrays dentro del objeto que podrían ser las transacciones
          const possibleTransactions = Object.values(response.data).find(value => Array.isArray(value)) || [];
          response.data = {
            data: possibleTransactions,
            pagination: {
              page,
              limit,
              total: possibleTransactions.length || 0,
              pages: Math.ceil((possibleTransactions.length || 0) / limit)
            }
          };
        }
      }

      return response;
    } catch (error) {
      console.error("Error getting account transactions:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
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
        },      ],
    };
  },

  // Método de prueba para el flujo completo de restricciones
  testRestrictionFlow: async (accountId) => {
    try {
      console.log("🧪 Testing restriction creation flow for account:", accountId);
      
      // 1. Obtener restricciones existentes
      console.log("1️⃣ Getting existing restrictions...");
      const existingRestrictions = await accountService.getAccountRestrictions(accountId);
      console.log("✅ Existing restrictions:", existingRestrictions.data?.length || 0);
      
      // 2. Crear una restricción simple sin patrón
      console.log("2️⃣ Creating simple restriction...");
      const simpleRestriction = {
        monto_desde: 0,
        monto_hasta: 50
      };
      
      const simpleRestrictionResponse = await accountService.addAccountRestriction(
        accountId, 
        simpleRestriction
      );
      console.log("✅ Simple restriction created:", simpleRestrictionResponse.data);
      
      // 3. Intentar crear restricción con patrón biométrico
      console.log("3️⃣ Testing biometric restriction...");
      try {
        const patternTest = await biometricService.testPatternCreationFlow();
        
        if (patternTest.success) {
          const biometricRestriction = {
            monto_desde: 100,
            monto_hasta: 1000,
            patron_autenticacion: patternTest.patternId
          };
          
          const biometricRestrictionResponse = await accountService.addAccountRestriction(
            accountId,
            biometricRestriction
          );
          console.log("✅ Biometric restriction created:", biometricRestrictionResponse.data);
        } else {
          console.log("⚠️ Skipping biometric restriction (no fingerprints or pattern creation failed)");
        }
      } catch (biometricError) {
        console.warn("⚠️ Biometric restriction test failed:", biometricError.message);
      }
      
      // 4. Verificar restricciones finales
      console.log("4️⃣ Verifying final restrictions...");
      const finalRestrictions = await accountService.getAccountRestrictions(accountId);
      console.log("✅ Final restrictions count:", finalRestrictions.data?.length || 0);
      
      console.log("🎉 Restriction flow test completed!");
      
      return {
        success: true,
        initialCount: existingRestrictions.data?.length || 0,
        finalCount: finalRestrictions.data?.length || 0
      };
      
    } catch (error) {
      console.error("❌ Restriction flow test failed:", error);
      return {
        success: false,
        error: error.message
      };
    }  },
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

export const biometricService = {
  // ==================== ENDPOINTS DE FINGERPRINTS ====================

  // Registrar una nueva huella (POST /fingerprints/register)
  registerFingerprint: async (fingerprintData) => {
    try {
      console.log("Registering fingerprint:", fingerprintData.dedo);

      // Validar datos requeridos según tu backend
      if (!fingerprintData.dedo || !fingerprintData.huella) {
        throw new Error("Datos de huella incompletos");
      }

      const response = await apiPrivate.post("/fingerprints/register", {
        dedo: fingerprintData.dedo,
        huella: fingerprintData.huella
      });

      console.log("Register fingerprint response:", response.status);
      return response;
    } catch (error) {
      console.error("Error registering fingerprint:", error);
      throw error;
    }
  },

  // Crear patrón usando el endpoint de fingerprints (POST /fingerprints/pattern)
  createFingerprintPattern: async (patternData) => {
    try {
      console.log("Creating fingerprint pattern:", patternData);

      if (!patternData.nombre || !Array.isArray(patternData.dedos) || patternData.dedos.length === 0) {
        throw new Error("Datos del patrón incompletos");
      }

      const response = await apiPrivate.post("/fingerprints/pattern", {
        nombre: patternData.nombre,
        descripcion: patternData.descripcion || "",
        dedos: patternData.dedos
      });

      console.log("Create fingerprint pattern response:", response.status);
      return response;
    } catch (error) {
      console.error("Error creating fingerprint pattern:", error);
      throw error;
    }
  },

  // Obtener huellas por cuenta usando el endpoint correcto (POST /fingerprints/get-fingers)
  getFingersByAccount: async (accountId) => {
    try {
      console.log("Getting fingers by account:", accountId);

      if (!accountId) {
        throw new Error("ID de cuenta requerido");
      }

      const response = await apiPrivate.post("/fingerprints/get-fingers", {
        id_cuenta_app: accountId
      });

      console.log("Get fingers by account response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting fingers by account:", error);
      throw error;
    }
  },  // Obtener todas las huellas del usuario actual
  getMyFingerprints: async () => {
    try {      console.log("Getting user fingerprints");
      // Usar el endpoint que funciona: POST /fingerprints/get-fingers
      const response = await apiPrivate.post("/fingerprints/get-fingers");
      console.log("My fingerprints response:", response.status);

      // Formatear los datos para que coincidan con lo que espera tu UI
      if (response.data && Array.isArray(response.data)) {
        response.data = response.data.map((fingerprint, index) => {
          return {
            _id: fingerprint.dedo_patron_id, // El backend retorna dedo_patron_id
            id: fingerprint.dedo_patron_id, // Para compatibilidad con FingerprintsList
            nombre: biometricService.getFingerTypeName(fingerprint.dedo),
            descripcion: `Huella ${fingerprint.dedo.toLowerCase()}`,
            dedo: fingerprint.dedo,
            fechaRegistro: new Date().toISOString(), // Valor por defecto
            calidad: 95, // Valor por defecto ya que no tienes este campo
            selected: false // Para la UI de selección
          };
        });
      }

      return response;
    } catch (error) {
      console.error("Error getting my fingerprints:", error);
      throw error;
    }
  },// ==================== ENDPOINTS DE PATTERNS ====================  // Crear nuevo patrón de autenticación
  createPattern: async (selectedFingerprintIds) => {
    try {
      console.log("Creating pattern with fingerprint IDs:", selectedFingerprintIds);

      if (!Array.isArray(selectedFingerprintIds) || selectedFingerprintIds.length === 0) {
        throw new Error("Se requiere al menos una huella para crear el patrón");
      }

      // Validar que todos los IDs sean válidos (formato ObjectId de MongoDB)
      const invalidIds = selectedFingerprintIds.filter(id => !id || !/^[0-9a-fA-F]{24}$/.test(id));
      if (invalidIds.length > 0) {
        throw new Error(`IDs de huella inválidos: ${invalidIds.join(', ')}`);
      }

      // Usar el endpoint /patterns con dedosPatronIds según la documentación del backend
      const response = await apiPrivate.post("/patterns", {
        dedosPatronIds: selectedFingerprintIds
      });
      
      console.log("Pattern created successfully:", response.data);
      return response;
    } catch (error) {
      console.error("Error creating pattern:", error);
      
      // Proporcionar mensajes de error más específicos
      if (error.response?.status === 400) {
        throw new Error("Datos inválidos para crear el patrón. Verifica las huellas seleccionadas.");
      } else if (error.response?.status === 401) {
        throw new Error("No autorizado. Por favor, inicia sesión nuevamente.");
      } else if (error.response?.status === 500) {
        throw new Error("Error interno del servidor. Intenta nuevamente más tarde.");
      } else if (error.message && error.message.includes("IDs de huella inválidos")) {
        throw error; // Re-throw validation errors as-is
      } else {
        throw new Error("Error al crear el patrón. Verifica tu conexión a internet.");
      }
    }
  },

  // Obtener patrones del usuario (GET /patterns)
  getPatterns: async () => {
    try {
      console.log("Getting user patterns");
      const response = await apiPrivate.get("/patterns");
      console.log("Patterns response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting patterns:", error);
      throw error;
    }
  },

  // Obtener patrón específico por ID (GET /patterns/:id)
  getPattern: async (patternId) => {
    try {
      console.log("Getting pattern:", patternId);
      const response = await apiPrivate.get(`/patterns/${patternId}`);
      console.log("Pattern response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting pattern:", error);
      throw error;
    }
  },

  // Obtener dedos de un patrón (GET /patterns/:id/dedos)
  getPatternWithFingers: async (patternId) => {
    try {
      console.log("Getting pattern with fingers:", patternId);
      const response = await apiPrivate.get(`/patterns/${patternId}/dedos`);
      console.log("Pattern fingers response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting pattern fingers:", error);
      throw error;
    }
  },
  getPatternDetails: async (patternId) => {
    try {
      console.log("Getting pattern details:", patternId);
      
      // Primero intentar obtener información básica del patrón
      try {
        const patternResponse = await apiPrivate.get(`/patterns/${patternId}`);
        console.log("Pattern basic info:", patternResponse.data);
        
        // Luego intentar obtener los dedos del patrón
        try {
          const fingersResponse = await apiPrivate.get(`/patterns/${patternId}/dedos`);
          console.log("Pattern fingers:", fingersResponse.data);
          
          // Formatear los datos para mostrar en la UI
          const patternDetails = {
            _id: patternId,
            nombre: `Patrón ${patternId.slice(-6)}`,
            descripcion: `Patrón con ${fingersResponse.data?.dedos?.length || 0} huellas`,
            huellas: fingersResponse.data?.dedos?.map((dedo, index) => ({
              _id: dedo.id,
              nombre: dedo.nombre || biometricService.getFingerTypeName(dedo.tipo || 'DESCONOCIDO'),
              descripcion: `Huella ${index + 1}`,
              calidad: dedo.calidad || 95
            })) || [],
            cantidadHuellas: fingersResponse.data?.dedos?.length || 0,
            fechaCreacion: patternResponse.data?.fechaCreacion || new Date().toISOString(),
            activo: patternResponse.data?.activo || true
          };

          return { data: patternDetails };
          
        } catch (fingersError) {
          console.log("Could not get fingers details, using basic pattern info");
          
          // Si no podemos obtener los dedos, usar info básica del patrón
          const patternDetails = {
            _id: patternId,
            nombre: `Patrón ${patternId.slice(-6)}`,
            descripcion: `Patrón con ${patternResponse.data?.dedosPatronIds?.length || 0} huellas`,
            huellas: [],
            cantidadHuellas: patternResponse.data?.dedosPatronIds?.length || 0,
            fechaCreacion: patternResponse.data?.fechaCreacion || new Date().toISOString(),
            activo: patternResponse.data?.activo || true
          };
          
          return { data: patternDetails };
        }
        
      } catch (patternError) {
        console.log("Pattern endpoint not available, creating fallback info");
        
        // Si no podemos obtener información del patrón, crear información básica
        const patternDetails = {
          _id: patternId,
          nombre: `Patrón ${patternId.slice(-6)}`,
          descripcion: `Patrón biométrico`,
          huellas: [],
          cantidadHuellas: 0,
          fechaCreacion: new Date().toISOString(),
          activo: true
        };
        
        return { data: patternDetails };
      }

    } catch (error) {
      console.error("Error getting pattern details:", error);
      throw error;
    }
  },

  // Cambiar estado del patrón (PATCH /patterns/:id/estado)
  updatePatternStatus: async (patternId, active) => {
    try {
      console.log("Updating pattern status:", patternId, active);
      const response = await apiPrivate.patch(`/patterns/${patternId}/estado`, {
        activo: active
      });
      console.log("Update pattern status response:", response.status);
      return response;
    } catch (error) {
      console.error("Error updating pattern status:", error);
      throw error;
    }
  },

  // Validar patrón (GET /patterns/:id/validar)
  validatePattern: async (patternId) => {
    try {
      console.log("Validating pattern:", patternId);
      const response = await apiPrivate.get(`/patterns/${patternId}/validar`);
      console.log("Validate pattern response:", response.status);
      return response;
    } catch (error) {
      console.error("Error validating pattern:", error);
      throw error;
    }
  },
  // Obtener información para autenticación 
  getPatternAuthInfo: async (patternId) => {
    try {
      console.log("Getting pattern auth info:", patternId);
      const response = await apiPrivate.get(`/patterns/${patternId}/autenticacion`);
      console.log("Pattern auth info response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting pattern auth info:", error);
      throw error;
    }
  },

  // Crear patrón a partir de huellas seleccionadas
  createPatternFromFingerprints: async (selectedFingerprints) => {
    try {
      // Extraer solo los IDs de las huellas seleccionadas
      const fingerprintIds = selectedFingerprints.map(fp => fp._id || fp.id);

      console.log("Creating pattern from selected fingerprints:", fingerprintIds);

      return await biometricService.createPattern(fingerprintIds);
    } catch (error) {
      console.error("Error creating pattern from fingerprints:", error);
      throw error;
    }
  },

  // Eliminar patrón (DELETE /patterns/:id) 
  deletePattern: async (patternId) => {
    try {
      console.log("Deleting pattern:", patternId);
      const response = await apiPrivate.delete(`/patterns/${patternId}`);
      console.log("Delete pattern response:", response.status);
      return response;
    } catch (error) {
      console.error("Error deleting pattern:", error);
      throw error;
    }
  },

  // Eliminar huella (DELETE /fingerprints/:id) 
  deleteFingerprint: async (fingerprintId) => {
    try {
      console.log("Deleting fingerprint:", fingerprintId);
      const response = await apiPrivate.delete(`/fingerprints/${fingerprintId}`);
      console.log("Delete fingerprint response:", response.status);
      return response;
    } catch (error) {
      console.error("Error deleting fingerprint:", error);
      throw error;
    }
  },

  // Mapear tipos de dedos para mostrar en UI
  getFingerTypeName: (fingerType) => {
    const mapping = {
      'PULGAR_DERECHO': 'Pulgar derecho',
      'INDICE_DERECHO': 'Índice derecho',
      'MEDIO_DERECHO': 'Medio derecho',
      'ANULAR_DERECHO': 'Anular derecho',
      'MENIQUE_DERECHO': 'Meñique derecho',
      'PULGAR_IZQUIERDO': 'Pulgar izquierdo',
      'INDICE_IZQUIERDO': 'Índice izquierdo',
      'MEDIO_IZQUIERDO': 'Medio izquierdo',
      'ANULAR_IZQUIERDO': 'Anular izquierdo',
      'MENIQUE_IZQUIERDO': 'Meñique izquierdo'
    };
    return mapping[fingerType] || fingerType;
  },
  // Obtener tipos de dedos disponibles
  getAvailableFingerTypes: () => {
    return [
      'PULGAR_DERECHO', 'INDICE_DERECHO', 'MEDIO_DERECHO', 'ANULAR_DERECHO', 'MENIQUE_DERECHO',
      'PULGAR_IZQUIERDO', 'INDICE_IZQUIERDO', 'MEDIO_IZQUIERDO', 'ANULAR_IZQUIERDO', 'MENIQUE_IZQUIERDO'
    ];
  },  // Método de debugging para verificar la conexión completa
  testPatternCreationFlow: async () => {
    try {
      console.log("Testing pattern creation flow...");
      
      // 1. Obtener huellas del usuario
      console.log("Getting user fingerprints...");
      const fingerprintsResponse = await biometricService.getMyFingerprints();
      console.log("Fingerprints obtained:", fingerprintsResponse.data?.length || 0);
      
      if (!fingerprintsResponse.data || fingerprintsResponse.data.length === 0) {
        throw new Error("No fingerprints found for user. Please register fingerprints first.");
      }      // Debug detallado de las huellas
      console.log("Detailed fingerprint analysis:");
      fingerprintsResponse.data.forEach((fp, index) => {
        console.log(`Fingerprint ${index + 1}: ${fp.nombre} (${fp.dedo}) - Valid ID: ${!!(fp._id && /^[0-9a-fA-F]{24}$/.test(fp._id))}`);
      });

      // Filtrar solo huellas con IDs válidos
      const validFingerprints = fingerprintsResponse.data.filter(fp => 
        fp._id && /^[0-9a-fA-F]{24}$/.test(fp._id)
      );

      console.log(`Valid fingerprints: ${validFingerprints.length}/${fingerprintsResponse.data.length}`);

      if (validFingerprints.length === 0) {
        throw new Error("No valid fingerprint IDs found. All fingerprints lack proper MongoDB ObjectId format.");
      }
      
      // 2. Crear patrón con las huellas válidas disponibles
      console.log("Creating pattern...");
      const fingerprintIds = validFingerprints.slice(0, Math.min(5, validFingerprints.length)).map(fp => fp._id);
      console.log("Using fingerprint IDs:", fingerprintIds);
      
      const patternResponse = await biometricService.createPattern(fingerprintIds);
      console.log("Pattern created:", patternResponse.data);
      
      const patternId = patternResponse.data?.id || patternResponse.data?._id || patternResponse.data?.patternId;
      if (!patternId) {
        throw new Error("Pattern ID not found in response");
      }
      
      // 3. Verificar que el patrón se creó correctamente
      console.log("Verifying pattern...");
      const patternDetails = await biometricService.getPatternDetails(patternId);
      console.log("Pattern verified:", patternDetails.data);
      
      // 4. Obtener todos los patrones del usuario
      console.log("Getting all user patterns...");
      const allPatterns = await biometricService.getPatterns();
      console.log("All patterns:", allPatterns.data?.length || 0);
      
      console.log("Pattern creation flow test completed successfully!");
      
      return {
        success: true,
        fingerprintsCount: fingerprintsResponse.data.length,
        validFingerprintsCount: validFingerprints.length,
        patternId: patternId,
        patternsCount: allPatterns.data?.length || 0
      };
      
    } catch (error) {
      console.error("Pattern creation flow test failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Nueva función para diagnosticar problemas con IDs de huellas
  diagnoseFingerprintIds: async () => {
    try {
      console.log("Diagnosing fingerprint ID issues...");
      
      const response = await biometricService.getMyFingerprints();
      
      if (!response.data || !Array.isArray(response.data)) {
        return {
          error: "No fingerprints data received from server",
          details: response
        };
      }

      const diagnosis = {
        totalFingerprints: response.data.length,
        withValidIds: 0,
        withInvalidIds: 0,
        withoutIds: 0,
        fingerprints: []
      };

      response.data.forEach((fp, index) => {
        const analysis = {
          index: index + 1,
          nombre: fp.nombre,
          dedo: fp.dedo,
          _id: fp._id,
          hasId: !!fp._id,
          idLength: fp._id ? fp._id.length : 0,
          isValidObjectId: !!(fp._id && /^[0-9a-fA-F]{24}$/.test(fp._id)),
          issues: []
        };

        if (!fp._id) {
          analysis.issues.push("Missing _id field");
          diagnosis.withoutIds++;
        } else if (!/^[0-9a-fA-F]{24}$/.test(fp._id)) {
          analysis.issues.push("Invalid ObjectId format");
          diagnosis.withInvalidIds++;
        } else {
          diagnosis.withValidIds++;
        }

        diagnosis.fingerprints.push(analysis);
      });

      console.log("Diagnosis Results:", diagnosis);
      return diagnosis;

    } catch (error) {
      console.error("Error diagnosing fingerprint IDs:", error);
      return {
        error: error.message,
        success: false
      };
    }
  },
};

// Actualizar el método getFingerprintPatterns para mantener compatibilidad con tu código existente
export const getFingerprintPatterns = async () => {
  try {
    console.log("Getting fingerprint patterns (compatibility method)");
    const response = await biometricService.getPatterns();

    // Transformar los datos al formato que espera tu código existente
    return {
      data: response.data.map(pattern => ({
        _id: pattern.id || pattern._id,
        nombre: `Patrón ${(pattern.id || pattern._id || '').slice(-6) || 'N/A'}`,
        descripcion: `Patrón con ${pattern.dedosPatronIds?.length || 0} huellas`,
        requiere_autenticacion: pattern.activo !== false,
        dedosPatronIds: pattern.dedosPatronIds,
        fechaCreacion: pattern.fechaCreacion,
        fechaActualizacion: pattern.fechaActualizacion,
        idCuentaApp: pattern.idCuentaApp,
        activo: pattern.activo
      }))
    };  } catch (error) {
    console.error("Error getting fingerprint patterns:", error);
    throw error;
  }
};