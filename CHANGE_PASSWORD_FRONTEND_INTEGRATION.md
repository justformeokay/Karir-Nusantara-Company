# Change Password Frontend Integration - SettingsPage

## ✅ Status: Fully Integrated

Change password feature telah sepenuhnya terintegrasi pada halaman Settings (SettingsPage.tsx).

---

## 🎯 Implementation Summary

### File yang Dimodifikasi

#### 1. **src/api/auth.ts**
Ditambahkan/diperbarui method `changePassword`:

```typescript
// Change password (authenticated)
changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
  return api.put('/auth/change-password', { 
    old_password: oldPassword, 
    new_password: newPassword 
  })
},
```

**Key Changes:**
- Method: `PUT` (not POST)
- Parameter: `old_password` dan `new_password` (not `current_password`)
- Matches backend API exactly

#### 2. **src/pages/dashboard/SettingsPage.tsx**
Fully integrated change password form dengan:
- Password validation schema
- Form with React Hook Form
- Dialog UI for change password
- Error handling
- Logout after successful password change

**Key Features:**

**Password Validation Schema:**
```typescript
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Password baru tidak boleh sama dengan password saat ini',
  path: ['newPassword'],
})
```

**Validation Rules:**
✅ Password saat ini wajib diisi  
✅ Password baru minimal 8 karakter  
✅ Password baru harus mengandung huruf besar (A-Z)  
✅ Password baru harus mengandung huruf kecil (a-z)  
✅ Password baru harus mengandung angka (0-9)  
✅ Konfirmasi password harus cocok  
✅ Password baru tidak boleh sama dengan password saat ini  

---

## 🔄 User Flow

### Step 1: User navigates to Settings
```
Dashboard → Settings (Pengaturan)
```

### Step 2: Click "Ubah Password" button
```
Keamanan Akun card → "Ubah Password" button
```

### Step 3: Fill the change password form
```
Dialog opens with form:
- Password Saat Ini (eye icon to show/hide)
- Password Baru (eye icon to show/hide)
- Konfirmasi Password Baru (eye icon to show/hide)
```

### Step 4: Submit form
```
Validation runs:
✓ All fields required
✓ Password complexity checked
✓ Passwords match
✓ Not same as old password
```

### Step 5: Success
```
Loading state shows
API call made to backend
✓ Password updated
✓ Email confirmation sent
✓ Toast: "Password berhasil diubah! Silakan login kembali."
✓ Auto logout after 1.5 seconds
✓ Redirect to login page
```

---

## 🛡️ Security Features

### Frontend Validation
1. **Password Complexity**
   - Minimum 8 characters
   - Must contain uppercase
   - Must contain lowercase
   - Must contain number

2. **Form Validation**
   - All fields required
   - Confirm password must match new password
   - New password cannot be same as old password

3. **UI Safety**
   - Eye icons to toggle password visibility
   - Clear error messages
   - Loading state during submission
   - Button disabled while submitting

4. **Post-Success Security**
   - Clear auth tokens from localStorage
   - Force logout
   - Redirect to login
   - User must re-login with new password

### Backend Validation
- Old password verified via bcrypt
- Password hashing with bcrypt
- All refresh tokens revoked (force re-login all devices)
- Email confirmation sent

---

## 📧 What User Receives

After successful password change:

1. **Toast Notification (UI)**
   ```
   ✓ Password berhasil diubah! Silakan login kembali.
   ```

2. **Email Confirmation**
   ```
   Subject: Password Berhasil Diubah - Karir Nusantara
   
   ✓ Password Berhasil Diubah
   
   Halo [Nama User],
   
   Password akun Anda telah berhasil diubah.
   
   Untuk keamanan:
   • Semua sesi login aktif telah diakhiri
   • Anda perlu login kembali dengan password baru
   • Pastikan password Anda tersimpan dengan aman
   
   ⚠️ Jika Anda tidak melakukan perubahan ini,
   segera hubungi tim dukungan kami.
   ```

3. **Auto Logout**
   - Current session terminated
   - Redirected to login page
   - Must login with new password

---

## 🧪 Testing the Feature

### Test Scenario 1: Successful Password Change

1. Login to company dashboard
2. Navigate to Settings
3. Click "Ubah Password"
4. Fill form:
   - Current Password: (your current password)
   - New Password: NewPassword123!
   - Confirm: NewPassword123!
5. Click "Simpan"
6. ✓ Success toast appears
7. ✓ Redirected to login after 1.5s
8. ✓ Login with new password works

### Test Scenario 2: Wrong Old Password

1. Follow steps 1-4
2. Enter wrong current password
3. Click "Simpan"
4. ✗ Error toast: "Password lama tidak sesuai"
5. ✓ Still on settings page
6. ✓ Can try again

### Test Scenario 3: Weak Password

1. Follow steps 1-3
2. Enter weak password (e.g., "weak")
3. ✗ Error displayed: "Password minimal 8 karakter"
4. ✓ Button disabled
5. ✓ Form validation prevents submission

