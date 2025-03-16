"use client"
import { eventObj, getUpcomingGames } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { FC, useEffect, useState } from 'react';


export const TopBar = ({}) => {
    const { user, error, isLoading } = useUser();

    const [loadingGames, setLoading] = useState(true)
    const [upcomingGames, setGames] = useState<eventObj[]>([])
    useEffect(()=>{
        async function getGames(){
            setGames(await getUpcomingGames());
            console.log(upcomingGames)
            setLoading(false);
        }
        if(loadingGames){
            getGames();
        }
    })
  if (isLoading) return <></>;
  if (error) return <></>;

  return(
    <div className='justify-between flex flex-row items-center p-2 px-4 text-white bg-black h-32'>

        <div className='flex items-center h-full'>
            <h1 className="text-2xl font-bold">F&Duel500</h1>
        </div>
        
        <div className='px-2 flex-1 max-w-3/4'>
            <div className='container flex flex-row justify-between flex-1 py-1 px-2 bg-white rounded-md overflow-x-auto'>
            {upcomingGames.map((ev, i)=>{
                return<EventBox event={ev} key={i}></EventBox>
            })}
            </div>
        </div>

        {user && 
        <div>
                <a  href="/api/auth/login"
                            target="_blank"
                            rel="noopener noreferrer">
                    <Button className='cursor-pointer ' >Log In or Sign Up</Button>
                    </a>

        </div>}
    </div>
  )
}

export const EventBox :FC<{event: eventObj}> = ({event}) => {
    return (
        <div className="rounded-md bg-white border-black border-2 text-black p-2 flex flex-col justify-evenly overflow-auto w-60 text-left">
            
            <div>
                <div className='flex flex-row justify-between'>
                    <p className='font-bold flex-1'> {event.home.name}</p>
                    <p className='text-gray-400'>{event.home.odds}</p>
                </div>
                <div className='w-full h-1 bg-grey'></div>
                <div className='flex flex-row justify-between'>
                    <p className='font-bold flex-1'> {event.away.name}</p>
                    <p className='text-gray-400'>{event.away.odds}</p>
                </div>
            </div>
            <div className='items-center flex justify-center text-xs pt-1'>
                <p>{event.time.toLocaleTimeString("en-us", {  hour: "2-digit", minute: "2-digit" })}</p>
            </div>
        </div>
    )
}

