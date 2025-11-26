import { z } from 'zod'

// Esquema de validación para el formulario de registro
export const registerSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/, 'El nombre solo puede contener letras')
    .trim(),
  
  apellidos: z
    .string()
    .min(1, 'Los apellidos son requeridos')
    .max(100, 'Los apellidos no pueden exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/, 'Los apellidos solo pueden contener letras')
    .trim(),
  
  correo: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Debe ser un correo electrónico válido')
    .max(100, 'El correo no puede exceder 100 caracteres')
    .toLowerCase()
    .trim(),
  
  telefono: z
    .string()
    .length(10, 'El teléfono debe tener exactamente 10 dígitos')
    .regex(/^[0-9]{10}$/, 'El teléfono solo debe contener números (ej: 7123456789)')
    .optional()
    .or(z.literal('')),
  
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// Esquema para validación en el servidor (sin confirmPassword)
export const serverRegisterSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Debe ser un correo electrónico válido')
    .max(100, 'El correo no puede exceder 100 caracteres')
    .toLowerCase()
    .trim(),
  
  fullName: z
    .string()
    .min(1, 'El nombre completo es requerido')
    .max(150, 'El nombre completo no puede exceder 150 caracteres')
    .trim(),
  
  phoneNumber: z
    .string()
    .length(10, 'El teléfono debe tener exactamente 10 dígitos')
    .regex(/^[0-9]{10}$/, 'El teléfono solo debe contener números')
    .optional()
    .nullable(),
  
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
})

// Tipo TypeScript inferido del esquema
export type RegisterFormData = z.infer<typeof registerSchema>
export type ServerRegisterData = z.infer<typeof serverRegisterSchema>

// Función helper para validar campos individuales
export const validateField = (fieldName: keyof RegisterFormData, value: string | number) => {
  try {
    // Para confirmPassword, solo validar que no esté vacío si se requiere
    if (fieldName === 'confirmPassword') {
      if (value === '') {
        return { success: false, error: 'Confirma tu contraseña' }
      }
      return { success: true, error: null }
    }
    
    // Validar solo el campo específico
    if (fieldName === 'nombre') {
      z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede exceder 50 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/, 'El nombre solo puede contener letras').parse(value)
    } else if (fieldName === 'apellidos') {
      z.string().min(1, 'Los apellidos son requeridos').max(100, 'Los apellidos no pueden exceder 100 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/, 'Los apellidos solo pueden contener letras').parse(value)
    } else if (fieldName === 'correo') {
      z.string().min(1, 'El correo es requerido').email('Debe ser un correo electrónico válido').max(100, 'El correo no puede exceder 100 caracteres').parse(value)
    } else if (fieldName === 'telefono') {
      if (value && value !== '') {
        z.string().length(10, 'El teléfono debe tener exactamente 10 dígitos').regex(/^[0-9]{10}$/, 'El teléfono solo debe contener números (ej: 7123456789)').parse(value)
      }
    } else if (fieldName === 'password') {
      z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100, 'La contraseña no puede exceder 100 caracteres').parse(value)
    }
    
    return { success: true, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Error de validación' }
    }
    return { success: false, error: 'Error de validación' }
  }
}

// Función para validar todo el formulario (frontend)
export const validateRegisterForm = (data: Record<string, unknown>) => {
  try {
    const result = registerSchema.parse(data)
    return { success: true, data: result, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      error.issues.forEach((err: z.ZodIssue) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      return { success: false, data: null, errors: fieldErrors }
    }
    return { success: false, data: null, errors: { general: 'Error de validación' } }
  }
}

// Función para validar datos en el servidor (sin confirmPassword)
export const validateServerRegisterForm = (data: Record<string, unknown>) => {
  try {
    const result = serverRegisterSchema.parse(data)
    return { success: true, data: result, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      error.issues.forEach((err: z.ZodIssue) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      return { success: false, data: null, errors: fieldErrors }
    }
    return { success: false, data: null, errors: { general: 'Error de validación' } }
  }
}

// Función para transformar datos del frontend al formato del servidor
export const transformToServerFormat = (frontendData: RegisterFormData) => {
  return {
    email: frontendData.correo,
    fullName: `${frontendData.nombre} ${frontendData.apellidos}`.trim(),
    phoneNumber: frontendData.telefono || null,
    password: frontendData.password
  }
}
