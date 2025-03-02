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

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ストリーミング中に画面へ逐次表示するためのパーシャル応答
  const [partialBotResponse, setPartialBotResponse] = useState<string>('');

  const scrollDiv = useRef<HTMLDivElement>(null);

  // ルームが変更されたときにメッセージを取得
  useEffect(() => {
    if (selectedRoom) {
      const fetchMessages = async () => {
        const roomDocRef = doc(db, 'rooms', selectedRoom);
        const messageCollectionRef = collection(roomDocRef, 'messages');

        const q = query(messageCollectionRef, orderBy('createdAt'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newMessages = snapshot.docs.map((doc) => doc.data() as Message);
          setMessages(newMessages);
        });

        return () => {
          unsubscribe();
        };
      };

      fetchMessages();
    }
  }, [selectedRoom]);

  // メッセージ追加時に自動スクロール
  useEffect(() => {
    if (scrollDiv.current) {
      const element = scrollDiv.current;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // ◆ ストリーム付きでメッセージを送信
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const roomDocRef = doc(db, 'rooms', selectedRoom!);
    const messagesCollectionRef = collection(roomDocRef, 'messages');

    // 1) Firestoreにユーザー送信文を保存
    const messageData = {
      text: inputMessage,
      sender: 'user',
      createdAt: serverTimestamp(),
    };
    await addDoc(messagesCollectionRef, messageData);

    // 2) 過去メッセージ最後のN個を準備
    const lastNMessages: MyCompletionMessage[] = messages.slice(-5).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));
    lastNMessages.push({ role: 'user', content: inputMessage });

    // 3) 入力欄・ローディング・パーシャル初期化
    setInputMessage('');
    setIsLoading(true);
    setPartialBotResponse('');

    // 4) OpenAI へストリーミングリクエスト
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: lastNMessages,
      stream: true,  // ★ストリームON★
    });

    // 5) chunkを受け取りながらpartialテキストを画面に表示
    let finalText = '';
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        finalText += content;
        setPartialBotResponse((prev) => prev + content);
      }
    }

    setIsLoading(false);

    // 6) 最終的なbotレスポンスをFirestoreに保存
    await addDoc(messagesCollectionRef, {
      text: finalText,
      sender: 'bot',
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="bg-gray-900 h-full p-4 flex flex-col">
      <h1 className="text-white mb-2 text-lg">{selectedRoomName}</h1>

      {/* メッセージ表示エリア */}
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

        {/* ストリーミング中のパーシャル応答表示 */}
        {isLoading && partialBotResponse && (
          <div className="text-left">
            <div className="bg-stone-700 inline-block rounded px-4 py-2 mb-2">
              <p className="text-white">{partialBotResponse}</p>
            </div>
          </div>
        )}

        {/* ローディングアイコン (最後までの受信が完了していない場合) */}
        {isLoading && !partialBotResponse && (
          <div className="text-center">
            <LoadingIcons.SpinningCircles />
          </div>
        )}
      </div>

      {/* 入力欄 & 送信ボタン */}
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

export default Chat;
