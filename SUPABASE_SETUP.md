# Supabase Integration Guide for Whimsical Store

## 📋 Overview

This guide will help you integrate Supabase database into your Whimsical Store application. We'll replace localStorage with a proper database solution for:
- Products management
- User authentication
- Cart persistence (user-specific)
- Orders management
- Reviews/Testimonials
- Site content configuration

---

## 🗄️ Database Schema Design

### 1. **products** table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  gallery JSONB DEFAULT '[]',
  category TEXT NOT NULL,
  is_new BOOLEAN DEFAULT false,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. **product_reviews** table
```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. **carts** table (for authenticated users)
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### 4. **orders** table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. **site_settings** table
```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. **newsletter_subscriptions** table
```sql
CREATE TABLE newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

---

## 🔧 Setup Steps

### Step 1: Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Step 2: Create Environment Variables
Create `.env.local` file:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Run SQL Migrations
Execute the SQL schema above in your Supabase SQL Editor.

### Step 4: Set Up Row Level Security (RLS)
We'll configure RLS policies for data security.

---

## 📦 What Will Be Migrated

### Current localStorage Data → Supabase Tables

1. **Products** (`localStorage: products array`)
   - ✅ Move to `products` table
   - ✅ Product images in `image` and `gallery` columns

2. **Site Content** (`localStorage: hero, about, socials, general`)
   - ✅ Move to `site_settings` table with JSON values

3. **Reviews** (`localStorage: product.reviews array`)
   - ✅ Move to `product_reviews` table

4. **Cart** (`localStorage: cart items`)
   - ✅ Move to `carts` table (for logged-in users)
   - ✅ Keep localStorage as fallback for guests

5. **Orders** (new)
   - ✅ Create in `orders` table

---

## 🔐 Authentication Setup

Supabase provides built-in authentication:
- Email/Password
- OAuth providers (Google, Facebook, etc.)
- Magic links
- Social login

---

## 📝 Next Steps

1. **Install Supabase client library**
2. **Set up configuration files**
3. **Create database service layer**
4. **Migrate existing data**
5. **Update contexts to use Supabase**
6. **Add authentication**

---

## 🎯 Benefits of Supabase Integration

✅ **Real-time updates** - Products sync across devices
✅ **User authentication** - Secure login system
✅ **Scalability** - Handle growing product catalog
✅ **Security** - Row-level security policies
✅ **Orders management** - Proper order tracking
✅ **Multi-device cart** - Sync cart across devices
✅ **Admin dashboard** - Better admin capabilities
✅ **Analytics** - Track orders and sales

---

## ⚠️ Important Notes

1. **Backup localStorage data** before migration
2. **Test thoroughly** before deploying
3. **Keep localStorage as fallback** for offline support
4. **Implement caching** for better performance
5. **Use Supabase Storage** for product images (optional)

