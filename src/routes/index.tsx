import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuth } from '@/lib/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMainPageData,
  MainPageData,
  togllePaymentForCourse,
} from '@/lib/users'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMemo, useState } from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
import { cn, findDifference } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const auth = await isAuth()

    if (!auth) {
      throw redirect({ to: '/signin' })
    }
  },
})

function App() {
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: ['data'],
    queryFn: getMainPageData,
  })

  const [searchValue, setSearchValue] = useState<string>('')

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((user) =>
      user.username?.toLowerCase().includes(searchValue.toLowerCase()),
    )
  }, [data, searchValue])

  const mutation = useMutation({
    mutationFn: togllePaymentForCourse,
    mutationKey: ['payment'],
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['data'] }),
    onSuccess: (_, v) =>
      toast.success('Успешно', { id: `${v.data.courseId} ${v.data.userId}` }),
    onError: (err, v) =>
      toast.error(err.message, { id: `${v.data.courseId} ${v.data.userId}` }),
    onMutate: (v) =>
      toast.loading('Обработка...', {
        id: `${v.data.courseId} ${v.data.userId}`,
      }),
  })

  function togglePayment(userId: number, courseId: number) {
    mutation.mutate({ data: { userId, courseId } })
  }

  return (
    <main>
      <div className="lg:max-w-2/3 mx-auto lg:mt-32 p-4 lg:px-0">
        {error && error.message}
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(() => e.target.value)}
          placeholder="Поиск"
          className="mb-4"
        />
        <Table>
          <TableCaption
            className={cn(isPending ? '' : 'hidden', 'overflow-hidden')}
          >
            <LoaderCircle className="animate-spin" />
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden lg:table-cell w-1/6">id</TableHead>
              <TableHead className="lg:w-1/6 w-1/3">username</TableHead>
              <TableHead className="hidden lg:table-cell w-1/6">name</TableHead>
              <TableHead className="hidden lg:table-cell w-1/6">
                politics
              </TableHead>
              <TableHead className="lg:w-2/6 w-2/3">courses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isPending &&
              filtered &&
              filtered.map((user) => (
                <UserRow
                  key={user.telegramId}
                  user={user}
                  togglePayment={togglePayment}
                />
              ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}

export function UserRow({
  user,
  togglePayment,
}: {
  user: MainPageData
  togglePayment: (userId: number, courseId: number) => void
}) {
  const [selectedValues, setSelectedValues] = useState<string[]>(
    user.courses
      .filter((course) => course.paid)
      .map((course) => course.id.toString()),
  )

  async function handleTogglePayment(values: string[]) {
    const toggledValue = findDifference(selectedValues, values)
    if (toggledValue.length === 0) return
    Promise.all(
      toggledValue.map((value) =>
        togglePayment(user.telegramId, parseInt(value)),
      ),
    )
    setSelectedValues(values)
  }
  return (
    <TableRow>
      <TableCell className="w-1/6 hidden lg:table-cell">
        {user.telegramId}
      </TableCell>
      <TableCell>{user.username}</TableCell>
      <TableCell className="hidden lg:table-cell">{user.name}</TableCell>
      <TableCell className="hidden lg:table-cell">
        {user.isAccepted ? 'true' : 'false'}
      </TableCell>
      <TableCell>
        <MultiSelect
          searchable={false}
          options={user.courses.map((course) => ({
            value: course.id.toString(),
            label: course.title,
          }))}
          onValueChange={handleTogglePayment}
          defaultValue={selectedValues}
          placeholder="Приобретенные курсы"
          hideSelectAll
          singleLine
          responsive={{ mobile: { maxCount: 1, compactMode: true } }}
        />
      </TableCell>
    </TableRow>
  )
}
