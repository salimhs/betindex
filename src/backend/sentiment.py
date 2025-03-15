#!/usr/bin/env python3
# sourcery skip: remove-duplicate-dict-key
import re
import math
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# ---------------------------
# 1. Custom Sentiment Analyzer
# ---------------------------
# Enhanced Sentiment Lexicon for Sports
sentiment_lexicon = {
    # Basic positive words
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
    
    # Basic negative words
    "bad": -1.0,
    "terrible": -2.5,
    "awful": -3.0,
    "negative": -1.0,
    "unfortunate": -1.5,
    "inferior": -1.5,
    "sad": -1.5,
    "angry": -2.0,
    "hate": -2.0,
    "defeat": -2.5,
    "disappointing": -2.0,
    "mediocre": -0.5,
    "underperformed": -2.0,
    "declined": -1.5,
    "ruined": -2.5,
    
    # Outcome and performance terms
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
    
    # Descriptive terms
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
    
    # Movement and momentum
    "soared": 2.0,
    "plummeted": -2.5,
    "rising": 1.5,
    "falling": -1.5,
    "racing": 1.0,
    
    # Miscellaneous sports terms
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

# A refined set of negation words (unchanged from before)
negation_words = {
    "not", "no", "never", "none", "nobody", "nothing", "neither", "nor",
    "nowhere", "hardly", "scarcely", "barely", "dont", "doesnt", "didnt",
    "isnt", "arent", "wasnt", "werent", "cannot", "cant", "couldnt", "shouldnt", "wont"
}

def preprocess_text(text):
    """Convert text to lowercase and remove punctuation."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text

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
    """Map a raw sentiment difference to a probability between 0 and 1."""
    return 1 / (1 + math.exp(-x))

# ---------------------------
# 2. Web Scraping for Full Articles
# ---------------------------
def scrape_team_articles(team_name, url):

    articles = []
    try:
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            print(f"Error scraping {url}: HTTP {response.status_code}")
            return articles
        soup = BeautifulSoup(response.text, 'html.parser')
        # Look for all anchor tags with an href attribute
        for a in soup.find_all('a', href=True):
            link_text = a.get_text(strip=True)
            if team_name.lower() in link_text.lower():
                # Build full URL if necessary
                link = urljoin(url, a['href'])
                try:
                    art_resp = requests.get(link, timeout=5)
                    if art_resp.status_code != 200:
                        continue
                    art_soup = BeautifulSoup(art_resp.text, 'html.parser')
                    # Extract text from all paragraph tags
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
    """
    Loop through a list of URLs to scrape full articles for a given team.
    
    Returns:
        list: Aggregated article texts from all sites.
    """
    all_articles = []
    for url in urls:
        print(f"Scraping {url} for '{team_name}' articles...")
        articles = scrape_team_articles(team_name, url)
        all_articles.extend(articles)
    return all_articles

# ---------------------------
# 3. Sports Betting Decision Process (with Scraped Articles)
# ---------------------------
def main():
    print("Sports Betting Sentiment Analysis with Full Article Scraping\n")

    # Get team names from the user.
    home_team = input("Enter the home team name: ").strip()
    away_team = input("Enter the away team name: ").strip()

    # Define a list of sports news websites (covering a wide range of sports)
    news_urls = [
        "https://www.espn.com/",
        "https://www.cbssports.com/",
        "https://www.si.com/",
        "https://www.foxsports.com/",
        "https://sports.yahoo.com/",
        "https://www.nbc.com/sports",
        "https://www.theathletic.com/",
        "https://www.skysports.com/",
        "https://www.bbc.com/sport",
        "https://www.sportingnews.com/",
        "https://www.bleacherreport.com/",
        "https://www.eurosport.com/",
        "https://www.sbnation.com/",
        "https://www.goal.com/",
        "https://www.90min.com/",
        "https://www.nfl.com/",
        "https://www.nba.com/",
        "https://www.mlb.com/",
        "https://www.nhl.com/",
        "https://www.cricbuzz.com/",
        "https://www.formula1.com/",
        "https://www.motorsport.com/",
        "https://www.sportinglife.com/",
        "https://www.rugbyworld.com/",
        "https://www.worldrugby.org/",
        "https://www.tsn.ca/"
    ]


    # Scrape full articles for each team.
    print("\nScraping articles for the home team...")
    home_articles = scrape_all_team_articles(home_team, news_urls)
    print("\nScraping articles for the away team...")
    away_articles = scrape_all_team_articles(away_team, news_urls)

    # Exit if no articles were found.
    if not home_articles:
        print(f"No articles found for '{home_team}'. Exiting.")
        return
    if not away_articles:
        print(f"No articles found for '{away_team}'. Exiting.")
        return

    # Compute sentiment scores for the full articles.
    home_scores = [analyze_sentiment(article) for article in home_articles]
    away_scores = [analyze_sentiment(article) for article in away_articles]

    avg_home_sentiment = sum(home_scores) / len(home_scores)
    avg_away_sentiment = sum(away_scores) / len(away_scores)

    _extracted_from_main_36(
        "\nHome Team Articles (Excerpted):",
        home_articles,
        "Average Home Sentiment Score:",
        avg_home_sentiment,
    )
    _extracted_from_main_36(
        "\nAway Team Articles (Excerpted):",
        away_articles,
        "Average Away Sentiment Score:",
        avg_away_sentiment,
    )
    # Compute the sentiment difference.
    sentiment_diff = avg_home_sentiment - avg_away_sentiment
    print("\nSentiment Difference (Home - Away):", sentiment_diff)

    # Map the sentiment difference to a predicted probability of a home win.
    alpha = 0.5  # Scaling factor (adjust based on historical calibration).
    predicted_prob = sigmoid(alpha * sentiment_diff)
    print("Predicted Probability of Home Win (from sentiment):", round(predicted_prob, 3))

    # ---------------------------
    # Betting Decision Logic
    # ---------------------------
    try:
        odds_input = input("\nEnter the bookmaker's decimal odds for a home team win (e.g., 2.0): ")
        home_odds = float(odds_input)
    except ValueError:
        print("Invalid input. Using default odds of 2.0.")
        home_odds = 2.0

    implied_prob = 1.0 / home_odds
    print("Implied Probability from Odds:", round(implied_prob, 3))

    threshold = 0.05  # Minimum margin difference to consider a bet favorable.
    if predicted_prob - implied_prob > threshold:
        print("\nAsymmetric opportunity detected!")
        print("Sentiment-based probability is significantly higher than the implied probability.")
    else:
        print("\nNo significant asymmetry in the odds detected. Betting may not be favorable.")

    # Calculate optimal bet size using the Kelly Criterion.
    kelly_fraction = ((home_odds - 1) * predicted_prob - (1 - predicted_prob)) / (home_odds - 1)
    kelly_fraction = max(kelly_fraction, 0)
    bankroll = 1000  # Example bankroll (in dollars).
    bet_amount = bankroll * kelly_fraction

    print("\nKelly Criterion Analysis:")
    print("Kelly Fraction:", round(kelly_fraction, 3))
    print(f"Recommended Bet Amount: ${bet_amount:.2f}")


# TODO Rename this here and in `main`
def _extracted_from_main_36(arg0, arg1, arg2, arg3):
    print(arg0)
    for article in arg1[:3]:  # Show up to 3 for brevity
        print(" -", f"{article[:150]}...")
    print(arg2, arg3)

if __name__ == "__main__":
    main()
