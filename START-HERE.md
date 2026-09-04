# Get your Prospects app live & synced across iPhone + iPad

Everything is already built. You'll do about 15 minutes of clicking — no coding.
When you're done you'll have a real web-app link that:
- Syncs every prospect and change across all your devices instantly
- Never loses data on reload
- Can be added to your home screen like a real app
- Has no "allow to save" popups

There are 3 free accounts to create: **GitHub** (stores the code), **Supabase**
(the synced database), and **Vercel** (puts it online). Do them in order.

---

## STEP 1 — Put the code on GitHub (5 min)

1. Go to **github.com** and sign up / log in (free).
2. Click the **+** (top right) -> **New repository**.
3. Name it `prospects`, leave it Public or Private, click **Create repository**.
4. On the next page click **"uploading an existing file"**.
5. Drag in **every file and folder** from this project folder
   (the whole `prospect-app` contents: `src`, `api`, `public`, `index.html`,
   `package.json`, `vite.config.js`, etc. — but you can skip `node_modules` if present).
6. Click **Commit changes**.

---

## STEP 2 — Create the synced database on Supabase (4 min)

1. Go to **supabase.com** -> **Start your project** -> sign in with GitHub.
2. Click **New project**. Give it any name, set a database password (save it),
   pick the closest region, click **Create new project**. Wait ~1 min.
3. In the left menu click **SQL Editor** -> **New query**.
4. Open the file **`supabase-setup.sql`** from this project, copy everything,
   paste it in, and click **Run**. (This makes the table the app syncs through.)
5. In the left menu click **Project Settings** (gear) -> **API**.
   Keep this tab open — you'll copy two values in Step 3:
   - **Project URL**
   - **anon public** key

---

## STEP 3 — Put it online with Vercel (5 min)

1. Go to **vercel.com** -> **Sign up** with GitHub.
2. Click **Add New… -> Project**, find your `prospects` repo, click **Import**.
3. Before deploying, expand **Environment Variables** and add these three
   (names must match exactly):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | the Project URL from Supabase |
   | `VITE_SUPABASE_ANON_KEY` | the anon public key from Supabase |
   | `ANTHROPIC_API_KEY` | your key from console.anthropic.com |

   (For the Anthropic key: go to **console.anthropic.com -> API Keys ->
   Create Key**, copy it. This powers the auto-fill and match features.)

4. Click **Deploy**. Wait ~1 minute.
5. Vercel gives you a link like `https://prospects-xxxx.vercel.app`.
   **That's your app.** Open it on your iPhone and iPad — same data on both.

---

## STEP 4 — Add it to your home screen (30 sec, optional)

On iPhone/iPad: open the link in Safari -> tap the **Share** icon ->
**Add to Home Screen**. Now it opens like a real app, full screen.

---

## That's it.

Add a prospect on your iPad, and it appears on your iPhone. Nothing ever
disappears. If the app ever shows "saving: local only" at the top, it means the
Supabase env vars weren't picked up — double-check Step 3's variable names in
Vercel (Settings -> Environment Variables) and click Redeploy.

Any snag, tell me exactly which step and what you saw, and I'll get you unstuck.
