# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for product images in your Whimsical Store application.

## 📋 Overview

Supabase Storage is used to store and serve product images instead of using base64 encoded data. This provides:
- ✅ Better performance (smaller database size)
- ✅ Faster image loading
- ✅ CDN delivery
- ✅ Scalable storage
- ✅ Image optimization options

---

## 🔧 Setup Steps

### Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard: https://zaqqpnehmeqrsmoiplcw.supabase.co
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** or **"Create bucket"**
4. Configure the bucket:
   - **Name**: `product-images` (must match exactly)
   - **Public bucket**: ✅ **Enable** (checked) - This allows public access to images
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/*` (or leave empty for all types)

5. Click **"Create bucket"**

### Step 2: Set Up Storage Policies (Row Level Security)

After creating the bucket, you need to set up policies to control access:

#### Policy 1: Allow Public Read Access
```sql
-- Allow anyone to read (view) images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

#### Policy 2: Allow Authenticated Users to Upload
```sql
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Allow Authenticated Users to Update
```sql
-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 4: Allow Authenticated Users to Delete
```sql
-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

**Note**: Since your admin page uses a simple password authentication (not Supabase Auth), you may need to use the **Service Role Key** for admin operations, or set up a more permissive policy. For development, you can temporarily use:

```sql
-- TEMPORARY: Allow all operations (for admin without Supabase Auth)
-- Remove this in production and use proper authentication
CREATE POLICY "Allow all operations"
ON storage.objects FOR ALL
USING (bucket_id = 'product-images');
```

### Step 3: Verify Environment Variables

Make sure your `.env.local` file contains:

```env
VITE_SUPABASE_URL=https://zaqqpnehmeqrsmoiplcw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphcXFwbmVobWVxcnNtb2lwbGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njc4NTIsImV4cCI6MjA4MDE0Mzg1Mn0.8NFx_l6LnV9LFMqp44l_xhYPs3vrqhSfeGvonQygaus
```

### Step 4: Test Image Upload

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Admin page
3. Try uploading an image for a product
4. Check the Supabase Storage dashboard to verify the image was uploaded

---

## 📁 Storage Structure

Images are organized in the following structure:

```
product-images/
  ├── products/
  │   ├── 1234567890-abc123.jpg
  │   ├── 1234567891-def456.png
  │   └── ...
```

Each uploaded image gets a unique filename based on timestamp and random string to prevent conflicts.

---

## 🔐 Security Considerations

### For Production:

1. **Implement Proper Authentication**: Replace the simple password authentication with Supabase Auth
2. **Restrict Upload Permissions**: Only allow authenticated admin users to upload
3. **File Validation**: The service already validates:
   - File type (must be image)
   - File size (max 5MB)
4. **Content Security**: Consider adding virus scanning for uploaded files
5. **Rate Limiting**: Implement rate limiting to prevent abuse

### Recommended Production Policy:

```sql
-- Production: Only allow authenticated admin users
CREATE POLICY "Admin users can manage images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);
```

---

## 🛠️ Troubleshooting

### Issue: "Bucket not found"
- **Solution**: Make sure the bucket name is exactly `product-images` (case-sensitive)

### Issue: "Permission denied"
- **Solution**: Check that the bucket is set to **Public** or that RLS policies are correctly configured

### Issue: "File too large"
- **Solution**: The service limits files to 5MB. Compress images before uploading or increase the limit in `storageService.js`

### Issue: "Upload fails silently"
- **Solution**: Check browser console for errors. Verify your Supabase URL and API key are correct in `.env.local`

---

## 📝 API Reference

The storage service provides these functions:

- `uploadImage(file, folder, fileName)` - Upload a single image
- `uploadMultipleImages(files, folder)` - Upload multiple images
- `deleteImage(filePath)` - Delete an image
- `deleteMultipleImages(filePaths)` - Delete multiple images
- `getImageUrl(filePath)` - Get public URL for an image

See `src/services/storageService.js` for detailed documentation.

---

## 🎯 Next Steps

1. ✅ Create the storage bucket
2. ✅ Set up RLS policies
3. ✅ Test image uploads
4. ⬜ Migrate existing base64 images to Supabase Storage (optional)
5. ⬜ Set up image optimization/transformation (optional)
6. ⬜ Implement proper admin authentication with Supabase Auth

---

## 💡 Tips

- **Image Optimization**: Consider using Supabase Image Transformation API for automatic resizing/optimization
- **Backup**: Regularly backup your storage bucket
- **Monitoring**: Monitor storage usage in the Supabase dashboard
- **CDN**: Supabase Storage automatically uses CDN for fast global delivery

