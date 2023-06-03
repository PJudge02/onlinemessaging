import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';

interface NavBarProps {
    username: string
}

const NavBar = ({ username }: NavBarProps) => {
    const router = useRouter()
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        if(window.innerWidth > 640){
            setShowWelcome(true)
        }
    }, []);

    return (
        <nav className="flex items-center justify-between bg-gray-900 text-white px-8" style={{ height: '12vh' }}>
            <Link href="/">
                <div className="text-2xl font-bold">Online Messaging</div>
            </Link>
            <div className='font-semibold flex items-center'>
                {showWelcome && (<div>Welcome {username}!</div>)}
                <button className="ml-4 py-2 px-4 rounded bg-blue-500 hover:bg-blue-600" onClick={() => router.push('/api/auth/logout')}>
                    Logout
                </button>
            </div>
        </nav>
    )
}

export default NavBar;