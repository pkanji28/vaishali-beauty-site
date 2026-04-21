FIXED PRODUCTION ZIP

This fixes the booking page script so services render correctly again.
Cause of issue:
- the previous build had a JavaScript syntax error in book.html
- because of that, the page script stopped running before services could render

Included:
- fixed book.html
- Hollywood Waxing (Strip) — £18
- Hollywood Waxing (Hot Wax) — £25
- homepage + booking + admin files
- same overall structure as the production build

After upload:
1. replace all files
2. put your real Supabase values back into js/config.js
3. wait for Vercel redeploy
4. hard refresh the booking page
