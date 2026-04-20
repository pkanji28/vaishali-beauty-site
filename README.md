
# Vaishali's Beauty — Customer Site + Real Admin Backend

This package gives you:

- A **condensed homepage**
- A **separate booking page**
- Customer selects services and sees the **total**
- Customer picks **date** and **time**
- Booking is checked against existing bookings to avoid simple collisions
- Booking is saved to Supabase and then sent to **WhatsApp**
- Customers can leave feedback
- Vaishali can log in to an **admin page**
- Admin can:
  - view and update bookings
  - approve feedback
  - upload gallery photos

## Folder structure

```text
index.html
book.html
admin.html
css/styles.css
js/config.js
js/app.js
assets/
schema.sql
README.md
```

## Important note

This is a **real backend starter**, but you still need to add your own:

- Supabase project
- Supabase URL
- Supabase anon key
- admin email/password account
- gallery storage bucket

## A to Z setup

### 1) Create a Supabase project
Create a new project in Supabase.

### 2) Run the SQL
Open the SQL Editor and run the contents of `schema.sql`.

### 3) Create the storage bucket
In Storage, create a bucket named:

```text
gallery
```

Set it to **public**.

### 4) Create the admin user
In Authentication, create your admin email/password account.

### 5) Add your Supabase keys
Open:

```text
js/config.js
```

Replace:

```js
window.SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL_HERE";
window.SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";
```

with your real values.

### 6) Upload to GitHub
Upload all files to your repository root.

### 7) Deploy to Vercel
Import the repo into Vercel and deploy.

## How booking works

Customer flow:

1. Open homepage
2. Tap **Book Now**
3. On `book.html`, choose services
4. Total updates instantly
5. Pick date
6. Existing bookings for that date are removed from the time dropdown
7. Booking is inserted into the `bookings` table
8. WhatsApp opens with the booking details prefilled

## How collision checking works

The booking page checks the `bookings` table for the same date and hides times already booked with:

- `pending`
- `confirmed`

There is also a unique partial index in the database so duplicate active bookings cannot be created for the same date/time slot.

## Feedback flow

Customer submits feedback on `book.html`.
It is stored with `approved = false`.

Admin can approve it on `admin.html`.
Approved feedback appears on the public booking page.

## Gallery flow

Admin uploads a photo on `admin.html`.
The file goes into the `gallery` storage bucket.
A record is stored in `gallery_images`.
The gallery preview loads from those saved URLs.

## Notifications

You asked for **day-before notifications to Vaishali**.

That is best added in the next step using either:

- Supabase Edge Functions + scheduled job
- or a server-side cron on Vercel/another backend

This package does **not** send reminders yet. It prepares the booking system first.

## Recommended next step after this works

Add:

- day-before WhatsApp or email reminders
- blocked days / holidays
- manual availability editor
- image gallery on the public homepage
