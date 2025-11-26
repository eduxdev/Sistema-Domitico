'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { z } from 'zod'
import { loginSchema, transformLoginToServerFormat, type LoginFormData } from '@/lib/validations/auth'
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'

interface LoginFormProps extends React.ComponentProps<"form"> {
  onToggleForm?: () => void
}

export function LoginForm({
  className,
  onToggleForm,
  ...props
}: LoginFormProps) {
  const [formData, setFormData] = useState({
    correo: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({})
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validar con Zod
    try {
      const validatedData = loginSchema.parse(formData)
      setErrors({}) // Limpiar errores si la validación es exitosa
      
      // Transformar datos al formato del servidor
      const serverData = transformLoginToServerFormat(validatedData)
      
      // Llamar a la API de login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }
      
      // Guardar datos del usuario en localStorage (temporal)
      localStorage.setItem('user', JSON.stringify(data.user))
      // También guardar un token temporal para compatibilidad (aunque el real está en cookies)
      localStorage.setItem('token', 'authenticated')
      
      toast.success('¡Inicio de sesión exitoso!', {
        description: 'Bienvenido de vuelta.',
        duration: 3000,
      })
      
      // Redirigir al dashboard
      router.push('/dashboard')
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Manejar errores de validación
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {}
        error.issues.forEach((err: z.ZodIssue) => {
          const field = err.path[0] as keyof LoginFormData
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = err.message
          }
        })
        setErrors(fieldErrors)
        
        // Mostrar el primer error
        const firstError = error.issues[0]?.message
        if (firstError) {
          toast.error(firstError)
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
        toast.error(errorMessage, {
          description: 'Por favor verifica tus credenciales.',
        })
      }
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
          <h1 className="text-2xl font-bold">Inicia Sesión</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Ingresa tu correo electrónico para iniciar sesión
          </p>
        </div>
        <Field>
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
            className={cn(
              errors.correo && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.correo && (
            <p className="text-xs text-red-500 mt-1">{errors.correo}</p>
          )}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
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
              className={cn(
                "pr-10",
                errors.password && "border-red-500 focus-visible:ring-red-500"
              )}
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
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </Field>

        <Field>
          <FieldDescription className="text-center">
            ¿No tienes una cuenta?{" "}
            {onToggleForm ? (
              <button
                type="button"
                onClick={onToggleForm}
                className="underline underline-offset-4 hover:text-primary"
              >
                Crear cuenta
              </button>
            ) : (
              <a href="#" className="underline underline-offset-4">
                Crear cuenta
              </a>
            )}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
