"use server"

import { neon } from "@neondatabase/serverless";
import { env } from "../env.mjs"

const sql = neon(env.DATABASE_URL)

export interface userDetails{
    nickname: string, 
    balance: string,
    moneyIn: number,
    picture: string
}

export interface investment{
    amount: number, 
    startDate: Date, 
    endDate: Date | null, 
    return: number | null, 
    starting: number
}

export interface portfolio{
    input: number,
    growth: number
}

export async function getProfile(auth: string) : Promise<userDetails|null>{
    //gets profile details using the Auth0 id from Auth0's UserProvider
    const res = await sql`select * from profiles where "auth0_id" = ${auth}`
    if(res.length < 1){
        console.log("Sorry, no profile exists with these credentials.");
        return null;
    }
    console.log(res);
    return {nickname: res[0].nickname,  balance: res[0].balance, moneyIn: res[0].money_in, picture: res[0].picture};
}

export async function createProfile(auth: string, nickname:string, picture:string){
    //creates profile on Neon Postgres DB, using the Auth0 id from Auth0's UserProvider
    await sql`insert into profiles ("auth0_id", "nickname", "profile", "picture") values (${auth}, ${nickname}, ${picture})`;
}

export async function getUserInvestments(auth: string, ongoing?: boolean) : Promise<investment[]>{
    let res = [];
    if(ongoing){
        res = await sql`select * from investments where "end_date" is NULL and "auth0_id" = ${auth}`
    }
    else{
        res = await sql`select * from investments where "auth0_id" = ${auth}`
    }
    const investmentArr : investment[] = [];
    res.forEach((inv)=>{
        investmentArr.push({
            amount: inv.amount as number,
            startDate: inv.start_date as Date,
            endDate: inv.end_date,
            return: inv.return,
            starting: inv.starting_balance as number,
        })
    })
    return investmentArr;
}

export async function getPortfolio(auth: string) : Promise<portfolio> {
    const res = await sql`select * from portfolios where "auth0_id" = ${auth}`
    return {
        input: res[0].input,
        growth: res[0].growth
    }
}