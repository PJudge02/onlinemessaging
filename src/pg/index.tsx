import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Home() {
  const { user, error, isLoading } = useUser()
  const router = useRouter()

  if(isLoading) return <div>... loading</div>
  if(error) return <div>{error.message}</div>

  if (user) {
    console.log(user)
    router.push('./Messaging')
    return null
  } else {
    return (
      <>
        <h1 className="flex flex-col items-center">You need to login</h1>
        <Link href='/api/auth/login' className="flex flex-col items-center">Login</Link>
      </>
    )
  }
}
