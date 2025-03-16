"use client"
import { confirmDbAccount, eventObj, getProfile, getUpcomingGames, userDetails } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';


export const TopBar = ({}) => {
    const { user, error, isLoading } = useUser();

    const [loadingGames, setGamesLoading] = useState(true)
    const [upcomingGames, setGames] = useState<eventObj[]>([])
    const [userDetails, setDetails] = useState<userDetails|null>();
    const [userLoading, setUserLoading] = useState<boolean>(true);

    async function createDbAccount(){
        if(!user || !user.sub || !user.nickname){
            return;
        }
        await confirmDbAccount(user.sub, user.nickname)
        setUserLoading(false);
    }
    useEffect(()=>{
        async function getGames(){
            setGames(await getUpcomingGames());
            console.log(upcomingGames)
            setGamesLoading(false);
        }
        async function setUserDetails(){
            if(!user || !user.sub){
                return
            }
            setDetails (await getProfile(user.sub));
            setUserLoading(false);
        }
        if(loadingGames){
            getGames();
        }
        if(userLoading){
            setUserDetails();
        }
    }, [loadingGames, user, upcomingGames, userLoading])
  if (isLoading) return <></>;
  if (error) return <></>;

  return(
    <div className='justify-between flex flex-row items-center p-2 px-4 text-white bg-black h-[132px]'>

        <div className='flex items-center h-full'>
            <h1 className="text-2xl font-bold">F&Duel500</h1>
        </div>
        
        {!loadingGames &&
        <div className='px-2 flex-1 max-w-3/4 game-cont'>
            <div className='game-cont-inside container flex flex-row justify-between flex-1 py-2 px-2 bg-white rounded-md overflow-x-auto gap-1 border-1 '>
            {upcomingGames.map((ev, i)=>{
                return (
                <div className='min-w-60 max-w-60 h-20 max-h-20' key={i}>
                    <EventBox event={ev}></EventBox>
                </div>)
                
            })}
            </div>
        </div>}

        {!user &&
                <a  href="/api/auth/login"
                            target="_blank"
                            rel="noopener noreferrer">
                    <Button className='cursor-pointer ' >Log In or Sign Up</Button>
                    </a>
}

        {userDetails &&
        <div className='flex flex-row justify-around items-center flex-wrap w-32 rounded-md hover:bg-primary/90 py-2 cursor-pointer'>
            <Image className='rounded-md' src={userDetails.picture ? userDetails.picture : "https://trenchtownpolytechnic.edu.jm/wp-content/uploads/2022/06/person-placeholder-image.png"} 
            alt = "Your profile picture" width={40} height={40}></Image>
            <p>{`\$${userDetails.balance.toFixed(2)}`}</p>
        </div>}

        {!userDetails && user && 
            <Button onClick={createDbAccount}
            className='cursor-pointer'>Verify Account</Button>
        }
    </div>
  )
}

export const EventBox :FC<{event: eventObj}> = ({event}) => {
    return (
        <div className="rounded-md bg-white hover:bg-gray-300 border-black border-2 text-black p-2 flex flex-col justify-evenly overflow-auto text-left text-sm">
            
            <div>
                <div className='flex flex-row justify-between'>
                    <p className='font-bold flex-1 whitespace-nowrap text-ellipsis w-3/4 text-left overflow-hidden'> {event.home.name}</p>
                    <p className='text-gray-400 w-1/4 text-right'>{event.home.odds}</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p className='font-bold flex-1 whitespace-nowrap text-ellipsis w-3/4 text-left overflow-hidden'> {event.away.name}</p>
                    <p className='text-gray-400 w-1/4 text-right'>{event.away.odds}</p>
                </div>
            </div>
            <div className='items-center flex justify-center text-xs pt-1'>
                <p>{event.time.toLocaleTimeString("en-us", {  hour: "2-digit", minute: "2-digit" })}</p>
            </div>
        </div>
    )
}

