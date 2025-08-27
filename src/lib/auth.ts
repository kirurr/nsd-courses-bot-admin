import { createServerFn } from '@tanstack/react-start'
import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'
import * as jose from 'jose'
import * as v from 'valibot'
import { findAdmin } from './admin'
import { redirect } from '@tanstack/react-router'

const SignInSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty('Please enter your email'),
    v.email('Wrong email format'),
  ),
  password: v.pipe(
    v.string(),
    v.nonEmpty('Please enter your password'),
    v.maxLength(200, 'Password is too long'),
  ),
})

export type SignInData = v.InferInput<typeof SignInSchema>

export const isAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const auth = getCookie('auth')
  if (!auth) {
    return false
  }
  const secret = new TextEncoder().encode(process.env.JWT_KEY)

  try {
    await jose.jwtVerify(auth, secret)
    return true
  } catch (err) {
    console.error('invalid or expired token', err)
    return false
  }
})

export const signin = createServerFn({ method: 'POST' })
  .validator((data: SignInData): SignInData => {
    return v.parse(SignInSchema, data)
  })
  .handler(async ({ data }: { data: SignInData }) => {
    const admin = await findAdmin(data)
    if (!admin) throw new Error('failed to find admin with data')

    const secret = new TextEncoder().encode(process.env.JWT_KEY)
    const jwt = await new jose.SignJWT({ email: data.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    setCookie('auth', jwt, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 })
    throw redirect({ to: '/' })
  })

export const signout = createServerFn({ method: 'GET' }).handler(async () => {
  deleteCookie('auth')
	throw redirect({ to: '/' })
})