### Test Scenario 4: Password Mismatch

1. Follow steps 1-3
2. Enter:
   - Current: (valid)
   - New: Password123!
   - Confirm: Different123!
3. ✗ Error: "Password tidak cocok"
4. ✓ Button disabled
5. ✓ Cannot submit

### Test Scenario 5: Same Password

1. Follow steps 1-3
2. Enter same password in old and new
3. ✗ Error: "Password baru tidak boleh sama dengan password saat ini"
4. ✓ Cannot submit

---

## 🔌 Code Structure

### SettingsPage Component Structure

```tsx
export default function SettingsPage() {
  // State management
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Navigation and Form
  const navigate = useNavigate()
  const { register, handleSubmit, reset, formState: { errors } } = useForm(...)
  
  // Mutation
  const changePasswordMutation = useMutation({
    mutationFn: (...) => authApi.changePassword(...),
    onSuccess: (...) => { /* handle success */ },
    onError: (...) => { /* handle error */ }
  })
  
  // Components
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>...</div>
      
      {/* Security Card */}
      <Card>
        <CardHeader>...</CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>...</div>
            <Button onClick={() => setShowPasswordDialog(true)}>
              Ubah Password
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Other Settings */}
      <Card>
        {/* Notification Settings */}
      </Card>
      
      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>...</DialogHeader>
          <form onSubmit={handleSubmit(onSubmitPassword)}>
            {/* Form fields */}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

## 📱 UI Components Used

- **Card** - Container for security settings
- **Dialog** - Modal for password change form
- **Input** - Text input for password fields
- **Button** - Submit and toggle buttons
- **Label** - Field labels
- **Icon (Eye/EyeOff)** - Password visibility toggle
- **Icon (Loader2)** - Loading indicator

---

## 🔗 Related Pages/Features

- **Login Page** (`src/pages/auth/LoginPage.tsx`) - Login with new password
- **Forgot Password** (`src/pages/auth/ForgotPasswordPage.tsx`) - Password reset
- **Reset Password** (`src/pages/auth/ResetPasswordPage.tsx`) - Complete reset flow
- **Auth API** (`src/api/auth.ts`) - API integration

---

## 📊 Component Hierarchy

```
App
├── ProtectedRoute
│   └── Layout
│       └── SettingsPage
│           ├── Security Card
│           │   └── Change Password Button
│           ├── Notification Card
│           └── Change Password Dialog
│               ├── Form
│               │   ├── Current Password Input
│               │   ├── New Password Input
│               │   └── Confirm Password Input
│               └── Dialog Footer (Submit/Cancel)
```

---

## 🚀 How to Extend

### Add More Security Settings

```tsx
<Card>
  <CardHeader>
    <CardTitle>Two-Factor Authentication</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Add 2FA setup */}
  </CardContent>
</Card>
```

### Add Password Change History

```tsx
<Card>
  <CardHeader>
    <CardTitle>Password History</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Show last password changes */}
  </CardContent>
</Card>
```

### Add Session Management

```tsx
<Card>
  <CardHeader>
    <CardTitle>Active Sessions</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Show and manage active sessions */}
  </CardContent>
</Card>
```

---

## ✨ Key Implementation Details

### Password Visibility Toggle
Each password field has an eye icon button:
```tsx
<Button
  type="button"
  variant="ghost"
  size="icon"
  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
>
  {showCurrentPassword ? <EyeOff /> : <Eye />}
</Button>
```

### Error Display
Validation errors shown below each field:
```tsx
{errors.currentPassword && (
  <p className="text-sm text-red-500">{errors.currentPassword.message}</p>
)}
```

### Loading State
Button shows loading spinner during submission:
```tsx
<Button type="submit" disabled={changePasswordMutation.isPending}>
  {changePasswordMutation.isPending ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Menyimpan...
    </>
  ) : (
    'Simpan'
  )}
</Button>
```

### Auto Logout
After successful password change:
```tsx
setTimeout(() => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  navigate('/login')
}, 1500)
```

---

## ✅ Checklist

- [x] Change password form created
- [x] Password validation implemented
- [x] Form error handling
- [x] Eye icon for password visibility
- [x] API integration with correct endpoint
- [x] Loading state during submission
- [x] Error toast notifications
- [x] Success toast notification
- [x] Auto logout after success
- [x] Redirect to login page
- [x] Password complexity requirements

---

## 📚 Related Documentation

- Backend: `/karir-nusantara-api/docs/CHANGE_PASSWORD_API.md`
- Backend: `/karir-nusantara-api/docs/CHANGE_PASSWORD_IMPLEMENTATION.md`
- Backend: `/karir-nusantara-api/docs/PASSWORD_APIS_QUICK_REFERENCE.md`

---

**Last Updated:** January 21, 2026  
**Status:** ✅ Production Ready  
**Frontend Port:** 5174 (or 5175 if in use)  
**Backend Port:** 8081
