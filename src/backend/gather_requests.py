import requests
from dotenv import load_dotenv
import os
from datetime import datetime
import psycopg2
import pytz
load_dotenv()
APIKEY = os.getenv('API_KEY')
SPORT = "upcoming"
MARKETS = "h2h"
ODDS_FORMAT = "decimal"
DATE_FORMAT = "iso"
DB_CONN = os.getenv('DATABASE_URL')
now_utc = datetime.now(pytz.utc)
hour_utc = now_utc.hour


if 22 <= hour_utc or hour_utc < 5:
    best_region = "us" 
elif 17 <= hour_utc < 22:
    best_region = "eu" 
elif 5 <= hour_utc < 12:
    best_region = "au"
else:
    best_region = "us"

def cur_region():
    return best_region


# Execute the query to list all tables in the public schema
def fetch_h2h():
    conn = psycopg2.connect(DB_CONN, sslmode='require')
    cur = conn.cursor()
    odds_response = requests.get(
        f"https://api.the-odds-api.com/v4/sports/{SPORT}/odds",
        params={
            "api_key": APIKEY,
            "regions": best_region,
            "markets": MARKETS,
            "oddsFormat": ODDS_FORMAT,
            "dateFormat": DATE_FORMAT,
        },
    )
    if odds_response.status_code != 200:
        print(f"Error fetching odds: {odds_response.status_code}, {odds_response.text}")
    else:
        odds_json = odds_response.json()
        for event in odds_json:
            best_odds = {}  # Track the best odds for each team
            best_bookmaker = {}  # Track which bookmaker offers the best odds
            sport_name = event.get("sport_title", "Unknown Sport")  # Get sport name from API
            event_time = event["commence_time"]

            for bookmaker in event["bookmakers"]:
                for market in bookmaker["markets"]:
                    if market["key"] == "h2h":  # Ensure it's a head-to-head market
                        for outcome in market["outcomes"]:
                            team = outcome["name"]
                            price = outcome["price"]

                            # Update best odds if this bookmaker offers better odds
                            if team not in best_odds or price > best_odds[team]:
                                best_odds[team] = price
                                best_bookmaker[team] = bookmaker["title"]

            # Extract team names and odds
            home_team = event["home_team"]
            away_team = event["away_team"]
            home_team_odds = best_odds.get(home_team, None)
            away_team_odds = best_odds.get(away_team, None)
            home_team_bookmaker = best_bookmaker.get(home_team, "Unknown Bookmaker")
            away_team_bookmaker = best_bookmaker.get(away_team, "Unknown Bookmaker")

            # Insert into NeonDB
            cur.execute(
                """
                INSERT INTO events (sport, home_team, away_team, home_team_odds, away_team_odds, event_time, home_team_bookmaker, away_team_bookmaker)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    sport_name,
                    home_team,
                    away_team,
                    home_team_odds,
                    away_team_odds,
                    event_time,
                    home_team_bookmaker,
                    away_team_bookmaker,
                ),
            )

        # Commit and close
        conn.commit()
        cur.close()
        conn.close()

fetch_h2h()


