import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/utils/supabase'

export default function Home() {
  // const checkNewUser = async () => {
  //   let {data, error } = await supabase
  //     .from('users')
  //     .select('email')
  //   console.log("the following are the emails:")
  //   console.log(data)
  // }
  // checkNewUser()

  const { user, error, isLoading } = useUser()
  const router = useRouter()

  if(isLoading) return <div>... loading</div>
  if(error) return <div>{error.message}</div>

  if (user) {
    console.log(user)
    console.log(user?.email)
    console.log(user?.name)
    console.log("^")
    router.push({
      pathname: './Messaging',
      query: {userEmail: user.email, userName: user.name}
    })
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
