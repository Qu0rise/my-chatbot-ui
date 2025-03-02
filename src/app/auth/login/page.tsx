'use client'; //これをつけるとクライアントサイドレンダリングになる．なので別にReactでおｋだった．Next.js 13 以降（App Router）では、ファイルの先頭に use client を記述すると、そのファイルがサーバー コンポーネントではなくクライアント コンポーネントとして扱われる．page.tsx の先頭に書き足し

import { auth } from '@/app/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

type Inputs = {
  email: string;
  password: string;
};

const Login = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    await signInWithEmailAndPassword(auth, data.email, data.password)
      .then((userCredential) => {
        router.push('/');
        // console.log(user);
      })
      .catch((error) => {
        if (error.code === 'auth/invalid-credential') {
          // alert(error);
          alert('メールアドレスまたはパスワードが間違っています．');
        } else {
          alert(error.message);
        }
      });
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center ">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <h1 className="mb-4 text-2xl text-gray-700 font-medium">ログイン</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">
            Email
          </label>
          <input
            {...register('email', {
              required: 'メールアドレスは必須です．',
              pattern: {
                value:
                  /^[a-zA-Z0-9_+-]+(.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/,
                message: '不適切なメールアドレスです．',
              },
            })}
            type="text"
            className="mt-1 border-2 rounded-md w-full p-2"
          />
          {errors.email && (
            <span className="text-red-600 text-sm">
              {errors.email.message as string}
            </span>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">
            Password
          </label>
          <input
            type="password"
            {...register('password', {
              required: 'パスワードは必須です．',
              minLength: {
                value: 6,
                message: '6文字以上で入力してください．',
              },
              maxLength: {
                value: 24,
                message: '24文字以下で入力してください．',
              },
            })}
            className="mt-1 border-2 rounded-md w-full p-2"
          />
          {errors.password && (
            <span className="text-red-600 text-sm">
              {errors.password.message as string}
            </span>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit" //typeをsubmitにするとそのボタンが含まれているフォーム全体が送信（サブミット）される,というのが最も大きな特徴
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
          >
            ログイン
          </button>
        </div>
        <div className="mt-4">
          <span className="text-gray-600 text-sm">
            初めてのご利用の方はこちら 
          </span>
          <Link
            href={'/auth/register'}
            className="text-blue-500 text-sm font-bold ml-1 hover:text-blue-700"
          >
            新規登録ページへ
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
