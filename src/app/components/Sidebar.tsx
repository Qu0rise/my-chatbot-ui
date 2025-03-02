'use client';

import React, { useEffect, useState } from 'react';
import { RiLogoutBoxLine } from 'react-icons/ri';
import { db } from '../firebase';
import {
  Timestamp,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import { CgSelectR } from 'react-icons/cg';

type Room = {
  id: string;
  name: string;
  createdAt: Timestamp;
};

const Sidebar = () => {
  const { user, userId, setSelectedRoom } = useAppContext();
  // console.log(userId);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (user) {
      const fetchRooms = async () => {
        const roomCollectionRef = collection(db, 'rooms');
        const q = query(
          roomCollectionRef,
          where('userid', '==', userId),
          // where('userid', '==', 'hoge'),
          orderBy('createdAt')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newRooms: Room[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            createdAt: doc.data().createdAt,
          }));
          setRooms(newRooms);
          // console.log(newRooms);
        });
      };
      fetchRooms();
    }
  }, [userId]); // 依存関係にuserIdを含めると読み込みなおしたときも取得可能になる

  const selectRoom = (roomId: string) => {
    setSelectedRoom(roomId);
    // console.log(roomId);
  };

  return (
    <div className="bg-custom-black h-full overflow-y-auto px-5 flex flex-col">
      <div className="flex-grow">
        <div className="cursor-pointer flex justify-evenly items-center border mt-2 rounded-xl hover:bg-stone-700 duration-150 ">
          <span className="text-slate-100 p-4 text-2xl">＋</span>
          <h1 className="text-slate-100 text-lg font-semibold p-4">New Chat</h1>
        </div>
        <ul>
          {rooms.map((room) => (
            <li
              key={room.id}
              className="cursor-pointer border-b p-4 text-slate-100 hover:bg-stone-700 duration-150"
              onClick={() => selectRoom(room.id)}
            >
              {room.name}
            </li>
          ))}
          {/* <li className="cursor-pointer border-b p-4 text-slate-100 hover:bg-stone-700 duration-150">
            Room1
          </li>
          <li className="cursor-pointer border-b p-4 text-slate-100 hover:bg-stone-700 duration-150">
            Room2
          </li>
          <li className="cursor-pointer border-b p-4 text-slate-100 hover:bg-stone-700 duration-150">
            Room3
          </li>
          <li className="cursor-pointer border-b p-4 text-slate-100 hover:bg-stone-700 duration-150">
            Room
          </li> */}
        </ul>
      </div>

      <div className="mb-2 cursor-pointer p-4 text-slate-100 hover:bg-stone-700 duration-150 flex items-center justify-evenly">
        <RiLogoutBoxLine />
        <span>ログアウト</span>
      </div>
    </div>
  );
};

export default Sidebar;
