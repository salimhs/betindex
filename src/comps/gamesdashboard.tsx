import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Check } from "lucide-react"


export default function GamesDashboard() {

    const [bets, setBets] = useState([
        { id: 1, name: "Team A vs Team B", odds: "+150", status: "pending", amount: 50 },
        { id: 2, name: "Player X Total Points", odds: "-110", status: "won", amount: 100 },
        { id: 3, name: "Game C Over/Under", odds: "+200", status: "lost", amount: 75 },
      ])
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
    )
}