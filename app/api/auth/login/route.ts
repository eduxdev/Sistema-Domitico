import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { loginSchema } from '@/lib/validations/auth'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar datos con Zod
    const validation = loginSchema.safeParse(body)
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      
      return NextResponse.json(
        { 
          error: 'Datos de inicio de sesión inválidos',
          errors: fieldErrors 
        },
        { status: 400 }
      )
    }

    const { correo, password } = validation.data
    const email = correo // Mapear correo a email

    // Buscar usuario
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Crear JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.nombre} ${user.apellidos}`.trim(),
        phoneNumber: user.telefono
      }
    })

    // Establecer cookie httpOnly
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 días
    })

    return response

  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}