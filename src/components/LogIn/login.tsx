"use client"
import { createProfile, getProfile } from '@/app/actions';
import { useUser } from '@auth0/nextjs-auth0/client';
import Image from "next/image"

export default function LogInButton(){

const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  async function displayUser(){
    if(!user || !user.sub || !user.nickname || !user.picture){
      return;
    }
    console.log(user)
    const prof = await getProfile(user.sub)
    if(!prof){
      await createProfile(user.sub, user.nickname, user.picture);
    }
    else{
      console.log(prof)
    }
  }


    return (
        <>
        {!user && 
        <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/api/auth/login"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Log In
          </a>
        }
        {user && 
        <button
        className=" cursor-pointer rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
        onClick={displayUser}
      >
        Click to display user info
      </button>
        }
        </>
    )
}