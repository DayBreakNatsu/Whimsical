# Supabase Migration Guide

## 🚀 Step-by-Step Migration Process

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 2: Set Up Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project named "WhimsicalShop"
3. Wait for the project to initialize (takes a few minutes)
4. Go to **Settings > API** and copy:
   - Project URL
   - anon/public key

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

### Step 4: Run Database Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL script
5. Verify tables were created in **Table Editor**

### Step 5: Set Up Admin User

1. Go to **Authentication > Users** in Supabase dashboard
2. Create a new user with your admin email
3. Go to **SQL Editor** and run:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
     raw_user_meta_data,
     '{role}',
     '"admin"'
   )
   WHERE email = 'your-admin-email@example.com';
   ```

### Step 6: Migrate Existing Data

#### Option A: Manual Migration Script

Create a migration script to move data from localStorage to Supabase:

```javascript
// scripts/migrate-to-supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function migrateData() {
  // Get localStorage data
  const stored = localStorage.getItem('whimsical-site-content-v1')
  const content = JSON.parse(stored || '{}')
  
  // Migrate products
  if (content.products) {
    for (const product of content.products) {
      const { error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          gallery: product.gallery || [],
          category: product.category,
          is_new: product.isNew || false,
          stock: product.stock || 0,
        })
      
      if (error) console.error('Error migrating product:', error)
    }
  }
  
  // Migrate site settings
  if (content.hero) {
    await supabase.from('site_settings').upsert({
      key: 'hero',
      value: content.hero,
    })
  }
  
  // ... migrate other settings
}

migrateData()
```

#### Option B: Use Admin Panel

You can also manually add products through the Supabase dashboard or create an import script.

### Step 7: Update Your Application Code

Now you need to update your contexts to use Supabase instead of localStorage:

1. **Products Context** - Use `productService.js`
2. **Cart Context** - Use `cartService.js` (with localStorage fallback for guests)
3. **Site Content Context** - Use `siteSettingsService.js`
4. **Reviews** - Use `reviewService.js`

### Step 8: Test Everything

1. Test product loading
2. Test adding to cart (both guest and authenticated)
3. Test admin functions
4. Test reviews
5. Test site settings

### Step 9: Deploy

1. Make sure environment variables are set in your hosting platform
2. Deploy your application
3. Verify everything works in production

---

## 📝 Migration Checklist

- [ ] Install Supabase client
- [ ] Create Supabase project
- [ ] Set environment variables
- [ ] Run database migration SQL
- [ ] Create admin user
- [ ] Migrate products data
- [ ] Migrate site settings
- [ ] Update ProductContext to use Supabase
- [ ] Update CartContext to use Supabase (with localStorage fallback)
- [ ] Update SiteContentContext to use Supabase
- [ ] Test all functionality
- [ ] Deploy

---

## 🔄 Backward Compatibility

To ensure smooth migration, we'll keep localStorage as a fallback:
- Products: Try Supabase first, fallback to localStorage
- Cart: Use localStorage for guests, Supabase for logged-in users
- Site settings: Cache in localStorage for offline support

---

## 🆘 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution:** Make sure `.env.local` exists and has correct values

### Issue: "Row Level Security policy violation"
**Solution:** Check RLS policies in Supabase dashboard. Ensure admin user has correct role.

### Issue: "Products not loading"
**Solution:** 
1. Check Supabase dashboard to verify products exist
2. Check browser console for errors
3. Verify RLS policies allow public read access

### Issue: "Can't insert products as admin"
**Solution:** Make sure your user metadata has `role: 'admin'` set

---

## 📚 Next Steps After Migration

1. **Set up authentication UI** - Login/signup pages
2. **Add real-time subscriptions** - Live product updates
3. **Implement order management** - Order history page
4. **Add image storage** - Use Supabase Storage for product images
5. **Set up email notifications** - Order confirmations via Supabase Functions

