from datetime import datetime
from settings_local import db, util
import json
from os import environ as env
from urllib.parse import quote_plus, urlencode
from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
from flask import Flask, redirect, render_template, session, url_for, jsonify, request
# from hotkey_tv.util import *

db.setup()

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)
    
app = Flask(__name__)
app.secret_key = env.get("APP_SECRET_KEY")

oauth = OAuth(app)

oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration'
)


@app.route("/login")
def login():
    print("~~ LOGIN")
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )

@app.route("/callback", methods=["GET", "POST"])
def callback():
    print("~~ CALLBACk")
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    return redirect("/")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://" + env.get("AUTH0_DOMAIN")
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home", _external=True),
                "client_id": env.get("AUTH0_CLIENT_ID"),
            },
            quote_via=quote_plus,
        )
    )


@app.route('/get_perlin', methods=['POST'])
def get_perlin():
    data = request.get_json()
    dim = data.get('dim')
    print("DIM:"+str(dim)) 
    _noise = util.generate_perlin_noise(dim,dim)
    noise = json.dumps(_noise, cls=util.NumpyEncoder)
    return jsonify({'success':True,'noise':noise}) 

@app.route('/load_all', methods=['POST'])
def load_all_trips():
    if "user" in session and session["user"] is not None:
        user_id = session["user"]["userinfo"]["email"]
    else:
        print("~~ no user")
        return redirect(url_for('home'))
    
    trips = db.get_trips_for_user(user_id)
    return jsonify({'success':True,'data':trips}) 


@app.route('/load', methods=['POST'])
def load_trip():
    if "user" in session and session["user"] is not None:
        print("~~ got user:"+session["user"]["userinfo"]["email"])
        user_id = session["user"]["userinfo"]["email"]
    else:
        print("~~ no user")
        return redirect(url_for('home'))
    
    data = request.get_json()
    trip_name = data.get('trip_name')
    trip_json = db.get_trip(user_id,trip_name)
    return jsonify({'success':True,'trip_json':trip_json}) 




@app.route('/delete', methods=['POST'])
def delete_trip():
    if "user" in session and session["user"] is not None:
        print("~~ got user:"+session["user"]["userinfo"]["email"])
        user_id = session["user"]["userinfo"]["email"]
    else:
        print("~~ no user")
        return redirect(url_for('home'))
    
    # create the user if not exists
    user = db.get_or_create_user(user_id)

    data = request.get_json()
    trip_name = data.get('trip_name')
    total_trips = db.get_total_trips(user_id)
    result = db.delete_trip(user_id,trip_name)

    return jsonify({'success':True,'total_trips':total_trips,'message': result})

@app.route('/preSaveNameCheck', methods=['POST'])
def check_name_exists():
    user_id = None
    if "user" in session and session["user"] is not None:
        print("~~ got user:"+session["user"]["userinfo"]["email"])
        user_id = session["user"]["userinfo"]["email"]
    else:
        print("~~ no user")
        return redirect(url_for('home'))
    
    # create the user if not exists
    user = db.get_or_create_user(user_id)

    data = request.get_json()
    trip_name = data.get('trip_name')
    name_exists = db.check_trip_exists(user_id,trip_name)
    user_exists = True if user_id is not None else False
    return jsonify({'success':True,'user_exists':user_exists,'name_exists': name_exists})

@app.route('/save', methods=['POST'])
def save_trip():
    if "user" in session and session["user"] is not None:
        print("~~ got user:"+session["user"]["userinfo"]["email"])
        user_id = session["user"]["userinfo"]["email"]
    else:
        print("~~ no user")
        return redirect(url_for('home'))
    
    # create the user if not exists
    user = db.get_or_create_user(user_id)

    data = request.get_json()
    trip_name = data.get('trip_name')
    trip_json = data.get('trip_json')
    
    trip_id = db.create_or_update_trip(user_id,trip_name,trip_json)
    total_trips = db.get_total_trips(user_id)
    return jsonify({'success':True,'trip_id': trip_id,'total_trips':total_trips})


@app.route('/drawfit/')
def drawfit():
    return render_template('drawfit.html')

@app.route('/examples/')
def examples():
    return render_template('examples.html')


@app.route('/')
def home():
    now = datetime.now()
    user_id = None
    user_firstname = "Guest"
    if "user" in session and session["user"] is not None:
        print("~~ got user:"+session["user"]["userinfo"]["email"])
        user_id = session["user"]["userinfo"]["email"]
        user_firstname = session["user"]["userinfo"]["given_name"]
        trips = db.get_trips_for_user(user_id)
    else:
        print("~~ no user")
        trips = "none, not logged in"


    return render_template('index.html', now=now, trips=trips, user=user_firstname)

if __name__ == '__main__':
    app.run()

@app.template_filter('parse_json')
def parse_json(value):
    return json.loads(value)


