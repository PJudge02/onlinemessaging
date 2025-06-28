import { withPageAuthRequired } from '@auth0/nextjs-auth0'
import { UserProfile, useUser } from '@auth0/nextjs-auth0/client'
import NavBar from '@/components/Navbar'
import { supabase } from '@/utils/supabase'
import { useEffect, useState, useRef } from 'react'
import MessageBox from '@/components/MessageBox'

interface Props {
    user: UserProfile

}

interface DBMsg {
    userid: string,
    message: string
}

interface DBUser {
    name: string,
    email: string
}

const Messaging = ({ user }: Props) => {
    const [message, setMessage] = useState('')
    const ERROR: string = 'error'
    const [listOfMessages, setlistOfMessages] = useState<React.ReactNode[]>([])
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const [USERNUMID, setUSERNUMID] = useState('-1')
    const [name, setName] = useState('')
    const [listOfUsers, setListOfUsers] = useState<string[]>([])
    const PAGE_SIZE = 20

    // checks to see if the user is found in the database
    const checkNewUser = async () => {
        let { data, error } = await supabase
            .from('users')
            .select('email')
        let userEmail = user?.email ?? ""
        let len = data?.length ?? 0
        let counter = 0
        let emails: string[] = []
        for (let i = 0; i < len; i++) {
            if (userEmail != data?.at(i)?.email) {
                counter++
            }
            emails.push(data?.at(i)?.email)
        }
        setListOfUsers([...emails])
        if (counter == len) {
            const newUser = {
                name: user?.name ?? "error",
                email: user?.email ?? " @gmail.com" + len
            }
            addUserToDatabase(newUser)
        }
    }
    // if the user isn't found in the database, user is added to it
    const addUserToDatabase = async (newUser: DBUser) => {
        console.log("Trying to add user to database")
        const result = await supabase.from('users').insert(newUser)
    }

    const start = async () => {
        checkNewUser()
        let { data, error } = await supabase
            .from('messagetracking')
            .select()
        const length: number = data?.length ?? 0
        if (length > 0) {
            const temp = []
            for (let i = length - 1; i >= 0; i--) {
                const msg: string = data?.at(i)?.message ?? ERROR
                const msgID: number = data?.at(i)?.id ?? -1
                const time: string = data?.at(i)?.created_at.split('.')[0].substr(11)
                const msgName: string = data?.at(i)?.name //not sure who's name
                const clientSentThisMsg: boolean = data?.at(i)?.userid === USERNUMID
                temp.push(<MessageBox
                    text={msg}
                    messageKey={msgID}
                    key={msgID}
                    time={time}
                    clientSentMsg={clientSentThisMsg}
                    name={msgName} />)
            }
            setlistOfMessages([...temp])
        }
    }

    // when the page first renders 
    useEffect(() => {
        setName(user?.name ?? '')
        const userId: string = user?.sub ?? ERROR
        if (userId === ERROR) {
            setUSERNUMID('-1')
            return
        }
        const idParts: string[] = userId.split('|')
        try {
            setUSERNUMID(idParts[1])
        } catch {
            setUSERNUMID('-1')
        }
        console.log("HELLO THERE")
        console.log(user)
    }, [])

    //Calls start once the USERNUMID is set
    useEffect(() => {
        start()
    }, [USERNUMID])

    //auto scrolling
    useEffect(() =>{
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }   
    },[listOfMessages])

    useEffect(() => {
        const channel = supabase
            .channel('realtime messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messagetracking'
                },
                (payload: any) => {
                    const clientSentThisMsg: boolean = payload.new.userid === USERNUMID
                    const time: string = payload.new.created_at?.split('.')[0].substr(11)
                    const msgName: string = payload.new.name
                    setlistOfMessages((prevMessages) => [
                        <MessageBox
                            text={payload.new.message}
                            messageKey={payload.new.id}
                            key={payload.new.id}
                            time={time}
                            clientSentMsg={clientSentThisMsg}
                            name={msgName}
                        />,
                        ...prevMessages
                    ]);
                }
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [USERNUMID])

    const submit = async (msg: DBMsg) => { //adding the message to the database
        const result = await supabase
            .from('messagetracking')
            .insert(msg)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            // Handle the submission logic here
            if (USERNUMID === '-1') { console.log("ERROR WITH USERID") }
            const msg4DB = {
                userid: USERNUMID,
                message: message,
                name: name
            }
            if (message.length < 6500) {
                submit(msg4DB)
            }
            setMessage('');
        }
    }

    return (
        <div className="flex flex-col h-screen">
            <NavBar username={user?.name ?? ERROR} />
            <div className="flex-1 bg-gray-100">
                <div
                    ref={messageContainerRef}
                    className='overflow-y-auto bg-white'
                    style={{ maxHeight: '70vh', minHeight: '70vh' }}>
                    <div className='text-center text-3xl font-bold mt-3 mb-3'>Global Chat</div>
                    <div className='flex flex-col-reverse'>
                        {listOfMessages}
                    </div>
                </div>
                <div className="flex justify-center items-center">
                    <textarea className={`w-1/2 mr-4 text-black border-solid border-2 border-gray-300 pl-4 pr-4 overflow-auto`}
                        style={{
                            height: '14vh',
                            overflowX: 'hidden',
                            overflowY: 'scroll',
                            fontSize: '24px'
                        }}
                        placeholder="Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

            </div>
        </div>
    )
}
export default Messaging;

export const getServerSideProps = withPageAuthRequired({
});