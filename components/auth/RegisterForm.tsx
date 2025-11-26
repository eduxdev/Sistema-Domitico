'use client'

import { useState, useMemo } from 'react'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { validateRegisterForm, validateField, transformToServerFormat, type RegisterFormData } from '@/lib/validations/register'

interface RegisterFormProps extends React.ComponentProps<"form"> {
  onToggleForm?: () => void
}

export function RegisterForm({
  className,
  onToggleForm,
  ...props
}: RegisterFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [lastErrorTime, setLastErrorTime] = useState<Record<string, number>>({})

  // Calcular fortaleza de la contraseña
  const passwordStrength = useMemo(() => {
    const password = formData.password
    if (!password) return { strength: 0, label: '', color: '' }

    let strength = 0
    const checks = {
      length: password.length >= 6,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    // Calcular puntuación
    if (checks.length) strength += 20
    if (password.length >= 8) strength += 10
    if (checks.hasLower) strength += 20
    if (checks.hasUpper) strength += 20
    if (checks.hasNumber) strength += 15
    if (checks.hasSpecial) strength += 15

    // Determinar etiqueta y color
    let label = ''
    let color = ''
    
    if (strength < 40) {
      label = 'Débil'
      color = 'bg-gray-100'
    } else if (strength < 60) {
      label = 'Media'
      color = 'bg-y'
    } else {
      label = 'Fuerte'
      color = 'bg-gray-250'
    }

    return { strength, label, color }
  }, [formData.password])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Para el campo teléfono, solo permitir números
    let processedValue = value
    if (name === 'telefono') {
      processedValue = value.replace(/\D/g, '') // Remover todo lo que no sea dígito
    }
    
    // Actualizar datos del formulario
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))

    // Validar campo individual en tiempo real (excepto contraseñas)
    if (value.trim() !== '' && name !== 'password' && name !== 'confirmPassword') {
      // Para correo, validar completamente con Zod
      // (ya no esperamos solo el "@")
      
      const validation = validateField(name as keyof RegisterFormData, value)
      
      if (!validation.success) {
        // Marcar campo con error (borde rojo)
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'error'
        }))
        
        // Mostrar toast con el error inmediatamente (con debounce)
        const now = Date.now()
        const lastError = lastErrorTime[name] || 0
        
        // Solo mostrar toast si han pasado al menos 2 segundos desde el último error en este campo
        if (now - lastError > 2000) {
          const fieldNames: Record<string, string> = {
            nombre: 'Nombre',
            apellidos: 'Apellidos',
            correo: 'Correo Electrónico',
            telefono: 'Teléfono',
            password: 'Contraseña',
            confirmPassword: 'Confirmar Contraseña'
          }
          
          toast.error(`Error en ${fieldNames[name] || name}`, {
            description: validation.error || 'Campo inválido',
            duration: 3000,
          })
          
          setLastErrorTime(prev => ({
            ...prev,
            [name]: now
          }))
        }
      } else {
        // Limpiar error si es válido
        setFieldErrors(prev => ({
          ...prev,
          [name]: ''
        }))
      }
    } else {
      // Limpiar error si el campo está vacío o es contraseña
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar todo el formulario antes de enviar
      const validation = validateRegisterForm(formData)
      
      if (!validation.success) {
        // Marcar campos con error (solo para borde rojo)
        const errorFields: Record<string, string> = {}
        Object.keys(validation.errors || {}).forEach(field => {
          errorFields[field] = 'error'
        })
        setFieldErrors(errorFields)
        
        // Mostrar el primer error en un toast
        const firstError = Object.values(validation.errors || {})[0]
        toast.error('Error de validación', {
          description: firstError || 'Por favor corrige los campos marcados en rojo.',
        })
        return
      }

      // Limpiar errores si la validación es exitosa
      setFieldErrors({})

      // Transformar datos al formato del servidor
      const serverData = transformToServerFormat(validation.data!)
      
      // Llamar a la API de registro con datos validados
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Si hay errores de validación del servidor, marcar campos
        if (data.errors) {
          const errorFields: Record<string, string> = {}
          Object.keys(data.errors).forEach(field => {
            errorFields[field] = 'error'
          })
          setFieldErrors(errorFields)
          
          // Mostrar el primer error en toast
          const firstError = Object.values(data.errors)[0] as string
          toast.error('Error de validación', {
            description: firstError || data.message || 'Error al crear la cuenta',
          })
        } else {
          // Error general (como usuario ya existe)
          toast.error('Error al crear la cuenta', {
            description: data.error || data.message || 'Por favor intenta nuevamente.',
          })
        }
        return
      }
      
      // Mostrar mensaje de éxito
      toast.success('¡Cuenta creada correctamente! 🎉', {
        description: 'Ya puedes iniciar sesión con tu nueva cuenta.',
        duration: 4000,
      })
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        apellidos: '',
        correo: '',
        telefono: '',
        password: '',
        confirmPassword: ''
      })
      
      // Cambiar a formulario de login después de un breve delay
      setTimeout(() => {
        onToggleForm?.()
      }, 4000)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta'
      toast.error(errorMessage, {
        description: 'Por favor intenta nuevamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Crear Cuenta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Completa todos los campos para crear tu cuenta
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Field className="relative">
            <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={cn(fieldErrors.nombre && "border-red-500 focus-visible:ring-red-500")}
            />
          </Field>
          
          <Field className="relative">
            <FieldLabel htmlFor="apellidos">Apellidos</FieldLabel>
            <Input
              id="apellidos"
              name="apellidos"
              type="text"
              placeholder="Apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={cn(fieldErrors.apellidos && "border-red-500 focus-visible:ring-red-500")}
            />
          </Field>
        </div>

        <Field className="relative">
          <FieldLabel htmlFor="correo">Correo Electrónico</FieldLabel>
          <Input
            id="correo"
            name="correo"
            type="email"
            placeholder="Correo Electrónico"
            value={formData.correo}
            onChange={handleChange}
            required
            disabled={isLoading}
            className={cn(fieldErrors.correo && "border-red-500 focus-visible:ring-red-500")}
          />
        </Field>

        <Field className="relative">
          <FieldLabel htmlFor="telefono">Teléfono</FieldLabel>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
              +52
            </div>
          <Input
            id="telefono"
            name="telefono"
            type="tel"
              placeholder="7123456789"
            value={formData.telefono}
            onChange={handleChange}
            disabled={isLoading}
              maxLength={10}
              className={cn("pl-12", fieldErrors.telefono && "border-red-500 focus-visible:ring-red-500")}
          />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Opcional. Solo números, 10 dígitos para futuras notificaciones
          </p>
        </Field>
        
        <Field className="relative">
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              
              className={cn("pr-10", fieldErrors.password && "border-red-500 focus-visible:ring-red-500")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={isLoading || !formData.password}
            >
              {showPassword ? (
                <EyeOpenIcon className="h-4 w-4" />
              ) : (
                <EyeClosedIcon className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </span>
            </button>
          </div>
          {formData.password && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                
                <span className={cn(
                  "font-medium",
                  passwordStrength.strength < 40 && "text-gray-100",
                  passwordStrength.strength >= 40 && passwordStrength.strength < 70 && "text-gray-250",
                  passwordStrength.strength >= 60 && "text-gray-250"
                )}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={passwordStrength.strength} 
                  className="h-2"
                />
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full transition-all duration-300",
                    passwordStrength.color
                  )}
                  style={{
                    width: `${passwordStrength.strength}%`,
                  }}
                />
              </div>
            </div>
          )}
        </Field>

        <Field className="relative">
          <FieldLabel htmlFor="confirmPassword">Confirmar Contraseña</FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar Contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              
              className={cn("pr-10", fieldErrors.confirmPassword && "border-red-500 focus-visible:ring-red-500")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={isLoading || !formData.confirmPassword}
            >
              {showConfirmPassword ? (
                <EyeOpenIcon className="h-4 w-4" />
              ) : (
                <EyeClosedIcon className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </span>
            </button>
          </div>
        </Field>

        <Field>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>
        </Field>

        <Field>
          <FieldDescription className="text-center">
            ¿Ya tienes una cuenta?{" "}
            {onToggleForm ? (
              <button
                type="button"
                onClick={onToggleForm}
                className="underline underline-offset-4 hover:text-primary"
              >
                Iniciar sesión
              </button>
            ) : (
              <a href="#" className="underline underline-offset-4">
                Iniciar sesión
              </a>
            )}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
