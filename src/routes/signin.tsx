import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isAuth, signin, SignInData } from '@/lib/auth'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Loader, LoaderCircle } from 'lucide-react'

export const Route = createFileRoute('/signin')({
  component: RouteComponent,
  loader: async () => {
    const auth = await isAuth()

    if (auth) {
      throw redirect({ to: '/' })
    }
  },
})

function RouteComponent() {
  const { mutate, isPending, error } = useMutation({
    mutationKey: ['signin'],
    mutationFn: signin,
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData.entries()) as SignInData

    mutate({ data })
  }

  return (
    <main className="h-screen flex flex-col justify-center">
      <form
        className="lg:max-w-1/6 mx-auto flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold">Sign in</h1>
        <div>
          <label className="text-black/70" htmlFor="email">
            Email
          </label>
          <Input name="email" placeholder="test@test.com" type="email" />
        </div>

        <div>
          <label className="text-black/70" htmlFor="password">
            Пароль
          </label>
          <Input name="password" placeholder="password" type="password" />
        </div>

        <Button className="w-fit mx-auto" disabled={isPending}>
          {isPending && <LoaderCircle className="animate-spin" />} Войти
        </Button>
        <p>{error && error.message}</p>
      </form>
    </main>
  )
}
