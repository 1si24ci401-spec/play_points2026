# Admin Account Setup Guide

## Automatic Admin Account

The email **`hydrabus45@gmail.com`** with password **`Abcd1234@@@#`** is configured as an automatic admin account.

### How It Works

1. **Sign Up**: When you create an account with this email, you automatically get admin role
2. **Login**: When you log in with this email, you are redirected directly to the Admin Dashboard
3. **Google OAuth**: If you use Google OAuth with this email, you get admin access

## Creating the Admin Account

### Option 1: Email/Password Sign Up
1. Go to the app
2. Click "Get Started" → "Sign up"
3. Fill in:
   - Full Name: Any name
   - Username: Any username
   - Email: `hydrabus45@gmail.com`
   - Password: `Abcd1234@@@#`
4. Click "Create Account"
5. You'll be automatically logged in and redirected to `/admin`

### Option 2: Google OAuth (if configured)
1. Go to the app
2. Click "Get Started" → "Sign up" or "Sign in"
3. Click "Continue with Google"
4. Sign in with the Google account linked to `hydrabus45@gmail.com`
5. You'll be automatically assigned admin role and redirected to `/admin`

## New Features Added

### 1. ✅ Fixed Logout Button
- Logout now properly clears session
- Redirects to landing page after logout
- Error handling added

### 2. ✅ Profile Settings Page
- New profile icon button in sidebar (User icon)
- Shows account information:
  - Full Name
  - Username
  - Email
  - Account Type (User/Admin)
- Accessible at `/profile`

### 3. ✅ Seasonal Welcome Offers Page
- New gift icon button in sidebar
- Beautiful offers page with:
  - Welcome Bonus (20% OFF)
  - Premium Bundle deals
  - Flash Sales
  - Loyalty Rewards
  - How to use offers instructions
- Accessible at `/offers`

### 4. ✅ Admin Auto-Detection
- Email `hydrabus45@gmail.com` automatically gets admin role on:
  - Sign up
  - Login
  - OAuth login
- Admin users are redirected to `/admin` instead of `/products` on login

### 5. ✅ Improved Google OAuth
- Better OAuth flow handling
- Automatic profile creation for OAuth users
- Proper redirect after OAuth callback
- Role assignment for OAuth users
- Clear error messages if OAuth is not configured

## Navigation Updates

The sidebar footer now includes (from top to bottom):
1. **Gift Icon** → Seasonal Offers (`/offers`)
2. **User Icon** → Profile Settings (`/profile`)
3. **Settings Icon** → Admin Dashboard (`/admin`) - Only for admins
4. **Logout Icon** → Sign out
5. **Avatar** → User profile picture

## Testing Admin Features

1. **Create Admin Account**:
   ```
   Email: hydrabus45@gmail.com
   Password: Abcd1234@@@#
   ```

2. **Verify Admin Access**:
   - After login, you should be on `/admin`
   - Settings icon should be visible in sidebar
   - You can access all three admin tabs:
     - Products (create/view products)
     - Coupons (create/manage coupons)
     - Orders (view/manage all orders)

3. **Test Regular User**:
   - Sign out
   - Create new account with different email
   - Verify Settings icon is NOT visible
   - Verify redirect goes to `/products` instead of `/admin`

4. **Test Profile Page**:
   - Click User icon in sidebar
   - Verify your profile information displays correctly
   - Admin users should see "Account Type: Admin"

5. **Test Offers Page**:
   - Click Gift icon in sidebar
   - Browse the seasonal offers
   - Try the coupon codes in checkout

## Important Notes

- The admin email is hardcoded in the backend for security
- Only this specific email gets automatic admin privileges
- Other users remain as regular users unless manually upgraded in the database
- Google OAuth requires additional Supabase configuration (see setup docs)

## Google OAuth Setup (Optional)

To enable Google OAuth:

1. Go to Supabase Dashboard
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Follow: https://supabase.com/docs/guides/auth/social-login/auth-google
5. Add authorized redirect URIs:
   - `{YOUR_APP_URL}/login`
   - `{YOUR_APP_URL}/signup`
6. The "Continue with Google" button will work automatically

## Troubleshooting

### "Google sign in is not configured" message
- Google OAuth needs to be set up in Supabase dashboard
- Follow the setup guide linked in the error message
- This is normal if OAuth hasn't been configured yet

### Can't access admin dashboard
- Make sure you're using the exact email: `hydrabus45@gmail.com`
- Check that you logged in successfully
- Try logging out and back in

### Profile page shows wrong information
- Refresh the page
- Try logging out and back in
- Check browser console for errors

## Security Notes

⚠️ **Important**: In a production environment:
- Never hardcode admin credentials
- Use environment variables
- Implement proper role management
- Add 2FA for admin accounts
- Use strong, unique passwords

This demo implementation uses hardcoded credentials for easy testing and demonstration purposes only.
