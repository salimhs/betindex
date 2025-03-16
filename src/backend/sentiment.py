#!/usr/bin/env python3
import os, re, math, requests, psycopg2, concurrent.futures
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import sys
from psycopg2.extras import DictCursor
from dotenv import load_dotenv
from datetime import datetime, timezone
import pytz

load_dotenv()
DB_CONN = os.getenv('DATABASE_URL')

bankroll=1000

def get_events_from_db():
    try:
        conn = psycopg2.connect(DB_CONN, sslmode='require')
        cur = conn.cursor(cursor_factory=DictCursor)  # Use DictCursor to get rows as dictionaries
        cur.execute("""
            SELECT sport, home_team, away_team, home_team_odds, away_team_odds,
                   event_time, home_team_bookmaker, away_team_bookmaker
            FROM events
        """)
        events = cur.fetchall()
        cur.close()
        conn.close()
        # Return events as a list of dictionaries
        events= [dict(event) for event in events]
        now = datetime.now(timezone.utc)  # Get current UTC time

        valid_events = []
        for event in events:
            event_time = event["event_time"]

            # Convert naive timestamps to UTC-aware
            if event_time.tzinfo is None:
                event_time = event_time.replace(tzinfo=timezone.utc)

            # Keep only future events with valid odds
            if event_time > now and event["home_team_odds"] is not None and event["away_team_odds"] is not None:
                event["event_time"] = event_time  # Store converted timestamp
                valid_events.append(event)

        return valid_events

    except Exception as e:
        print(f"Error fetching events from DB: {e}")
        return []
def decide_bets(events, bankroll, threshold=1.5):
    num_bets = len(events)
    if num_bets == 0:
        return []

    base_bet = bankroll / num_bets  # Evenly distribute bankroll

    bets = []
    total_bet = 0

    for event in events:
        home_odds = event["home_team_odds"]
        away_odds = event["away_team_odds"]

        if abs(home_odds - away_odds) >= threshold:
            bet_team = event["home_team"] if home_odds > away_odds else event["away_team"]
            bet_amount = base_bet * 0.83  # Reduce bet size for underdog
        else:
            bet_team = event["home_team"] if home_odds < away_odds else event["away_team"]
            bet_amount = base_bet * 1.2  # Increase bet size for favorite

        bets.append({"team": bet_team, "amount": bet_amount})
        total_bet += bet_amount

    return bets
    

def main():
    events = get_events_from_db()

    print(decide_bets(events,bankroll))

if __name__ == "__main__":
    sys.exit(main())

