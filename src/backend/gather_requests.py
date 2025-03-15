import requests
from dotenv import load_dotenv
import os
from datetime import datetime
import pytz
load_dotenv()
APIKEY = os.getenv('API_KEY')
SPORT = "upcoming"
MARKETS = "h2h"
ODDS_FORMAT = "decimal"
DATE_FORMAT = "iso"

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

print(best_region)