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
import React, { useEffect, useState } from 'react';
import { TbMessageChatbot } from 'react-icons/tb';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import OpenAI from 'openai';

type Message = {
  text: string;
  sender: string;
  createdAt: Timestamp;
};

const Chat = () => {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
    dangerouslyAllowBrowser: true,
  });

  const { selectedRoom } = useAppContext();
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

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
  }, [selectedRoom]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageData = {
      text: inputMessage,
      sender: 'user',
      createdAt: serverTimestamp(),
    };

    //messageをfirestoreに保存
    const roomDocRef = doc(db, 'rooms', 'selectedRoom');
    const messageCollectionRef = collection(roomDocRef, 'messages');
    await addDoc(messageCollectionRef, messageData);

    //OpenAIからの返信

    const gpt3Response = await openai.chat.completions.create({
      // messages: [{ role: "user", content: prompt }],
      messages: [{ role: 'user', content: inputMessage }],
      model: 'gpt-3.5-turbo',
    });
    console.log(gpt3Response);
  };
  return (
    <div className="bg-gray-900 h-full p-4 flex flex-col">
      {/* 部屋名などのタイトル */}
      <h1 className="text-white mb-2 text-xl">Room1</h1>

      {/* チャットログ部分 */}
      <div className="flex-grow overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.sender === 'user' ? 'text-right' : 'text-left'}
          >
            <div
              className={
                message.sender === 'user'
                  ? 'relative max-w-sm bg-slate-700 px-4 py-2 rounded-lg'
                  : 'relative max-w-sm bg-stone-700 px-4 py-2 rounded-lg'
              }
            >
              <p className="text-white">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* メッセージ入力行 */}
      <div className="flex-shrink-0 relative">
        <input
          type="text"
          placeholder="Send a Message"
          className="border-2 rounded w-full pr-10 focus:outline-none p-2"
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button
          className="absolute inset-y-0 right-5 flex items-center"
          onClick={() => sendMessage()}
        >
          <TbMessageChatbot />
        </button>
      </div>
    </div>
  );
};

export default Chat;
