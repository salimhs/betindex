import requests
import psycopg2
from psycopg2.extras import DictCursor
from datetime import datetime, timezone

# Replace with your actual API key
THE_ODDS_API_KEY = "<YOUR_API_KEY>"

def settle_bets_with_theoddsapi():
    """
    Find all pending bets in paper_bets, fetch completed games 
    from TheOddsAPI, and settle the bets accordingly.
    """
    # 1. Fetch all pending bets
    select_sql = """
        SELECT bet_id, oddsapi_game_id, sport, home_team, away_team, event_time, chosen_team, stake, odds
        FROM paper_bets
        WHERE bet_status = 'pending'
          AND event_time < NOW()  -- only settle events in the past
        ORDER BY event_time
    """

    try:
        conn = psycopg2.connect(DB_CONN, sslmode='require')
        cur = conn.cursor(cursor_factory=DictCursor)
        cur.execute(select_sql)
        pending_bets = cur.fetchall()
        
        # Group bets by sport to minimize API calls:
        # e.g., { 'basketball_nba': [ bet1, bet2, ... ] }
        bets_by_sport = {}
        for bet in pending_bets:
            sport = bet["sport"]  # you might store "basketball_nba" in your DB
            bets_by_sport.setdefault(sport, []).append(bet)
        
        for sport_key, bets_list in bets_by_sport.items():
            # 2. Call TheOddsAPI scores endpoint for this sport
            #  (we might get games for the last 2 days, for instance)
            url = f"https://api.the-odds-api.com/v4/sports/{sport_key}/scores"
            params = {
                "apiKey": THE_ODDS_API_KEY,
                "daysFrom": 3,     # how many days back you want results
            }
            try:
                resp = requests.get(url, params=params, timeout=10)
                resp.raise_for_status()
                completed_games = resp.json()  # list of completed games
                
                # 3. Create a dict of games by their ID
                #    to quickly find them by `oddsapi_game_id`.
                #    If you don't have `oddsapi_game_id`, you'll need 
                #    to match by home_team, away_team, commence_time, etc.
                games_by_id = {game["id"]: game for game in completed_games if game["completed"] == True}
                
                # 4. For each pending bet in this sport, try to find the game result
                for bet in bets_list:
                    bet_id = bet["bet_id"]
                    game_id = bet["oddsapi_game_id"]
                    chosen_team = bet["chosen_team"]
                    stake = float(bet["stake"])
                    odds = float(bet["odds"])
                    
                    # if we have a game_id stored, try to find it:
                    if game_id in games_by_id:
                        game_data = games_by_id[game_id]
                        # figure out the winner from game_data["scores"]
                        home_team_name = game_data["home_team"]
                        away_team_name = game_data["away_team"]
                        scores = game_data.get("scores", [])
                        
                        # Example: 
                        # scores = [
                        #   {"name": "Houston Rockets", "score": "108"},
                        #   {"name": "Chicago Bulls", "score": "104"}
                        # ]
                        if len(scores) == 2:
                            score1 = scores[0]
                            score2 = scores[1]
                            # compare numeric scores
                            s1 = int(score1["score"])
                            s2 = int(score2["score"])
                            
                            # figure out who is winner
                            if s1 > s2:
                                winner = score1["name"]
                            elif s2 > s1:
                                winner = score2["name"]
                            else:
                                winner = "draw"
                            
                            # 5. Update bet status
                            if winner.lower() == chosen_team.lower():
                                # bet won
                                payout = stake * odds
                                update_sql = """
                                    UPDATE paper_bets
                                    SET bet_status = 'won',
                                        actual_payout = %s
                                    WHERE bet_id = %s
                                """
                                cur.execute(update_sql, (payout, bet_id))
                                print(f"Bet {bet_id} on {chosen_team} WON. Payout = {payout:.2f}")
                            else:
                                # bet lost (or draw => lost, depending on your logic)
                                update_sql = """
                                    UPDATE paper_bets
                                    SET bet_status = 'lost',
                                        actual_payout = 0
                                    WHERE bet_id = %s
                                """
                                cur.execute(update_sql, (bet_id,))
                                print(f"Bet {bet_id} on {chosen_team} LOST.")
                        else:
                            # no valid scores
                            print(f"Bet {bet_id}: can't parse final scores for {game_id}")
                    else:
                        # If you don't have a game_id, or can't find this game 
                        # in the result, you might fallback to partial matching
                        print(f"Bet {bet_id}: no completed game found for game_id={game_id} in sport={sport_key}")
                
                # commit after processing each sport
                conn.commit()
            except Exception as e:
                print(f"Error fetching or processing TheOddsAPI for {sport_key}: {e}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error settling bets: {e}")
