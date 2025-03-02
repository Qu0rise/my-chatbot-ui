'use client';

import React, { useEffect, useState } from 'react';
import { RiLogoutBoxLine } from 'react-icons/ri';
import { auth, db } from '../firebase';
import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';

type Room = {
  id: string;
  name: string;
  createdAt: Timestamp;
};

const Sidebar = () => {
  const { user, userId, setSelectedRoom, setSelectedRoomName } =
    useAppContext();
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
        onSnapshot(q, (snapshot) => {
          const newRooms: Room[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            createdAt: doc.data().createdAt,
          }));
          // return () => {
          // };

          setRooms(newRooms);
          // console.log(newRooms);
        });
      };
      fetchRooms();
    }
  }, [user, userId]); // 依存関係にuserIdを含めると読み込みなおしたときも取得可能になる

  const selectRoom = (roomId: string, roomName: string) => {
    setSelectedRoom(roomId);
    setSelectedRoomName(roomName);
    // console.log(roomId);
  };


  async function addNewRoom() {
    const roomName = prompt('ルーム名を入力してください');
    if (!roomName) return;
    const ref = collection(db, 'rooms');
    const sameNameQuery = query(
      ref,
      where('userid', '==', userId),
      where('name', '==', roomName),
      limit(1)
    );
    const snap = await getDocs(sameNameQuery);
    if (!snap.empty) {
      alert('このルーム名は既に使用されています。');
      return;
    }
    await addDoc(ref, {
      name: roomName,
      userid: userId,
      createdAt: serverTimestamp()
    });
  }

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="bg-custom-black h-full overflow-y-auto px-5 flex flex-col">
      <div className="flex-grow">
        <div
          onClick={addNewRoom}
          className="cursor-pointer flex justify-evenly items-center border mt-2 rounded-xl hover:bg-stone-700 duration-150 "
        >
          <span className="text-slate-100 p-4 text-2xl">＋</span>
          <h1 className="text-slate-100 text-lg font-semibold p-4">New Chat</h1>
        </div>
        <ul>
          {rooms.map((room) => (
            <li
              key={room.id}
              className="cursor-pointer border-b p-4 text-slate-100 hover:bg-stone-700 duration-150"
              onClick={() => selectRoom(room.id, room.name)}
            >
              {room.name}
            </li>
          ))}
        </ul>
      </div>

      {user && (
        <div className="mb-2 p-4 text-slate-100 text-lg font-medium">
          {user.email}
        </div>
      )}

      <div
        onClick={() => handleLogout()}
        className="mb-2 cursor-pointer p-4 text-slate-100 hover:bg-stone-700 duration-150 flex items-center justify-evenly"
      >
        <RiLogoutBoxLine />
        <span>ログアウト</span>
      </div>
    </div>
  );
};

export default Sidebar;
