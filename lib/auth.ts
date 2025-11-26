import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  email: string
}

export async function verifyAuth(request: NextRequest | Request): Promise<AuthUser | null> {
  try {
    // Obtener token de las cookies
    let token: string | undefined

    if ('cookies' in request) {
      // NextRequest
      token = request.cookies.get('auth-token')?.value
    } else {
      // Request estándar
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)
        token = cookies['auth-token']
      }
    }

    if (!token) {
      return null
    }

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado')
      return null
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AuthUser
    
    return decoded
  } catch (error) {
    console.error('Error verificando token:', error)
    return null
  }
}

export function createAuthMiddleware() {
  return async (request: NextRequest) => {
    const user = await verifyAuth(request)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Agregar información del usuario a los headers para que esté disponible en la ruta
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId)
    requestHeaders.set('x-user-email', user.email)

    return new Request(request.url, {
      method: request.method,
      headers: requestHeaders,
      body: request.body,
    })
  }
}
