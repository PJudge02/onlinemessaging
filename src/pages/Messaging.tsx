import { withPageAuthRequired } from '@auth0/nextjs-auth0'
import { UserProfile, useUser } from '@auth0/nextjs-auth0/client'
import NavBar from '@/components/Navbar'
import { supabase } from '@/utils/supabase'
import { useEffect, useState, useRef, ChangeEvent } from 'react'
import MessageBox from '@/components/MessageBox'
import { useRouter } from 'next/router';

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

interface userList{
    id: number,
    email: string
}

const Messaging = ({ user }: Props) => {
    //gets the information passed in
    // const router = useRouter();
    // const { userEmail, userName } = router.query;
    const [message, setMessage] = useState('')
    const ERROR: string = 'error'
    const [listOfMessages, setlistOfMessages] = useState<React.ReactNode[]>([])
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const [USERNUMID, setUSERNUMID] = useState('-1')
    const [name, setName] = useState('')
    const [listOfUsers, setListOfUsers] = useState<string[]>([])
    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    // Sample array of checkbox items
    const checkboxData = [
        { id: 1, label: 'Option 1' },
        { id: 2, label: 'Option 2' },
        { id: 3, label: 'Option 3' },
        { id: 4, label: 'Option 4' },
        { id: 5, label: 'Option 5' },
        { id: 6, label: 'Option 6' }
    ];
    // const [checkboxData, setCheckboxData] = useState<userList[]>([])

    const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;

        const updatedCheckedItems = [...checkedItems];

        if (checked) {
            updatedCheckedItems.push(name);
        } else {
            const index = updatedCheckedItems.indexOf(name);
            if (index !== -1) {
                updatedCheckedItems.splice(index, 1);
            }
        }

        setCheckedItems(updatedCheckedItems);
    };
    useEffect(() => {
        console.log("CHECKED ITEMS!")
        console.log(checkedItems)
    }, [checkedItems])

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
            // let newOption = [...checkboxData]
            // newOption.push({id: i, email: data?.at(i)?.email ?? "error"});
            // setCheckboxData(newOption);
        }
        setListOfUsers([...emails])
        console.log(listOfUsers)
        console.log(emails)
        console.log("Hi")
        if (counter == len) {
            const newUser = {
                name: user?.name ?? "error",
                email: user?.email ?? "error@gmail.com" + len
            }
            addUserToDatabase(newUser)
        }
    }
    // if the user isn't found in the database, user is added to it
    const addUserToDatabase = async (newUser: DBUser) => {
        await supabase.from('users').insert(newUser)
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
                const msgName: string = data?.at(i)?.name
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
    }, [])

    //Calls start once the USERNUMID is set
    useEffect(() => {
        start()
    }, [USERNUMID])

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }

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
                    setlistOfMessages([
                        ...[<MessageBox
                            text={payload.new.message}
                            messageKey={payload.new.id}
                            key={payload.new.id}
                            time={time}
                            clientSentMsg={clientSentThisMsg}
                            name={msgName} />],
                        ...listOfMessages])
                }
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [listOfMessages])

    const submit = async (msg: DBMsg) => {
        console.log(listOfUsers)
        await supabase
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
                    <div className='bg-white w-1/4 border-solid border-2 border-gray-300 overflow-auto'
                        style={{ height: '14vh' }}>
                        <div className="container">
                            <div className="row">
                                <div className="col">
                                    {checkboxData.map((item) => (
                                        <div key={item.id} className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name={`checkbox${item.id}`}
                                                checked={checkedItems.includes(`checkbox${item.id}`)}
                                                onChange={handleCheckboxChange}
                                            />
                                            <label className="form-check-label">{item.email}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p>Selected checkboxes: {checkedItems.join(', ')}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
export default Messaging;

export const getServerSideProps = withPageAuthRequired({
});