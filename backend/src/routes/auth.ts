import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { OAuth2Client } from 'google-auth-library';
import { sendOtp, verifyOtp } from '../utils/otp';
import { verifyAuth } from '../middlewares/auth';
import { config } from '../config';
import { validate } from '../middlewares/validation';
import { registerSchema, loginSchema } from '../schemas/auth.schema';


const router = Router();

const generateAccessToken = (user: { id: string; role: string }) => {
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '15m' });
};

const generateRefreshToken = (user: { id: string; role: string }) => {
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

router.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, role, pincode, city, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'consumer',
        pincode,
        city,
        phone,
      },
    });

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});


router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Require 2FA (SMS OTP if phone exists, fallback to email OTP)
    const target = user.phone || user.email;
    const type = user.phone ? 'phone' : 'email';
    
    await sendOtp(target, type);

    return res.status(200).json({
      twoFactorRequired: true,
      email: user.email,
      target,
      type
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

const googleClient = new OAuth2Client();

router.post('/google', async (req: Request, res: Response): Promise<any> => {
  try {
    const { credential, role, pincode, city, phone, otpCode } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential (ID token) is required' });
    }

    let email: string;
    let name: string;
    let avatar: string | null = null;

    // Check if running in mock sandbox mode (useful for testing and development)
    if (credential.startsWith('mock-google-token-')) {
      const emailPart = credential.replace('mock-google-token-', '');
      email = emailPart.toLowerCase();
      name = email.split('@')[0];
      name = name.charAt(0).toUpperCase() + name.slice(1);
    } else {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured on the backend server' });
      }
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          return res.status(400).json({ error: 'Could not retrieve email from Google token' });
        }
        email = payload.email.toLowerCase();
        name = payload.name || payload.given_name || 'Google User';
        avatar = payload.picture || null;
      } catch (err: any) {
        console.error('Google token verification failed:', err);
        return res.status(400).json({ error: 'Invalid Google credential token' });
      }
    }

    // Check if user already exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      setRefreshTokenCookie(res, refreshToken);
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ user: userWithoutPassword, token });
    }

    // If user does not exist, check if required profile completion parameters are present
    if (!role) {
      return res.status(200).json({
        registrationRequired: true,
        email,
        name,
        avatar,
      });
    }

    // Validate role
    if (!['consumer', 'manufacturer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    // Verify phone OTP code before allowing registration completion
    if (phone) {
      if (!otpCode) {
        return res.status(400).json({ error: 'Phone verification code (OTP) is required' });
      }
      const isPhoneVerified = await verifyOtp(phone, otpCode, 'phone');
      if (!isPhoneVerified) {
        return res.status(400).json({ error: 'Invalid or expired phone verification code' });
      }
    }

    // Create user record (password is optional/null for Google SSO users)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        avatar,
        pincode,
        city,
        phone,
      },
    });

    const token = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    setRefreshTokenCookie(res, refreshToken);
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Google Auth error:', error);
    return res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

router.post('/send-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { target, type } = req.body;
    if (!target || !type) {
      return res.status(400).json({ error: 'Target (email or phone) and type are required' });
    }
    if (!['email', 'phone'].includes(type)) {
      return res.status(400).json({ error: 'Type must be email or phone' });
    }

    await sendOtp(target, type);
    return res.status(200).json({ message: `Verification code sent to ${target}` });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send verification code' });
  }
});

router.post('/verify-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { target, code, type } = req.body;
    if (!target || !code || !type) {
      return res.status(400).json({ error: 'Target, code, and type are required' });
    }
    if (!['email', 'phone'].includes(type)) {
      return res.status(400).json({ error: 'Type must be email or phone' });
    }

    const isValid = await verifyOtp(target, code, type, false);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    return res.status(200).json({ verified: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
});

router.post('/login/verify', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 2FA verification code are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const target = user.phone || user.email;
    const type = user.phone ? 'phone' : 'email';

    const isValid = await verifyOtp(target, code, type);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('2FA Verification error:', error);
    return res.status(500).json({ error: 'Failed to verify 2FA code' });
  }
});

// Change Password
router.post('/change-password', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// Forgot Password Request
router.post('/forgot-password', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const target = user.phone || user.email;
    const type = user.phone ? 'phone' : 'email';

    await sendOtp(target, type);

    return res.status(200).json({
      message: 'Verification code sent',
      target,
      type
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to request password reset' });
  }
});

// Reset Password with OTP
router.post('/reset-password', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and newPassword are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const target = user.phone || user.email;
    const type = user.phone ? 'phone' : 'email';

    const isValid = await verifyOtp(target, code, type);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete Account (Centralized GDPR-style deletion)
router.delete('/account', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;

    // Delete all child relations first
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.bid.deleteMany({ where: { manufacturerId: userId } }),
      prisma.order.deleteMany({ where: { OR: [{ consumerId: userId }, { manufacturerId: userId }] } }),
      prisma.interest.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { OR: [{ userId: userId }, { manufacturerId: userId }] } }),
      prisma.campaign.deleteMany({ where: { authorId: userId } }),
      prisma.productProposal.deleteMany({ where: { manufacturerId: userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Refresh Access Token
router.post('/refresh', async (req: Request, res: Response): Promise<any> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Access denied. No refresh token provided.' });
    }

    const decoded = jwt.verify(refreshToken, config.jwtSecret) as any;
    
    // Check if user still exists in database
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token. User not found.' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({ token: newAccessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// Logout (Clear cookies)
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.status(200).json({ message: 'Logged out successfully' });
});

export default router;

