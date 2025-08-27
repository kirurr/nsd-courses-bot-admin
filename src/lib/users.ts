import { createServerFn } from '@tanstack/react-start'
import * as v from 'valibot'
import { db } from './db'

const UserSchema = v.object({
  telegramId: v.number(),
  username: v.optional(v.string()),
  name: v.string(),
  isAccepted: v.pipe(
    v.number(),
    v.transform((input) => input !== 0),
  ),
})

export type User = v.InferOutput<typeof UserSchema>

const PaymentSchema = v.object({
  id: v.number(),
  userId: v.number(),
  courseId: v.number(),
  isInvited: v.pipe(
    v.number(),
    v.transform((input) => input !== 0),
  ),
})

export type Payment = v.InferOutput<typeof PaymentSchema>

const CourseSchema = v.object({
  id: v.number(),
  title: v.string(),
  description: v.string(),
  groupId: v.string(),
})

export type Course = v.InferOutput<typeof CourseSchema>

async function getUsers(): Promise<User[]> {
  const res = await db.execute('SELECT * FROM user')
  const users = v.parse(
    v.array(UserSchema),
    res.rows.map((user) => {
      return {
        telegramId: user.telegram_id,
        username: user.username,
        name: user.name,
        isAccepted: user.is_accepted,
      }
    }),
  )

  return users
}

async function getPayments(): Promise<Payment[]> {
  const res = await db.execute('SELECT * FROM payment')
  const payments = v.parse(
    v.array(PaymentSchema),
    res.rows.map((payment) => {
      return {
        id: payment.id,
        userId: payment.user_id,
        courseId: payment.course_id,
        isInvited: payment.is_invited,
      }
    }),
  )

  return payments
}

async function getCourses(): Promise<Course[]> {
  const res = await db.execute('SELECT * FROM course')
  const courses = v.parse(
    v.array(CourseSchema),
    res.rows.map((course) => {
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        groupId: course.group_id,
      }
    }),
  )

  return courses
}

export type MainPageData = User & { courses: Array<Course & { paid: boolean }> }

export const getMainPageData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MainPageData[]> => {
    const [users, payments, courses] = await Promise.all([
      getUsers(),
      getPayments(),
      getCourses(),
    ])

    return users.map((user) => {
      return {
        ...user,
        courses: courses.map((course) => {
          return {
            ...course,
            paid: payments.find((payment) => {
              return (
                payment.userId === user.telegramId &&
                payment.courseId === course.id
              )
            })
              ? true
              : false,
          }
        }),
      }
    })
  },
)

const TogglePaymentSchema = v.object({
  userId: v.number(),
  courseId: v.number(),
})

type TogglePaymentInput = v.InferInput<typeof TogglePaymentSchema>

async function getPaymentByUserIdAndCourseId(
  data: TogglePaymentInput,
): Promise<Payment | null> {
  const res = await db.execute({
    sql: 'SELECT * FROM payment WHERE user_id = ? AND course_id = ?',
    args: [data.userId, data.courseId],
  })

  const payment = res.rows[0]
  if (!payment) {
    return null
  }

  const output = v.parse(PaymentSchema, {
    id: payment.id,
    userId: payment.user_id,
    courseId: payment.course_id,
    isInvited: payment.is_invited,
  })

  return output
}

async function createPayment(data: TogglePaymentInput) {
  await db.execute({
    sql: 'INSERT INTO payment VALUES(null, ?, ?, 0)',
    args: [data.userId, data.courseId],
  })
}

async function deletePayment(id: number) {
  await db.execute({ sql: 'DELETE FROM payment WHERE id = ?', args: [id] })
}

export const togllePaymentForCourse = createServerFn()
  .validator((data: TogglePaymentInput): TogglePaymentInput => {
    const result = v.parse(TogglePaymentSchema, data)
    return result
  })
  .handler(async (ctx) => {
    const payment = await getPaymentByUserIdAndCourseId(ctx.data)

    if (!payment) {
      await createPayment(ctx.data)
    } else {
      await deletePayment(payment.id)
    }
  })
