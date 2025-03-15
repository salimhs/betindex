import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Check } from "lucide-react"

export default function BettingDashboard() {
  const [balance, setBalance] = useState(0)
  const [deposit, setDeposit] = useState("")
  const [balanceHistory, setBalanceHistory] = useState([
    { time: "00:00", amount: 0 },
    { time: "01:00", amount: 0 },
    { time: "02:00", amount: 0 },
  ])
  const [bets, setBets] = useState([
    { id: 1, name: "Team A vs Team B", odds: "+150", status: "pending", amount: 50 },
    { id: 2, name: "Player X Total Points", odds: "-110", status: "won", amount: 100 },
    { id: 3, name: "Game C Over/Under", odds: "+200", status: "lost", amount: 75 },
  ])

  // Handle deposit submission
  const handleDeposit = () => {
    const amount = Number.parseFloat(deposit)
    if (!isNaN(amount) && amount > 0) {
      setBalance((prevBalance) => prevBalance + amount)
      setDeposit("")

      // Update balance history
      const now = new Date()
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`

      setBalanceHistory((prev) => [...prev, { time: timeString, amount: prev[prev.length - 1].amount + amount }])
    }
  }

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-green-500 hover:bg-green-600"
      case "lost":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-yellow-500 hover:bg-yellow-600"
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Betting Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Deposit Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Deposit Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
              </div>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleDeposit}>Deposit</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart Component */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Balance Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
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
                    <XAxis dataKey="time" tickLine={false} axisLine={false} />
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

        {/* Bets Dashboard Component */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Check className="mr-2 h-5 w-5" />
              Your Bets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Bet</th>
                    <th className="text-left py-3 px-2">Odds</th>
                    <th className="text-left py-3 px-2">Amount</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bets.map((bet) => (
                    <tr key={bet.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">{bet.name}</td>
                      <td className="py-3 px-2">{bet.odds}</td>
                      <td className="py-3 px-2">${bet.amount}</td>
                      <td className="py-3 px-2">
                        <Badge className={getStatusColor(bet.status)}>
                          {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

