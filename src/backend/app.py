from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

app = Flask(__name__)
CORS(app)

# Load environment variables from .env file
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Helper function to get a database connection
def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

# New endpoint to retrieve events data from the event table
@app.route('/api/events', methods=['GET'])
def events_route():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    # Adjust the query based on your table/schema naming.
    # If your table is "event" in the public schema:
    # cur.execute("SELECT sport, home_team, away_team FROM event;")
    # If your table is in a schema named "event" with a table named "event":
    cur.execute("SELECT sport, home_team, away_team, event_time, home_team_odds, away_team_odds FROM events;")
    events = cur.fetchall()
    cur.close()
    conn.close()
    events_list = [dict(event) for event in events]
    print(events_list)
    return jsonify(events_list)

if __name__ == '__main__':
    create_bets_table()
    app.run(debug=True, port=5000)
