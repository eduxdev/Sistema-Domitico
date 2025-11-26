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
      .from('users')
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

    // Crear usuario
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone_number: phoneNumber || null
      })
      .select('id, email, full_name, phone_number')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phoneNumber: user.phone_number
      }
    })

  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}