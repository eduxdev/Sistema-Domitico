import { z } from 'zod'

// Schema de validación para login
export const loginSchema = z.object({
  correo: z.string()
    .min(1, 'El correo es requerido')
    .email('Por favor ingresa un correo electrónico válido')
    .transform(val => val.toLowerCase().trim()),
  password: z.string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})

// Función para transformar datos del frontend al formato del servidor
export const transformLoginToServerFormat = (frontendData: LoginFormData) => {
  return {
    correo: frontendData.correo,
    password: frontendData.password
  }
}

// Tipos inferidos de los schemas
export type LoginFormData = z.infer<typeof loginSchema>


