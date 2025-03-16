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
   # print(events_list)
    return jsonify(events_list)


@app.route('/api/invest', methods=['POST'])
def invest():
    data = request.get_json()
    auth0_id = data.get("auth0_id")
    amount = data.get("amount")
    
    if not auth0_id or not amount:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        amount = float(amount)
    except ValueError:
        return jsonify({"error": "Invalid amount"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Begin a transaction
        # Insert new investment record
        cur.execute("""
            INSERT INTO investments (auth0_id, amount, start_date, starting_balance)
            VALUES (%s, %s, NOW(), (SELECT balance FROM profiles WHERE auth0_id = %s))
            RETURNING id;
        """, (auth0_id, amount, auth0_id))
        investment_id = cur.fetchone()[0]

        # Update the user's profile: deduct investment amount from balance, and add to money_in.
        cur.execute("""
            UPDATE profiles 
            SET balance = balance - %s, money_in = money_in + %s 
            WHERE auth0_id = %s;
        """, (amount, amount, auth0_id))

        conn.commit()
        return jsonify({"investment_id": investment_id}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
