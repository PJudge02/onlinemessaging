import { withPageAuthRequired } from '@auth0/nextjs-auth0'
import { UserProfile, useUser } from '@auth0/nextjs-auth0/client'
import NavBar from '@/components/Navbar'
import { supabase } from '@/utils/supabase'
import { useEffect, useState } from 'react'

interface Props{
    user: UserProfile
    countries: {
        [x: string]: any;
    }[] | null
}

const TestMessaging = ({user, countries}: Props) => {

//   console.log(countries)
  console.log(user)
  console.log(user.sub)

    return (
        <div className="flex flex-col h-screen">
            <NavBar username={user?.name ?? ''} />
            <div className="flex-1 bg-gray-100">
                <div className='overflow-y-auto bg-white flex flex-col-reverse' style={{ maxHeight: '70vh', minHeight: '70vh' }}>
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                </div>
                <div className="flex justify-center items-center">
                    <textarea className="w-1/2 mx-auto text-black border-solid border-2 border-gray-300 pl-4 pr-4 overflow-auto" 
                    style={{ height: '14vh', overflowX: 'hidden', overflowY: 'scroll', fontSize:'24px' }} placeholder="Message"
                    />
                    {/* <input className="w-1/2 mx-auto text-black border-solid border-2 border-gray-300 pl-4 pr-4 overflow-auto" 
                    style={{ height: '10vh', overflowX: 'hidden', overflowY: 'scroll' }} type="search" placeholder="Message" /> */}
                </div>
            </div>
        </div>
    )
}
export default TestMessaging;

export const getServerSideProps = withPageAuthRequired({
    async getServerSideProps() {
        let { data } = await supabase.from('countries').select()

        return {
            props: {
             countries: data
            },
          }

    }

});