import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, role, pincode, city, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

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

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

const googleClient = new OAuth2Client();

router.post('/google', async (req: Request, res: Response): Promise<any> => {
  try {
    const { credential, role, pincode, city, phone } = req.body;
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
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
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

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Google Auth error:', error);
    return res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

export default router;
