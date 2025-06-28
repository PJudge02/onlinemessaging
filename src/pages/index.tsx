import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { useRouter } from 'next/router'

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

  if (isLoading) return <div>... loading</div>
  if (error) return <div>{error.message}</div>

  if (user) {
    // console.log(user)
    // console.log(user?.email)
    // console.log(user?.name)
    // console.log("^")
    router.push({
      pathname: './Messaging',
      query: { userEmail: user.email, userName: user.name }
    })
    return null
  } else {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to My Chatroom</h1>
            <p className="text-gray-600 mb-6">Sign in to start messaging in real-time.</p>
            <Link
              href="/api/auth/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </>
    )
  }
}
