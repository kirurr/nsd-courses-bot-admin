import { SignInData } from './auth'
import * as v from 'valibot'
import { db } from './db'

const AdminSchema = v.object({
  id: v.number(),
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

type Admin = v.InferInput<typeof AdminSchema>

export async function findAdmin(data: SignInData): Promise<Admin | null> {
  try {
    const res = await db.execute({
      sql: 'SELECT * FROM admin WHERE email = ? AND password = ?',
      args: [data.email, data.password],
    })

    const admin = res.rows[0]
    if (!admin) return null

    return v.parse(AdminSchema, admin)
  } catch (err) {
    console.error('failed to get admin')
    console.error(err)
    return null
  }
}
