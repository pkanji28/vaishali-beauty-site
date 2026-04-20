FIXED ZIP

Main fixes:
- booking page layout is now consistent on mobile and desktop
- time dropdown works with your live database column names:
  booking_date
  booking_time
- booking insert uses:
  customer_name
  customer_phone
  service
  total
  booking_date
  booking_time
  status
- admin page bookings table also uses the same column names
- homepage prices section remains clickable and consistent

What you need to do:
1. extract this zip
2. keep your current js/config.js values, or replace the placeholders again
3. upload all files to GitHub
4. let Vercel redeploy
5. test book.html again
