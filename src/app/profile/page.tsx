import { ProfilePage } from "@/comps/profile";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: "Your F&Duel500 Profile",
    description: "Your F&Duel500 Profile",
  };

export default async function Page(){

    return (
        <ProfilePage></ProfilePage>
    )
}