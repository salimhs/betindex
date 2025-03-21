"use server"

import { neon } from "@neondatabase/serverless";
import { env } from "../env.mjs"

const sql = neon(env.DATABASE_URL)

export interface userDetails{
    nickname: string, 
    balance: number,
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

export interface eventTeam{
    bookmaker: string,
    odds: number,
    name: string
}
export interface eventObj{
    home: eventTeam,
    away: eventTeam,
    time: Date
}
export async function getProfile(auth: string): Promise<userDetails|null> {
    const res = await sql`select * from profiles where "auth0_id" = ${auth}`;
    if(res.length < 1){
        console.log("Sorry, no profile exists with these credentials.");
        return null;
    }
    return {
        nickname: res[0].nickname,
        balance: Number(res[0].balance),  // Convert to a number
        moneyIn: res[0].money_in,
        picture: res[0].picture
    };
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

export async function getUpcomingGames() : Promise<eventObj[]>{
//     const data = await sql`SELECT * FROM events 
// WHERE event_time > NOW()
// ORDER BY event_time limit 10;`
const data = await sql`select * from events limit 10;`

    const eventArr : eventObj[] = [];
    data.forEach((ev)=>{
        eventArr.push({
            home: {
                bookmaker: ev.home_team_bookmaker,
                odds: ev.home_team_odds,
                name: ev.home_team
            },
            away: {
                bookmaker: ev.away_team_bookmaker,
                odds: ev.away_team_odds,
                name: ev.away_team
            },
            time: ev.event_time
        })
    })
    return eventArr;
}

export async function confirmDbAccount(auth: string, nickname: string, picture: string){
    await sql`insert into profiles ("auth0_id", "nickname", "picture") values (${auth}, ${nickname}, ${picture})`
}

export async function getOldInvestments(auth:string) : Promise<investment[]>{
    const res = await sql`select * from investments where "end_date" is not NULL and "auth0_id" = ${auth}`


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

export async function userInvest(auth: string, amount: number) : Promise<boolean>{
    const res = await sql`select * from profiles where "balance" - ${amount} > 0 and "auth0_id" = ${auth}`
    if(res.length < 1){
        return false;
    }
    await sql`insert into investments ("auth0_id", "amount", "starting_balance") select ${auth}, ${amount}, "balance" 
    from profiles
    where "auth0_id"=${auth}`
    return true;
}

export async function pullout (auth: string) {
    //let data = await sql`select sum(amount) from investments where "auth0_id" = ${auth} and "end_date" is null`
    let data = await sql`select money_in from profiles where "auth0_id" = ${auth} and "end_date" is null`

    const totalAmount = data[0].sum
    //10000 hardcoded for the growth of the fund
    await sql`update investments set "result" = (( 10000 / ${totalAmount}) * "amount") where "auth0_id" = ${auth} and "end_date" is null`
    await sql`update investments set "end_date" = NOW() where "end_date" is null`

     data = await sql`select sum(return) from investments where "auth0_id" = ${auth} and "end_date" is null`
     const profit = data[0].sum
    await sql`update profiles set "balance" = "balance" + ${profit} where "auth0_id" = ${auth}`

    data = await sql`select(sum(return) / sum(amount) ) * 100 as res from investments where "auth0_id" =  ${auth}`
    await sql`update portfolios set "growth" = ${data[0].res} "auth0_id" = ${auth} `

    data = await sql`select sum(amount) from investments where "auth0_id" =  ${auth}`
    const totalInput = data[0].sum
     await sql`update portfolios set input = ${totalInput} where portfolios."auth0_id" = ${auth}`

}