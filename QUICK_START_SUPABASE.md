# 🚀 Quick Start: Supabase Integration

## What You Need to Do Right Now

### 1. Install Supabase Package

```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Organization:** Your organization (or create one)
   - **Project name:** `WhimsicalShop`
   - **Database password:** Copy and save this!
   - **Region:** Choose closest to your users (Asia-Pacific recommended)
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### 3. Get Your API Keys

1. In your Supabase project dashboard
2. Go to **Settings** (gear icon) → **API**
3. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string starting with `eyJ...`)

### 4. Set Up Environment Variables

1. Create `.env.local` file in your project root
2. Add these lines:
   ```env
   VITE_SUPABASE_URL=paste-your-project-url-here
   VITE_SUPABASE_ANON_KEY=paste-your-anon-key-here
   ```
3. Replace the values with what you copied from Supabase

### 5. Run Database Migration

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for success message ✅

### 6. Create Admin User

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter your email and password (save this!)
4. Click **Create user**
5. Go back to **SQL Editor** and run:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{role}',
     '"admin"'
   )
   WHERE email = 'your-email@example.com';
   ```
   (Replace with your actual email)

### 7. Seed Initial Data (Optional)

Your migration already includes default site settings. To add products:

1. Go to **Table Editor** in Supabase dashboard
2. Click on **products** table
3. Click **Insert row** and add your products manually
   
   OR

4. Use the migration script (see `SUPABASE_MIGRATION_GUIDE.md`)

### 8. Test the Connection

1. Start your dev server:
   ```bash
   npm run dev
   ```
2. Check browser console for any errors
3. The app should now connect to Supabase!

---

## 📁 Files Created

All necessary files have been created for you:

- ✅ `src/lib/supabase.js` - Supabase client configuration
- ✅ `src/services/productService.js` - Product database operations
- ✅ `src/services/cartService.js` - Cart database operations  
- ✅ `src/services/authService.js` - Authentication functions
- ✅ `src/services/siteSettingsService.js` - Site settings operations
- ✅ `src/services/reviewService.js` - Review operations
- ✅ `src/services/orderService.js` - Order operations
- ✅ `supabase/migrations/001_initial_schema.sql` - Database schema
- ✅ `.env.example` - Environment variable template

---

## 🎯 What's Next?

1. **Read** `SUPABASE_SETUP.md` for detailed documentation
2. **Follow** `SUPABASE_MIGRATION_GUIDE.md` to migrate your existing data
3. **Update** your contexts to use the new services (we can help with this!)

---

## ⚠️ Important Notes

- **Never commit** `.env.local` to Git (it's in `.gitignore`)
- **Save your database password** - you'll need it for direct database access
- **Test in development** before deploying to production
- **Backup localStorage data** before migration

---

## 🆘 Need Help?

- Check `SUPABASE_MIGRATION_GUIDE.md` for troubleshooting
- Supabase docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

---

## ✅ Checklist

- [ ] Installed `@supabase/supabase-js`
- [ ] Created Supabase project
- [ ] Copied API keys
- [ ] Created `.env.local` with credentials
- [ ] Ran database migration SQL
- [ ] Created admin user
- [ ] Tested connection

Once all checked, you're ready to start using Supabase! 🎉

