import { useState } from "react"
import { format } from 'date-fns'

interface Props {
    text: string,
    messageKey: number,
    time: string,
    clientSentMsg: boolean,
    name: string
}

const MessageBox = ({ text, messageKey, time, clientSentMsg, name }: Props) => {
    const [hovered, setHovered] = useState(false)
    
    const formattedTime = format(new Date(time), "h:mm a")
    // If you want AM/PM instead of military, use: "MMM d, yyyy 'at' h:mm a"

    return (
        <>
            {clientSentMsg ? (
                <div className='flex flex-row items-center'>
                    <div className='flex flex-row items-center ml-auto'
                        onMouseEnter={() => { setHovered(true) }}
                        onMouseLeave={() => { setHovered(false) }}>
                        <div
                            key={messageKey}
                            className={`bg-blue-500 p-2 flex items-center shadow-md justify-between rounded-md max-w-xs md:max-w-md mb-3 ${hovered ? '' : 'mr-5'}`}>
                            <div className="text-white whitespace-normal break-all">{text}</div>
                        </div>
                        {hovered ? (<div className='mb-3 ml-1'>{formattedTime}</div>) : <></>}
                    </div>

                </div>

            ) : (
                <div className='flex flex-col'>
                    <div className='ml-5'>{name}</div>
                    <div className='flex flex-row items-center mr-auto'
                        onMouseEnter={() => { setHovered(true) }}
                        onMouseLeave={() => { setHovered(false) }}>
                        <div
                            key={messageKey}
                            className={`bg-gray-300 p-2 flex items-center shadow-md justify-between mr-auto rounded-md max-w-xs md:max-w-md mb-3 ml-5`}>
                            <div className={`text-black whitespace-normal break-all`}>{text}</div>
                        </div>
                        {hovered ? (<div className='mb-3 ml-1'>{formattedTime}</div>) : <></>}
                    </div>

                </div>
            )}

        </>

    )
}

export default MessageBox;