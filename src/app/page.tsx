'use client';

import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
// import { useAppContext } from './context/AppContext';

export default function Home() {
  // const { user } = useAppContext();

  return (
    <div className="flex h-screen justify-center items-center">
      <div className="h-full flex" style={{ width: '1280px' }}>
        <div className="w-1/5 h-full border-r bg-red-200">
          <Sidebar />
        </div>
        <div className="w-4/5 h-full bg-zinc-700 ">
          <Chat />
        </div>
      </div>
    </div>
  );
}
