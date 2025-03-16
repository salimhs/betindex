import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { confirmDbAccount, getProfile, userInvest} from "@/app/actions"

export default function BettingDashboard() {
  const [balance, setBalance] = useState(0);
  const [deposit, setDeposit] = useState("");
  const [balanceHistory, setBalanceHistory] = useState([
    { time: "00:00", amount: 0 },
    { time: "01:00", amount: 0 },
    { time: "02:00", amount: 0 },
  ]);

  const initialBalance = 1000;
  const profitPercentage = ((balance - initialBalance) / initialBalance) * 100;

  //const [verifiedCheck, setVerified] = useState(false)
  const { user, error, isLoading } = useUser();

  const [betMsg, setBetMsg] = useState("")
  // Handle deposit submission
  const handleDeposit = async () => {
    setBetMsg("");
    if(!user || !user.sub || !user.nickname || !user.picture){
      console.log("lol nah");
      return;
    }
    // Ensure user is registered in the database
    const quickProf = await getProfile(user.sub);
    if (!quickProf) {
      await confirmDbAccount(user.sub, user.nickname, user.picture);
    }
    const amount = Number.parseFloat(deposit)
    const betResult = await userInvest(user.sub, amount)
    if(!betResult){
      setBetMsg("Something went wrong.");
      return;
    }
    if (!isNaN(amount) && amount > 0) {
      try {
        // Call the invest endpoint to update the DB.
        const investmentId = await invest(user.sub, amount);
        console.log("Investment successful, ID:", investmentId);
        // Update local state on success.
        setBalance((prevBalance) => prevBalance + amount);
        setDeposit("");
        // Update balance history with the current time.
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
        setBalanceHistory((prev) => [
          ...prev,
          { time: timeString, amount: prev[prev.length - 1].amount + amount },
        ]);
      } catch (err) {
        console.error("Error processing deposit:", err);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Betting Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Deposit Component */}
        {user && !isLoading && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Deposit Funds
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                {/* <p className="text-2xl font-bold">${balance.toFixed(2)}</p> */}
                <p className="text-2xl font-bold">${balance}</p>

              </div>
              <div className="flex gap-2 flex-col">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="flex-1"
                />
                <Button disabled={!(Number.parseFloat(deposit)>=10)} onClick={handleDeposit}>Deposit</Button>
              </div>


              <p>{betMsg}</p>
              {/* Profit Percentage Indicator */}
              <div className="mt-10">
                <p className="text-xl text-muted-foreground mb-1">Return</p>
                <p
                  className={`text-3xl font-semibold ${
                    profitPercentage >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {profitPercentage >= 0 ? "+" : ""}
                  {profitPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>}

        {/* Not Signed in */}
        {!user && !isLoading && (
          <Card>
            <CardHeader></CardHeader>
            <CardContent className="h-[350px] flex flex-col justify-between">
              <div className="m-auto space">
                <div className="flex gap-2 flex-col">
                  <p className="text-2xl font-bold">Not so fast!</p>
                  <p className="text-md text-muted-foreground mb-1">
                    Want to make money with the big dogs? Make an account to deposit money into the F&Duel500 fund.
                  </p>
                </div>
              </div>
              <div className="mx-auto flex justify-center">
                <a href="/api/auth/login" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="cursor-pointer text-2xl py-7">
                    Log In or Sign Up
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line Chart Component */}
        <Card className="md:col-span-2 flex-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Balance Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <div className="h-full">
              <ChartContainer
                config={{
                  balance: {
                    label: "Balance",
                    color: "hsl(var(--chart-1))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} padding={{ left: 20, right: 20 }} />
                    <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-balance)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
