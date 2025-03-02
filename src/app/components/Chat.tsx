'use client';

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { TbMessageChatbot } from 'react-icons/tb';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import OpenAI from 'openai';
import LoadingIcons from 'react-loading-icons';
// import { useRouter } from 'next/navigation';

type Message = {
  text: string;
  sender: string;
  craetedAt: Timestamp;
};

type MyCompletionMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const Chat = () => {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
    dangerouslyAllowBrowser: true,
  });

  const { selectedRoom, selectedRoomName } = useAppContext();

  // const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const scrollDiv = useRef<HTMLDivElement>(null);

  //各琉0無におけるメッセージを取得
  useEffect(() => {
    if (selectedRoom) {
      const fetchMessages = async () => {
        const roomDocRef = doc(db, 'rooms', selectedRoom);
        const messageCollectionRef = collection(roomDocRef, 'messages');

        const q = query(messageCollectionRef, orderBy('createdAt'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newMessages = snapshot.docs.map((doc) => doc.data() as Message);
          setMessages(newMessages);
          console.log(messages);
        });

        return () => {
          unsubscribe();
        };
      };

      fetchMessages();
    }
  }, [selectedRoom, messages]);

  useEffect(() => {
    if (scrollDiv.current) {
      const element = scrollDiv.current;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageData = {
      text: inputMessage,
      sender: 'user',
      createdAt: serverTimestamp(),
    };

    const roomDocRef = doc(db, 'rooms', selectedRoom!);
    const messagesCollectionRef = collection(roomDocRef, 'messages');
    await addDoc(messagesCollectionRef, messageData);

    // 最後のN個の交換を取得（例では最後の5個）
    const lastNMessages: MyCompletionMessage[] = messages
      .slice(-5)
      .map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      }));

    // 新しいユーザーの入力を追加
    lastNMessages.push({ role: 'user', content: inputMessage });

    // const prompt = inputMessage;

    setInputMessage('');

    setIsLoading(true);

    const gpt3Response = await openai.chat.completions.create({
      // messages: [{ role: "user", content: prompt }],
      messages: lastNMessages,
      model: 'gpt-3.5-turbo',
    });

    setIsLoading(false);

    const botResponse = gpt3Response.choices[0].message.content;
    // console.log(botResponse);

    // ボットの返信を Firestore に保存
    await addDoc(messagesCollectionRef, {
      text: botResponse,
      sender: 'bot',
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="bg-gray-900 h-full p-4 flex flex-col">
      <h1 className="text-white mb-2 text-lg">{selectedRoomName}</h1>
      <div className="flex-grow overflow-y-auto mb-4 space-y-4" ref={scrollDiv}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.sender === 'user' ? 'text-right' : 'text-left'}
          >
            <div
              className={
                message.sender === 'user'
                  ? 'bg-slate-700 inline-block rounded px-4 py-2 mb-2'
                  : 'bg-stone-700 inline-block rounded px-4 py-2 mb-2'
              }
            >
              <p className="text-white">{message.text}</p>
            </div>
          </div>
        ))}
        {isLoading && <LoadingIcons.SpinningCircles />}
      </div>
      <div className="flex-shrink-0 relative">
        <input
          type="text"
          placeholder="Send a message"
          className="border-2 rounded w-full p-2 pr-10 focus:outline-none"
          onChange={(e) => setInputMessage(e.target.value)}
          value={inputMessage}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-2 flex items-center"
          onClick={() => sendMessage()}
        >
          <i className="fa fa-paper-plane text-gray-500 mr-2"></i>
          <TbMessageChatbot />
        </button>
      </div>
    </div>
  );
};
//   return (
//     <div className="bg-gray-900 h-full p-4 flex flex-col">
//       {/* 部屋名などのタイトル */}
//       <h1 className="text-white mb-2 text-xl">Room1</h1>

//       {/* チャットログ部分 */}
//       <div className="flex-grow overflow-y-auto mb-4 space-y-4">
//         {messages.map((message, index) => (
//           <div
//             key={index}
//             className={message.sender === 'user' ? 'text-right' : 'text-left'}
//           >
//             <div
//               className={
//                 message.sender === 'user'
//                   ? 'relative max-w-sm bg-slate-700 px-4 py-2 rounded-lg'
//                   : 'relative max-w-sm bg-stone-700 px-4 py-2 rounded-lg'
//               }
//             >
//               <p className="text-white">{message.text}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* メッセージ入力行 */}
//       <div className="flex-shrink-0 relative">
//         <input
//           type="text"
//           placeholder="Send a Message"
//           className="border-2 rounded w-full pr-10 focus:outline-none p-2"
//           onChange={(e) => setInputMessage(e.target.value)}
//         />
//         <button
//           className="absolute inset-y-0 right-5 flex items-center"
//           onClick={() => sendMessage()}
//         >
//           <TbMessageChatbot />
//         </button>
//       </div>
//     </div>
//   );
// };

export default Chat;
