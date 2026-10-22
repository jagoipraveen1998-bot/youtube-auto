"""Run this ONCE on your laptop to connect your YouTube channel.

1. Put the client_secret.json you downloaded from Google Cloud next to this file.
2. pip install google-auth-oauthlib
3. python get_youtube_token.py
4. A browser opens - sign in with the Google account that owns the channel,
   pick the channel, and allow access.
5. Copy the three values it prints into your GitHub repository secrets.
"""
import json
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"]

secret_file = next(Path(".").glob("client_secret*.json"), None)
if not secret_file:
    raise SystemExit("Put client_secret.json (from Google Cloud > Credentials) in this folder first.")

flow = InstalledAppFlow.from_client_secrets_file(str(secret_file), SCOPES)
creds = flow.run_local_server(port=0, access_type="offline", prompt="consent")
info = json.loads(secret_file.read_text())["installed"]

print("\nAdd these as GitHub repository secrets (Settings > Secrets and variables > Actions):\n")
print(f"YT_CLIENT_ID      = {info['client_id']}")
print(f"YT_CLIENT_SECRET  = {info['client_secret']}")
print(f"YT_REFRESH_TOKEN  = {creds.refresh_token}")
print("\nKeep these private. Do not upload client_secret.json to GitHub.")