'''
sentiment_lexicon = {
    "good": 1.0,
    "great": 2.0,
    "excellent": 3.0,
    "positive": 1.0,
    "fortunate": 1.5,
    "superior": 1.5,
    "happy": 1.5,
    "joy": 2.0,
    "love": 2.0,
    "successful": 2.0,
    "efficient": 1.5,
    "improved": 1.5,
    "enhanced": 1.5,
    "boost": 1.5,
    "bad": -1.0,
    "terrible": -2.5,
    "awful": -3.0,
    "negative": -1.0,
    "unfortunate": -1.5,
    "inferior": -1.5,
    "sad": -1.5,
    "angry": -2.0,
    "hate": -2.0,
    "disappointing": -2.0,
    "mediocre": -0.5,
    "underperformed": -2.0,
    "declined": -1.5,
    "ruined": -2.5,
    "win": 2.0,
    "victory": 2.5,
    "defeat": -2.5,
    "conquered": 2.5,
    "dominated": 2.5,
    "clutch": 2.0,
    "heroic": 2.5,
    "unstoppable": 2.5,
    "rallied": 1.5,
    "excelled": 2.0,
    "faltering": -1.5,
    "struggling": -1.5,
    "resilient": 1.5,
    "dominant": 2.0,
    "impressive": 2.0,
    "spectacular": 3.0,
    "thrilling": 2.0,
    "incredible": 2.5,
    "phenomenal": 3.0,
    "unimpressive": -1.5,
    "pathetic": -2.0,
    "embarrassing": -2.5,
    "disastrous": -3.0,
    "soared": 2.0,
    "plummeted": -2.5,
    "rising": 1.5,
    "falling": -1.5,
    "racing": 1.0,
    "dominance": 2.0,
    "momentum": 1.5,
    "strategy": 0.5,
    "tactics": 0.5,
    "pressured": -1.0,
    "clamped": -0.5,
    "outplayed": -1.5,
    "unleashed": 1.5,
    "compromised": -1.5,
    "disintegrated": -3.0,
    "overwhelmed": -1.5,
}
negation_words = {"not", "no", "never", "none", "nobody", "nothing", "neither", "nor", "nowhere", "hardly", "scarcely", "barely", "dont", "doesnt", "didnt", "isnt", "arent", "wasnt", "werent", "cannot", "cant", "couldnt", "shouldnt", "wont"}

def preprocess_text(text):
    text = text.lower()
    return re.sub(r'[^\w\s]', '', text)

def analyze_sentiment(text):
    text = preprocess_text(text)
    words = text.split()
    total_score = 0
    skip_next = False
    for i, word in enumerate(words):
        if skip_next:
            skip_next = False
            continue
        if word in negation_words and i + 1 < len(words):
            next_word = words[i + 1]
            if next_word in sentiment_lexicon:
                total_score -= sentiment_lexicon[next_word]
                skip_next = True
            continue
        total_score += sentiment_lexicon.get(word, 0)
    return total_score

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

def scrape_team_articles(team_name, url):
    articles = []
    try:
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            print(f"Error scraping {url}: HTTP {response.status_code}")
            return articles
        soup = BeautifulSoup(response.text, 'html.parser')
        for a in soup.find_all('a', href=True):
            link_text = a.get_text(strip=True)
            if team_name.lower() in link_text.lower():
                link = urljoin(url, a['href'])
                try:
                    art_resp = requests.get(link, timeout=5)
                    if art_resp.status_code != 200:
                        continue
                    art_soup = BeautifulSoup(art_resp.text, 'html.parser')
                    paragraphs = [p.get_text(strip=True) for p in art_soup.find_all('p')]
                    if full_text := " ".join(paragraphs):
                        articles.append(full_text)
                except Exception as e:
                    print(f"Error fetching article from {link}: {e}")
                    continue
        return articles
    except Exception as e:
        print(f"Exception occurred while scraping {url}: {e}")
        return articles

def scrape_all_team_articles(team_name, urls):
    all_articles = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(scrape_team_articles, team_name, url) for url in urls]
        for future in concurrent.futures.as_completed(futures):
            try:
                articles = future.result()
                all_articles.extend(articles)
            except Exception as e:
                print(f"Error in scraping thread: {e}")
    return all_articles

def get_events_from_db():
    try:
        conn = psycopg2.connect(DB_CONN, sslmode='require')
        cur = conn.cursor()
        cur.execute("""
            SELECT sport, home_team, away_team, home_team_odds, away_team_odds,
                   event_time, home_team_bookmaker, away_team_bookmaker
            FROM events
        """)
        events = cur.fetchall()
        cur.close()
        conn.close()
        return events
    except Exception as e:
        print(f"Error fetching events from DB: {e}")
        return []

def update_event_sentiment(event, home_sentiment, away_sentiment, sentiment_diff, predicted_prob, kelly_fraction, bet_amount):
    sport, home_team, away_team, _, _, event_time, _, _ = event
    try:
        conn = psycopg2.connect(DB_CONN, sslmode='require')
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO predictions (
                sport, home_team, away_team, event_time, 
                home_sentiment, away_sentiment, sentiment_diff, 
                predicted_prob, kelly_fraction, recommended_bet_amount
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (sport, home_team, away_team, event_time, 
            home_sentiment, away_sentiment, sentiment_diff, 
            predicted_prob, kelly_fraction, bet_amount))

        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print("Error updating event:", e)
        return False

news_urls = [
    "https://www.espn.com/", "https://www.cbssports.com/", "https://www.si.com/",
    "https://www.foxsports.com/", "https://sports.yahoo.com/", "https://www.nbc.com/sports",
    "https://www.theathletic.com/", "https://www.skysports.com/", "https://www.bbc.com/sport",
    "https://www.sportingnews.com/", "https://www.bleacherreport.com/", "https://www.eurosport.com/",
    "https://www.sbnation.com/", "https://www.goal.com/", "https://www.90min.com/", "https://www.nfl.com/",
    "https://www.nba.com/", "https://www.mlb.com/", "https://www.nhl.com/", "https://www.cricbuzz.com/",
    "https://www.formula1.com/", "https://www.motorsport.com/", "https://www.sportinglife.com/",
    "https://www.rugbyworld.com/", "https://www.worldrugby.org/", "https://www.tsn.ca/"
]
alpha = 0.5
threshold = 0.05
bankroll = 1000

def process_event(event):
    sport, home_team, away_team, home_odds, away_odds, event_time, home_bookmaker, away_bookmaker = event
    lines = [
        f"Processing Event: {sport} - {home_team} vs {away_team} at {event_time}",
        f"Odds: {home_team} = {home_odds}, {away_team} = {away_odds}",
        f"Bookmakers: {home_team} from {home_bookmaker}, {away_team} from {away_bookmaker}",
    ]
    
    home_articles = scrape_all_team_articles(home_team, news_urls)
    away_articles = scrape_all_team_articles(away_team, news_urls)
    
    if not home_articles or not away_articles:
        # If no articles are found, we set the sentiment to neutral and bet very conservatively.
        lines.append(f"Articles not found for one or both teams. Placing a conservative bet.")
        avg_home_sentiment = 0.0
        avg_away_sentiment = 0.0
        sentiment_diff = avg_home_sentiment - avg_away_sentiment
        predicted_prob = sigmoid(alpha * sentiment_diff)
        kelly_fraction = 0.05  # Very conservative Kelly fraction
        bet_amount = bankroll * kelly_fraction
        lines.append(f"Kelly Fraction (Conservative): {kelly_fraction:.3f}")
        lines.append(f"Recommended Bet Amount: ${bet_amount:.2f}")
    else:
        home_scores = [analyze_sentiment(article) for article in home_articles]
        away_scores = [analyze_sentiment(article) for article in away_articles]
        avg_home_sentiment = sum(home_scores) / len(home_scores)
        avg_away_sentiment = sum(away_scores) / len(away_scores)
        sentiment_diff = avg_home_sentiment - avg_away_sentiment
        predicted_prob = sigmoid(alpha * sentiment_diff)
        
        home_odds_float = float(home_odds)
        implied_prob = 1.0 / home_odds_float
        kelly_fraction = ((home_odds_float - 1) * predicted_prob - (1 - predicted_prob)) / (home_odds_float - 1)
        kelly_fraction = max(kelly_fraction, 0)  # Avoid negative bet amounts

        # Adjust bet size based on whether asymmetry is detected or not
        if predicted_prob - implied_prob > threshold:
            lines.append("Asymmetric opportunity detected! Favorable betting conditions.")
            # You can keep the original kelly_fraction in case of asymmetry
        else:
            lines.append("No significant asymmetry in the odds detected.")
            # If no asymmetry, reduce the Kelly fraction to bet more conservatively
            kelly_fraction *= 0.5  # Reduce bet size by 50%

        bet_amount = bankroll * kelly_fraction
        lines.append(f"Kelly Fraction: {kelly_fraction:.3f}")
        lines.append(f"Recommended Bet Amount: ${bet_amount:.2f}")
    
    # Now, the bet amount will always be calculated and can be placed.
    if updated := update_event_sentiment(
        event,
        avg_home_sentiment,
        avg_away_sentiment,
        sentiment_diff,
        predicted_prob,
        kelly_fraction,
        bet_amount,
    ):
        lines.append("Database updated with sentiment analysis results.")
    else:
        lines.append("Failed to update database with sentiment results.")
    return "\n".join(lines)

def main():
    print("Sports Betting Sentiment Analysis (One Event at a Time)\n")
    events = get_events_from_db()
    if not events:
        print("No events found in the database.")
        return
    for event in events:
        report = process_event(event)
        print("\n" + "="*50)
        print(report)
        print("="*50)
'''

