import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { UserProfile, useUser } from "@auth0/nextjs-auth0/client";
import NavBar from "@/components/Navbar";
import { supabase } from "@/utils/supabase";
import { useEffect, useState, useRef, ChangeEvent } from "react";
import MessageBox from "@/components/MessageBox";
import { useRouter } from "next/router";

interface Props {
  user: UserProfile;
}

interface DBMsg {
  userid: string;
  message: string;
}

interface DBUser {
  name: string;
  email: string;
}

interface decyptInfo {
  sender: string;
  reciever: string;
  msgID: number;
}

interface userList {
  id: number;
  email: string;
}

const Messaging = ({ user }: Props) => {
  //gets the information passed in
  // const router = useRouter();
  // const { userEmail, userName } = router.query;
  const [message, setMessage] = useState("");
  const ERROR: string = "error";
  const [listOfMessages, setlistOfMessages] = useState<React.ReactNode[]>([]);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [USERNUMID, setUSERNUMID] = useState("-1");
  const [name, setName] = useState("");

  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const [checkboxData, setCheckboxData] = useState<userList[]>([]);

  //key generation
  const [result, setResult] = useState(null);
  const handleKeygen = async () => {
    const email = user.email; // Replace with the actual email
    const name = user.name;

    try {
      const response = await fetch(`http://localhost:5000/api/flask/user/create/keygen/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email, name: name }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  }; //--------

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    const email = event.target.dataset.email;
    console.log(email);
    if (!email) {
      return;
    }

    const updatedCheckedItems = [...checkedItems];

    if (checked) {
      updatedCheckedItems.push(email);
    } else {
      const index = updatedCheckedItems.indexOf(email);
      if (index !== -1) {
        updatedCheckedItems.splice(index, 1);
      }
    }

    setCheckedItems(updatedCheckedItems);
  };
  useEffect(() => {
    console.log("CHECKED ITEMS!");
    console.log(checkedItems);
  }, [checkedItems]);

  // checks to see if the user is found in the database
  const checkNewUser = async () => {
    let { data, error } = await supabase.from("users").select("email");
    let userEmail = user?.email ?? "";
    let len = data?.length ?? 0;
    let counter = 0;
    let emails: userList[] = [];
    for (let i = 0; i < len; i++) {
      if (userEmail != data?.at(i)?.email) {
        counter++;
      }
      // emails.push(data?.at(i)?.email)
      let temp: userList = { id: i + 1, email: data?.at(i)?.email };
      emails.push(temp);

      // let newOption = [...checkboxData]
      // newOption.push({id: i, email: data?.at(i)?.email ?? "error"});
      // setCheckboxData(newOption);
    }
    setCheckboxData([...emails]);
    console.log(checkboxData);
    // setListOfUsers([...emails])
    // console.log(listOfUsers)
    console.log(emails);
    // console.log("Hi")
    if (counter == len) {
      handleKeygen().then((result) => {
        console.log(result);
        const newUser = {
          name: user?.name ?? "error",
          email: user?.email ?? "error@gmail.com" + len,
        };
        //addUserToDatabase(newUser)
      });
    }
  };

  const start = async () => {
    checkNewUser();
    let { data, error } = await supabase.from("messagetracking").select();
    const length: number = data?.length ?? 0;
    if (length > 0) {
      const temp = [];
      for (let i = length - 1; i >= 0; i--) {
        const msg: string = data?.at(i)?.message ?? ERROR;
        const msgID: number = data?.at(i)?.id ?? -1;
        const time: string = data?.at(i)?.created_at.split(".")[0].substr(11);
        const msgName: string = data?.at(i)?.name;
        const clientSentThisMsg: boolean = data?.at(i)?.userid === USERNUMID;
        temp.push(
          <MessageBox
            text={msg}
            messageKey={msgID}
            key={msgID}
            time={time}
            clientSentMsg={clientSentThisMsg}
            name={msgName}
          />
        );
      }
      setlistOfMessages([...temp]);
    }
  };

  // when the page first renders
  useEffect(() => {
    setName(user?.name ?? "");
    const userId: string = user?.sub ?? ERROR;
    if (userId === ERROR) {
      setUSERNUMID("-1");
      return;
    }
    const idParts: string[] = userId.split("|");
    try {
      setUSERNUMID(idParts[1]);
    } catch {
      setUSERNUMID("-1");
    }
  }, []);

  //Calls start once the USERNUMID is set
  useEffect(() => {
    start();
  }, [USERNUMID]);

  const decrypt = async (data: decyptInfo) => {
    try {
      const response = await fetch(`http://localhost:5000/api/flask/message/decrypt/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender: data.sender, receiver: data.reciever, message: data.msgID }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        return data;
      } else {
        console.error("Failed to fetch data");
        return null;
      }
    } catch (error) {
      console.error("Error during fetch:", error);
      return null;
    }
  };

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }

    const channel = supabase
      .channel("realtime messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messagetracking",
        },
        async (payload: any) => {
          const clientSentThisMsg: boolean = payload.new.userid === USERNUMID;
          const time: string = payload.new.created_at?.split(".")[0].substr(11);
          const msgName: string = payload.new.name;
          const msgID: number = payload.new.id;
          console.log("PAYLOAD");
          console.log(payload);
          //fetch decrypt api call

          const sender_email = payload.new.userfrom;

          const decryptData: decyptInfo = {
            sender: sender_email,
            reciever: user.email ?? "error@error.com",
            msgID: msgID,
          };

          const message = await decrypt(decryptData);

          console.log(message);

          //this happens for everybody
          //get the sender's email, and this users email
          //fetch db with those emails
          //response will contain a message
          //Show message
          //that will either return the decrypted message
          //or the encrypted message if it wasnt for them
          if (!message && sender_email === user.email) {
            setlistOfMessages([
              ...[
                <MessageBox
                  text={"Message Sent By You"}
                  messageKey={payload.new.id}
                  key={payload.new.id}
                  time={time}
                  clientSentMsg={clientSentThisMsg}
                  name={msgName}
                />,
              ],
              ...listOfMessages,
            ]);
          } else if (!message) {
            setlistOfMessages([
              ...[
                <MessageBox
                  text={"Message Not Meant For You"}
                  messageKey={payload.new.id}
                  key={payload.new.id}
                  time={time}
                  clientSentMsg={clientSentThisMsg}
                  name={msgName}
                />,
              ],
              ...listOfMessages,
            ]);
          } else {
            setlistOfMessages([
              ...[
                <MessageBox
                  text={message.message}
                  messageKey={payload.new.id}
                  key={payload.new.id}
                  time={time}
                  clientSentMsg={clientSentThisMsg}
                  name={msgName}
                />,
              ],
              ...listOfMessages,
            ]);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listOfMessages]);

  const submit = async (msg: DBMsg) => {
    // await supabase
    //     .from('messagetracking')
    //     .insert(msg)
    try {
      const response = await fetch(`http://localhost:5000/api/flask/message/encrypt/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender: user.email, receiver: checkedItems[0], message: msg.message }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // Handle the submission logic here
      if (USERNUMID === "-1") {
        console.log("ERROR WITH USERID");
      }
      const msg4DB = {
        userid: USERNUMID,
        message: message,
        name: name,
      };
      if (message.length < 6500) {
        submit(msg4DB);
        //sender: sender email
        //receiver: receiver email
        //message: message
      }
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <NavBar username={user?.name ?? ERROR} />
      <div className="flex-1 bg-gray-100">
        <div
          ref={messageContainerRef}
          className="overflow-y-auto bg-white"
          style={{ maxHeight: "70vh", minHeight: "70vh" }}>
          <div className="text-center text-3xl font-bold mt-3 mb-3">Global Chat</div>
          <div className="flex flex-col-reverse">{listOfMessages}</div>
        </div>
        <div className="flex justify-center items-center">
          <textarea
            className={`w-1/2 mr-4 text-black border-solid border-2 border-gray-300 pl-4 pr-4 overflow-auto`}
            style={{
              height: "14vh",
              overflowX: "hidden",
              overflowY: "scroll",
              fontSize: "24px",
            }}
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div
            className="bg-white w-1/4 border-solid border-2 border-gray-300 overflow-auto"
            style={{ height: "14vh" }}>
            <div className="container">
              <div className="row">
                <div className="col">
                  {checkboxData.map((item) => (
                    <div key={item.id} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name={`checkbox${item.id}`}
                        data-email={item.email}
                        checked={checkedItems.includes(`${item.email}`)}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label">{item.email}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p>Selected checkboxes: {checkedItems.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Messaging;

export const getServerSideProps = withPageAuthRequired({});
