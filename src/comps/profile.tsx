"use client"
import { getOldInvestments, getPortfolio, getProfile, getUserInvestments, investment, portfolio, userDetails } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import { FC, useEffect, useState } from "react";
import RingLoader from "react-spinners/RingLoader";
export const  ProfilePage:FC = () => {

    const {user, error, isLoading} = useUser();
    const [userLoading, setUserLoading] = useState(true)

    const [portfolio, setPortfolio] = useState<portfolio | null>()
    const [oldInvestments, setOldInvestments] = useState<investment[]>([])
    const [currInvestments, setCurrInvestments] = useState<investment[]>([])

    const [userDetails, setDetails] = useState<userDetails | null>()
    useEffect(()=>{
        async function loadAccount(){
            if(!user){
    
                return;
            }
            if(!user.sub || !user.nickname){
                return;
            }
            setPortfolio(await getPortfolio(user.sub))
            setDetails(await getProfile(user.sub))
            const oldInvs = await getOldInvestments(user.sub)
            const ongoingInvs = await getUserInvestments(user.sub, true);
            setCurrInvestments(ongoingInvs)
            setOldInvestments(oldInvs)

            console.log('say what')
        }
        if(userLoading){
            if(isLoading){
                return;
            }
            loadAccount();
            setUserLoading(false);
        }
    }, [setUserLoading, user, userLoading, isLoading, userDetails])
    return(
        <div className="container m-auto p-4 max-w-6xl">
        {userLoading &&
        <div className="flex flex-col gap-4 justify-evenly m-auto items-center">
            <RingLoader></RingLoader>
            <p className="text-md text-muted-foreground mb-1">
                Loading...
            </p>
        </div>
        }

        {!userLoading &&
            <>
                {!userDetails &&
                    <div className="flex-col flex justify-around items-center h-1/2 m-auto">

                        <p className="text-4xl font-bold">Uh oh! &#129344;</p>
                        
                    
                        <p className="text-xl">
                            You aren&apos;t registered with us. You&apos;re missing out on a lot. Sign up today and join the F&Duel500 fund.
                        </p>
                        <a  href="/api/auth/login"
                            target="_blank"
                            rel="noopener noreferrer">
                        <Button size="lg" className='cursor-pointer text-2xl py-7' >Log In or Sign Up</Button>
                        </a>
                    </div>
                }

                {userDetails && portfolio &&
                <ProfileComponent details={userDetails} portfolio={portfolio} oldInvestments={oldInvestments} currInvestments={currInvestments}></ProfileComponent>
                }



            </>
        }
    </div>
    )

}

const ProfileComponent:FC<{details: userDetails, portfolio: portfolio, oldInvestments: investment[], currInvestments: investment[]}> = ({details, portfolio, oldInvestments, currInvestments}) => {

    return (

    <div className="flex flex-row justify-around h-full flex-wrap gap-4">
        <div className="flex flex-col  h-full justify-around gap-2">
            {/* info */}
                <Image className='rounded-md' src={details.picture ? details.picture : "https://trenchtownpolytechnic.edu.jm/wp-content/uploads/2022/06/person-placeholder-image.png"} 
                    alt = "Your profile picture" width={300} height={300}></Image>

                    <div className="flex flex-col justify-evenly ">
                        <p className="text-4xl font-bold">{details.nickname}</p>
                        <div className="flex flex-row justify-evenly items-center ">
                            <div className="flex flex-col w-full">
                               
                                <p className="text-2xl"> <b>Balance:</b> </p>
                                {/* tofixed bugging */}
                                <p className="text-2xl"> ${details.balance}</p>
                                <p className="text-2xl"> <b>Money in now:</b></p>
                                <p className="text-2xl">${details.moneyIn}</p>
                            </div>

                            <p className="text-4xl">&#128184;</p>

                        </div>
            </div>

            <a  href="/api/auth/logout"
                target="_blank"
                rel="noopener noreferrer" className="m-auto">
                <Button size="lg" className='cursor-pointer text-xl ' >Sign Out</Button>
            </a>

        </div>

        <div className="flex flex-col h-full justify-around gap-2 flex-1 px-4">
            <div className="flex flex-row justify-evenly">
                <div className="flex flex-col justify-between">
                    <p className="text-xl">Overall Performance: </p>
                    <span className="flex justify-start gap-1 text-4xl">
                        {portfolio.growth >= 0 && <p className="text-4xl">&#x1F7E2;</p>}
                        {portfolio.growth < 0 && <p className="text-4xl">&#128315;</p>}
                        <p className="font-bold"> {portfolio.growth}%</p>
                    </span>
                </div>

                <div className="flex flex-col justify-between">
                    <p className="text-xl">Total Input: </p>
                    <span className="flex justify-start gap-1 text-4xl">
                        <p className="font-bold"> ${portfolio.input.toFixed(2)}</p>
                    </span>
                </div>
            </div>

        <div className="w-full">
        <CurrentInvestmentTable investments={currInvestments}></CurrentInvestmentTable>
        <InvestmentHistory investments={oldInvestments}></InvestmentHistory>

        </div>
            


        </div>
    </div>)
}

const InvestmentHistory:FC<{investments: investment[]}> = ({investments}) => {
    console.log(investments)
    const sortedInvs = investments.sort((a, b) => {
      //  const now = new Date().getTime();
        const aTime = new Date(a.startDate).getTime();
        const bTime = new Date(b.startDate).getTime();

        return bTime - aTime;
      }); 
    return (
        <Card className="mx-auto bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm md:col-span-3 px-4 max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center m-auto text-2xl font-bold">
          Investment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {sortedInvs.length > 0 && 

            <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2">Start Date</th>
                <th className="text-left py-3 px-2">Balance</th>
                <th className="text-left py-3 px-2">End Date</th>
                <th className="text-left py-3 px-2">Returned</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvs.map((inv, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2">${inv.amount}</td>
                  <td className="py-3 px-2">{inv.startDate.toLocaleTimeString("en-ca")}</td>
                  <td className="py-3 px-2">${inv.starting}</td>
                  <td className="py-3 px-2">{inv.endDate.toLocaleTimeString("en-ca")}</td>
                  <td className="py-3 px-2">${inv.return}</td>
                </tr>
              ))}
            </tbody>
          </table>}

          {sortedInvs.length < 1&& 
            <p> No investments have been made yet.</p>
          }
        </div>
      </CardContent>
    </Card>
    )
}

const CurrentInvestmentTable:FC<{investments: investment[]}> = ({investments}) => {
    console.log(investments)
    const sortedInvs = investments.sort((a, b) => {
      //  const now = new Date().getTime();
        const aTime = new Date(a.startDate).getTime();
        const bTime = new Date(b.startDate).getTime();

        return bTime - aTime;
      }); 
    return (
        <Card className="mx-auto bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm md:col-span-3 px-4 max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center m-auto text-2xl font-bold">
          Current Investments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {sortedInvs.length > 0 && 

            <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2">Start Date</th>
                <th className="text-left py-3 px-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvs.map((inv, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2">${inv.amount}</td>
                  <td className="py-3 px-2">{inv.startDate.toLocaleTimeString("en-ca")}</td>
                  <td className="py-3 px-2">${inv.starting}</td>
                </tr>
              ))}
            </tbody>
          </table>}

          {sortedInvs.length < 1 && 
            <p> No current investments to show.</p>
          }
        </div>
      </CardContent>
    </Card>
    )
}