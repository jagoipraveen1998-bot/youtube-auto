# YouTube Auto News

Makes a 7–10 minute news video every morning and uploads it to your YouTube
channel. Runs free on GitHub Actions — your laptop can be off.

**Every day at 6:50 AM IST:**

1. Collects fresh headlines from the RSS feeds in `config.yaml`
2. Gemini (free) picks the top stories and writes the narration, title, tags and thumbnail text
3. edge-tts (free) reads it out in an Indian English or Tamil voice, with subtitles
4. Pexels (free) supplies stock footage for each story
5. ffmpeg builds the 1080p video with headline banners, subtitles, intro and outro
6. Uploads to YouTube with description, chapters, sources and custom thumbnail
7. Saves the used stories to `data/history.json` so no story repeats

---

## One-time setup (about 30 minutes)

### 1. Put this project on GitHub
1. Sign in to your new GitHub account → **New repository** → name it `youtube-auto` → choose **Private** → Create.
2. On the empty repo page click **uploading an existing file**, drag in **everything inside this folder**
   (including the `.github` folder), then **Commit changes**.

### 2. Get a free Gemini API key
[aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key** → copy it.

### 3. Get a free Pexels API key
[pexels.com/api](https://www.pexels.com/api/) → sign up → **Your API Key** → copy it.
(Optional — without it, stories use title cards instead of video footage.)

### 4. Connect your YouTube channel (Google Cloud)
1. Go to [console.cloud.google.com](https://console.cloud.google.com), sign in with the Google
   account that owns the channel, and create a project called `youtube-auto`.
2. **APIs & Services → Library** → search **YouTube Data API v3** → **Enable**.
3. **OAuth consent screen** (also called *Google Auth Platform*): choose **External**, fill the
   app name and your email, and add your own email under **Test users**.
4. Under **Audience / Publishing status** click **Publish app** → *In production*.
   **Important:** if it stays in *Testing*, the login expires every 7 days and uploads stop.
   You'll see an "unverified app" warning when you sign in — that's fine for your own channel.
5. **Credentials → Create credentials → OAuth client ID** → type **Desktop app** → Create →
   **Download JSON**. Rename it `client_secret.json` and put it in this folder on your laptop
   (it is ignored by git — never upload it).
6. On your laptop, in this folder:
   ```
   pip install google-auth-oauthlib
   python get_youtube_token.py
   ```
   Sign in, choose your channel, click **Advanced → Go to youtube-auto (unsafe)** → **Allow**.
   It prints `YT_CLIENT_ID`, `YT_CLIENT_SECRET` and `YT_REFRESH_TOKEN`.

### 5. Add the secrets to GitHub
Repo → **Settings → Secrets and variables → Actions → New repository secret**. Add five:

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | from step 2 |
| `PEXELS_API_KEY` | from step 3 |
| `YT_CLIENT_ID` | printed in step 4 |
| `YT_CLIENT_SECRET` | printed in step 4 |
| `YT_REFRESH_TOKEN` | printed in step 4 |

### 6. Test it
Repo → **Actions** tab → **Daily YouTube video** → **Run workflow**:
1. `sample` — 1-minute test video, no AI, no upload. Download it from the run page (**Artifacts**).
2. `no-upload` — a real news video, not uploaded. Watch it and check the script.
3. `full` — makes and uploads. It appears in YouTube Studio as **Private**.

After that it runs by itself every morning.

---

## Going public
- New Google API projects can only upload **private** videos until YouTube approves them.
  Apply with the [YouTube API audit form](https://support.google.com/youtube/contact/yt_api_form)
  (describe it as "uploading my own channel's daily news videos"). After approval, set
  `privacy: "public"` in `config.yaml`.
- Until then you can make each video public by hand in YouTube Studio.
- Custom thumbnails need a phone-verified channel: [youtube.com/verify](https://www.youtube.com/verify).

## Changing things (edit `config.yaml` on GitHub)
| Want to… | Change |
|---|---|
| Rename the channel on screen | `channel.name` |
| Switch to Tamil | `channel.language: "ta"` and `voice.name: "ta-IN-ValluvarNeural"` |
| Change the topic (tech, markets, Tamil Nadu…) | `channel.topic` and `news.feeds` |
| Longer / shorter videos | `video.stories`, `video.words_per_story` |
| Add background music | put `music.mp3` in `assets/` (YouTube Audio Library, no-attribution tracks) |
| Change upload time | the `cron` line in `.github/workflows/daily-video.yml` (UTC time) |

## Good to know
- **Cost:** ₹0. GitHub gives private repos 2,000 free Action minutes/month; one video takes ~15–20 min.
- **Quota:** one upload uses ~1,700 of YouTube's 10,000 free daily API units.
- **Monetization:** YouTube rejects channels that look mass-produced. Narration is written fresh
  each day and every video lists its sources, but adding your own angle (a short opinion,
  a local focus, your own clips) improves your chances. Watch the first few videos before going public.
- **If a run fails:** Actions tab → open the red run → read the last lines. Most common causes:
  a renamed Gemini model (update `ai.gemini_model`) or an expired YouTube token (repeat step 4.6).
