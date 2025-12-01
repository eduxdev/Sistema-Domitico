import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateServerRegisterForm } from '@/lib/validations/register'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar datos con Zod
    const validation = validateServerRegisterForm(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Datos de registro inválidos',
          errors: validation.errors 
        },
        { status: 400 }
      )
    }

    const { email, password, fullName, phoneNumber } = validation.data!

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este correo electrónico' },
        { status: 409 }
      )
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 12)

    // Separar nombre y apellidos
    const nameParts = fullName.trim().split(' ')
    const nombre = nameParts[0] || ''
    const apellidos = nameParts.slice(1).join(' ') || ''

    // Crear usuario
    const { data: user, error } = await supabase
      .from('usuarios')
      .insert({
        email,
        password_hash: passwordHash,
        nombre,
        apellidos,
        telefono: phoneNumber || null
      })
      .select('id, email, nombre, apellidos, telefono')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.nombre} ${user.apellidos}`.trim(),
        phoneNumber: user.telefono
      }
    })

  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}