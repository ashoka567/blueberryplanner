import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "./email";

const SALT_ROUNDS = 12;

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION = 5 * 60 * 1000;

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(key);
  
  if (!attempts) {
    return { allowed: true };
  }
  
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(key);
    return { allowed: true };
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfter = Math.ceil((LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }
  
  return { allowed: true };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(key);
  if (!attempts) {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
  } else {
    attempts.count++;
    attempts.lastAttempt = now;
  }
}

function resetRateLimit(key: string): void {
  loginAttempts.delete(key);
}

function getEmailVerificationPage(success: boolean, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Blueberry Planner</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            max-width: 400px;
            background: white;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
          }
          .icon.success { background: #dcfce7; }
          .icon.error { background: #fee2e2; }
          h1 {
            color: #1a1a1a;
            margin: 0 0 12px;
            font-size: 24px;
          }
          p {
            color: #666;
            margin: 0 0 24px;
            line-height: 1.5;
          }
          a {
            display: inline-block;
            background: #4F46E5;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
          }
          a:hover { background: #4338CA; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon ${success ? 'success' : 'error'}">${success ? '✓' : '✕'}</div>
          <h1>${success ? 'Email Verified!' : 'Verification Failed'}</h1>
          <p>${message}</p>
          <a href="/">Go to Blueberry Planner</a>
        </div>
      </body>
    </html>
  `;
}

interface ScheduleRequest {
  text: string;
  familyId?: string;
}

interface ParsedItem {
  type: string;
  title: string;
  description?: string;
  dateTime?: string;
  endDateTime?: string;
  points?: number;
  dosage?: string;
  times?: string[];
  category?: string;
  store?: string;
  startDate?: string;
  endDate?: string;
  assignedToName?: string;
}

interface ScheduleResponse {
  message: string;
  items: ParsedItem[];
  choresCreated: number;
  remindersCreated: number;
  groceriesCreated: number;
  medicationsCreated: number;
}

interface RegisterRequest {
  familyName: string;
  guardianName: string;
  guardianEmail: string;
  password: string;
  securityQuestion1?: string;
  securityAnswer1?: string;
  securityQuestion2?: string;
  securityAnswer2?: string;
  members?: Array<{
    name: string;
    email?: string;
    password?: string;
    pin?: string;
    age?: number;
    isChild: boolean;
  }>;
}

interface LoginRequest {
  email: string;
  password: string;
}

function convertLocalToUTC(localDateTimeStr: string, timezone: string): Date {
  const localDate = new Date(localDateTimeStr);
  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const localOffset = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
  const diff = utcDate.getTime() - localOffset.getTime();
  return new Date(localDate.getTime() + diff);
}

function getSystemPrompt(timezone?: string): string {
  const now = new Date();
  const userDate = timezone 
    ? new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    : now;
  const todayStr = userDate.toISOString().split('T')[0];
  
  return `You are a helpful family schedule assistant. Parse the user's free-form text and extract:
- Chores (tasks with due dates, assign points 5-20 based on difficulty, extract person name if mentioned)
- Reminders (appointments, activities, family events)
- Medications (medicine schedules with dosage times and date ranges - e.g., "take VitD from today for 30 days at 8am")
- Grocery items (things to buy, food items, household supplies, medicine/prescriptions to PICK UP or BUY - look for store names)

IMPORTANT for distinguishing medications vs groceries:
- If user says "take", "schedule", "from today to", "for X days", or specifies dosage times -> create a MEDICATION
- If user says "buy", "pick up", "get from store", or mentions a store name -> create a GROCERY item

IMPORTANT for chores: If a person's name is mentioned (e.g., "Vasin needs to do homework", "chore for John"), extract that name in the "assignedToName" field.

Return a JSON array of items. Each item should have:
{
    "type": "chore" | "reminder" | "grocery" | "medication",
    "title": "title of the item",
    "description": "optional description",
    "dateTime": "ISO datetime string (YYYY-MM-DDTHH:mm:ss) or null",
    "endDateTime": "for reminders only, ISO string or null",
    "points": number (for chores only, 5-20),
    "assignedToName": "person's name if mentioned (for chores)",
    "category": "Vegetables" | "Fruits" | "Dairy" | "Snacks" | "Medicine" | "Beverages" | "Meat" | "Pantry" | "Frozen" | "Other" (for groceries),
    "store": "store name like Walmart, Costco, HMart, Walgreens, CVS, etc." (for groceries),
    "startDate": "YYYY-MM-DD (for medications, when to start)",
    "endDate": "YYYY-MM-DD (for medications, when to end)",
    "times": ["08:00", "14:00"] (for medications, array of time strings in 24hr format)
}

Example chore: "Vasin needs to do English homework" becomes:
[{"type":"chore","title":"English homework","assignedToName":"Vasin","points":10}]

Example medication: "take VitD from today for 30 days at 8am" becomes:
[{"type":"medication","title":"VitD","startDate":"${todayStr}","endDate":"calculated 30 days from today","times":["08:00"]}]

IMPORTANT for groceries: If user mentions items with store names (e.g., "medicine walgreens fish hmart"), create separate grocery items for each item-store combination.

If dates are relative like "tomorrow" or "next Monday", calculate from today's date.
Today is: ${todayStr}

Return ONLY valid JSON array, no markdown or explanation.`;
}

async function callOpenAI(userText: string, timezone?: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured');
    return null;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: getSystemPrompt(timezone) },
          { role: 'user', content: userText }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return null;
  }
}

function parseAIResponse(response: string): ParsedItem[] {
  if (!response) return [];
  
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    
    return JSON.parse(cleaned.trim());
  } catch (error) {
    console.error('Failed to parse AI response:', response, error);
    return [];
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await storage.seedDefaultData();

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { familyName, guardianName, guardianEmail, password, securityQuestion1, securityAnswer1, securityQuestion2, securityAnswer2, members = [] } = req.body as RegisterRequest;
      
      if (!familyName || !guardianName || !guardianEmail || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      
      // VALIDATION PHASE: Check ALL emails before creating any records
      const existingUser = await storage.getUserByEmail(guardianEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }
      
      // Collect all member emails and validate them upfront
      const allEmailsToCheck: string[] = [guardianEmail.toLowerCase()];
      for (const member of members) {
        if (member.email) {
          const memberEmailLower = member.email.toLowerCase();
          // Check for duplicate within the registration request
          if (allEmailsToCheck.includes(memberEmailLower)) {
            return res.status(400).json({ error: `Email ${member.email} is used more than once` });
          }
          allEmailsToCheck.push(memberEmailLower);
          
          // Check if email already exists in database
          const existingMember = await storage.getUserByEmail(member.email);
          if (existingMember) {
            return res.status(400).json({ error: `Email ${member.email} is already registered` });
          }
        }
        
        // Validate member passwords if they are guardians
        if (!member.isChild && member.password && member.password.length < 8) {
          return res.status(400).json({ error: `Password for ${member.name} must be at least 8 characters` });
        }
      }
      
      // PREPARATION PHASE: Hash all passwords and generate PINs BEFORE creating any records
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      const kidPins: { name: string; pin: string }[] = [];
      const preparedMembers: Array<{
        name: string;
        email: string | null;
        password: string | null;
        pinHash: string | null;
        loginType: string;
        age: number | null;
        isChild: boolean;
        avatar: string;
        roleId: number;
      }> = [];
      
      // Prepare all member data (hash passwords, generate PINs)
      for (const member of members) {
        let memberPassword = null;
        if (member.password && !member.isChild) {
          memberPassword = await bcrypt.hash(member.password, SALT_ROUNDS);
        }
        
        let pin: string | null = null;
        if (member.isChild) {
          if (member.pin && /^\d{4}$/.test(member.pin)) {
            pin = member.pin;
          } else {
            pin = Math.floor(1000 + Math.random() * 9000).toString();
          }
        }
        const hashedPin = pin ? await bcrypt.hash(pin, SALT_ROUNDS) : null;
        
        if (member.isChild && pin && !member.pin) {
          kidPins.push({ name: member.name, pin });
        }
        
        preparedMembers.push({
          name: member.name,
          email: member.email || null,
          password: memberPassword,
          pinHash: hashedPin,
          loginType: member.isChild ? 'PIN' : 'PASSWORD',
          age: member.age || null,
          isChild: member.isChild,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`,
          roleId: member.isChild ? 2 : 1,
        });
      }
      
      // CREATION PHASE: All preparations done, now create ALL records together
      // Create guardian
      const guardian = await storage.createUser({
        name: guardianName,
        email: guardianEmail,
        password: hashedPassword,
        loginType: 'PASSWORD',
        isChild: false,
        emailVerified: false,
        status: 'ACTIVE',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(guardianName)}`,
      });
      
      if (securityQuestion1 && securityAnswer1 && securityQuestion2 && securityAnswer2) {
        await storage.updateUser(guardian.id, {
          securityQuestion1,
          securityAnswer1: securityAnswer1.toLowerCase().trim(),
          securityQuestion2,
          securityAnswer2: securityAnswer2.toLowerCase().trim(),
        });
      }

      // Create family
      const family = await storage.createFamily({
        name: familyName,
        createdBy: guardian.id,
        timezone: 'America/New_York',
        settings: { allowKidsToEditGroceries: false, requireMedicineConfirmation: true },
      });
      
      // Add guardian as family member
      await storage.addFamilyMember({
        familyId: family.id,
        userId: guardian.id,
        roleId: 1,
        status: 'ACTIVE',
      });
      
      // Create all other family members
      for (const prepared of preparedMembers) {
        const newMember = await storage.createUser({
          name: prepared.name,
          email: prepared.email,
          password: prepared.password,
          pinHash: prepared.pinHash,
          loginType: prepared.loginType,
          age: prepared.age,
          isChild: prepared.isChild,
          status: 'ACTIVE',
          avatar: prepared.avatar,
        });
        
        await storage.addFamilyMember({
          familyId: family.id,
          userId: newMember.id,
          roleId: prepared.roleId,
          status: 'ACTIVE',
        });
      }
      
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.createEmailVerification(guardian.id, verificationToken, expiresAt);
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      sendVerificationEmail(guardianEmail, guardianName, verificationToken, baseUrl).catch(err => {
        console.error('Failed to send verification email:', err);
      });
      
      req.session.userId = guardian.id;
      req.session.familyId = family.id;
      
      res.json({
        success: true,
        user: { id: guardian.id, name: guardian.name, email: guardian.email },
        family: { id: family.id, name: family.name },
        emailVerificationSent: true,
        kidPins,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as LoginRequest;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
      const rateLimitKey = `login:${normalizedEmail}:${clientIP}`;
      const rateCheck = checkRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        return res.status(429).json({ 
          error: 'Too many attempts. Please try again later.',
          retryAfter: rateCheck.retryAfter 
        });
      }
      
      let user;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          user = await storage.getUserByEmail(normalizedEmail);
          break;
        } catch (dbError) {
          console.error(`Database error during login lookup (attempt ${attempt}/3):`, dbError);
          if (attempt === 3) {
            return res.status(500).json({ error: 'Service temporarily unavailable. Please try again in a moment.' });
          }
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }

      if (!user || !user.password) {
        recordFailedAttempt(rateLimitKey);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      let passwordMatch = false;
      try {
        passwordMatch = await bcrypt.compare(password, user.password);
      } catch (bcryptError) {
        console.error('Bcrypt comparison error:', bcryptError);
        return res.status(500).json({ error: 'Authentication service error. Please try again.' });
      }

      if (!passwordMatch) {
        recordFailedAttempt(rateLimitKey);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      resetRateLimit(rateLimitKey);
      
      let familyId: string | undefined;
      try {
        const familyMembership = await storage.getUserFamily(user.id);
        familyId = familyMembership?.familyId;
      } catch (dbError) {
        console.error('Database error getting family membership (non-fatal):', dbError);
        familyId = undefined;
      }
      
      req.session.userId = user.id;
      req.session.familyId = familyId;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error during login:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, isChild: user.isChild },
        familyId,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  app.delete('/api/auth/account', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
      await storage.deleteUserAccount(req.session.userId);
      req.session.destroy((err) => {
        if (err) console.error('Session destroy error after account deletion:', err);
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.json({ authenticated: false });
    }
    
    let user;
    try {
      user = await storage.getUser(req.session.userId);
    } catch (dbError) {
      console.error('Database error in /api/auth/me:', dbError);
      try {
        user = await storage.getUser(req.session.userId);
      } catch (retryError) {
        console.error('Database retry in /api/auth/me also failed:', retryError);
        return res.json({ authenticated: false });
      }
    }
    if (!user) {
      return res.json({ authenticated: false });
    }
    
    res.json({
      authenticated: true,
      user: { id: user.id, name: user.name, email: user.email, isChild: user.isChild, emailVerified: user.emailVerified },
      familyId: req.session.familyId,
    });
  });

  app.get('/api/auth/verify-email', async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).send(getEmailVerificationPage(false, 'Invalid verification link'));
      }
      
      const verification = await storage.getEmailVerification(token);
      
      if (!verification) {
        return res.status(400).send(getEmailVerificationPage(false, 'Verification link not found'));
      }
      
      if (verification.verified) {
        return res.send(getEmailVerificationPage(true, 'Your email is already verified'));
      }
      
      if (new Date() > verification.expiresAt) {
        return res.status(400).send(getEmailVerificationPage(false, 'Verification link has expired'));
      }
      
      await storage.markEmailVerified(token);
      
      res.send(getEmailVerificationPage(true, 'Your email has been verified!'));
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).send(getEmailVerificationPage(false, 'Verification failed. Please try again.'));
    }
  });

  app.post('/api/auth/kid-login', async (req: Request, res: Response) => {
    try {
      const { familyName, kidName, pin } = req.body;
      
      if (!familyName || !kidName || !pin) {
        return res.status(400).json({ error: 'Please enter family name, your name, and PIN' });
      }
      
      if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: 'PIN must be 4 digits' });
      }
      
      const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
      const rateLimitKey = `kid-login:${familyName.toLowerCase().trim()}:${kidName.toLowerCase().trim()}:${clientIP}`;
      const rateCheck = checkRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        return res.status(429).json({ 
          error: 'Too many attempts. Please try again later.',
          retryAfter: rateCheck.retryAfter 
        });
      }
      
      const allFamilies = await storage.getFamilies();
      const matchingFamily = allFamilies.find(f => 
        f.name.toLowerCase().trim() === familyName.toLowerCase().trim()
      );
      
      if (!matchingFamily) {
        recordFailedAttempt(rateLimitKey);
        return res.status(401).json({ error: 'Family name, name, or PIN is incorrect' });
      }
      
      const familyKids = await storage.getKidsByFamily(matchingFamily.id);
      const matchingKids = familyKids.filter(u => 
        u.pinHash && 
        u.name.toLowerCase().trim() === kidName.toLowerCase().trim()
      );
      
      let matchedKid: typeof matchingKids[0] | undefined;
      for (const kid of matchingKids) {
        if (kid.pinHash && await bcrypt.compare(pin, kid.pinHash)) {
          matchedKid = kid;
          break;
        }
      }
      
      if (!matchedKid) {
        recordFailedAttempt(rateLimitKey);
        return res.status(401).json({ error: 'Family name, name, or PIN is incorrect' });
      }
      
      resetRateLimit(rateLimitKey);
      
      req.session.userId = matchedKid.id;
      req.session.familyId = matchingFamily.id;
      req.session.isChild = true;
      
      res.json({
        success: true,
        user: { id: matchedKid.id, name: matchedKid.name, isChild: true },
        familyId: matchingFamily.id,
      });
    } catch (error) {
      console.error('Kid login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/reset-password/verify', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const rateLimitKey = `reset:${email.toLowerCase()}`;
      const rateCheck = checkRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: 'Too many attempts. Please try again later.',
          retryAfter: rateCheck.retryAfter,
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        recordFailedAttempt(rateLimitKey);
        return res.json({ found: false, reason: 'no_account' });
      }
      if (!user.securityQuestion1 || !user.securityQuestion2) {
        return res.json({ found: false, reason: 'no_security_questions' });
      }

      res.json({
        found: true,
        securityQuestion1: user.securityQuestion1,
        securityQuestion2: user.securityQuestion2,
      });
    } catch (error) {
      console.error('Reset password verify error:', error);
      res.status(500).json({ error: 'Failed to verify account' });
    }
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { email, securityAnswer1, securityAnswer2, newPassword } = req.body;

      if (!email || !securityAnswer1 || !securityAnswer2 || !newPassword) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const rateLimitKey = `reset-attempt:${email.toLowerCase()}`;
      const rateCheck = checkRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: 'Too many attempts. Please try again later.',
          retryAfter: rateCheck.retryAfter,
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.securityAnswer1 || !user.securityAnswer2) {
        recordFailedAttempt(rateLimitKey);
        return res.status(400).json({ error: 'Account not found or security questions not set up' });
      }

      const answer1Match = securityAnswer1.toLowerCase().trim() === user.securityAnswer1;
      const answer2Match = securityAnswer2.toLowerCase().trim() === user.securityAnswer2;

      if (!answer1Match || !answer2Match) {
        recordFailedAttempt(rateLimitKey);
        return res.status(400).json({ error: 'Security answers are incorrect' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await storage.updateUser(user.id, { password: hashedNewPassword });

      resetRateLimit(rateLimitKey);

      res.json({ success: true });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.post('/api/auth/setup-security-questions', async (req: Request, res: Response) => {
    try {
      const { email, currentPassword, securityQuestion1, securityAnswer1, securityQuestion2, securityAnswer2 } = req.body;

      if (!email || !currentPassword || !securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (securityQuestion1 === securityQuestion2) {
        return res.status(400).json({ error: 'Please choose two different security questions' });
      }

      const rateLimitKey = `setup-sq:${email.toLowerCase()}`;
      const rateCheck = checkRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        return res.status(429).json({ error: 'Too many attempts. Please try again later.', retryAfter: rateCheck.retryAfter });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        recordFailedAttempt(rateLimitKey);
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        recordFailedAttempt(rateLimitKey);
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      resetRateLimit(rateLimitKey);

      await storage.updateUser(user.id, {
        securityQuestion1,
        securityAnswer1: securityAnswer1.toLowerCase().trim(),
        securityQuestion2,
        securityAnswer2: securityAnswer2.toLowerCase().trim(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Setup security questions error:', error);
      res.status(500).json({ error: 'Failed to set up security questions' });
    }
  });

  app.post('/api/auth/security-questions', async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { securityQuestion1, securityAnswer1, securityQuestion2, securityAnswer2 } = req.body;

      if (!securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2) {
        return res.status(400).json({ error: 'All security question fields are required' });
      }

      if (securityQuestion1 === securityQuestion2) {
        return res.status(400).json({ error: 'Please choose two different security questions' });
      }

      await storage.updateUser(userId, {
        securityQuestion1,
        securityAnswer1: securityAnswer1.toLowerCase().trim(),
        securityQuestion2,
        securityAnswer2: securityAnswer2.toLowerCase().trim(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Update security questions error:', error);
      res.status(500).json({ error: 'Failed to update security questions' });
    }
  });

  app.get('/api/auth/security-questions', async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        hasSecurityQuestions: !!(user.securityQuestion1 && user.securityQuestion2),
        securityQuestion1: user.securityQuestion1 || null,
        securityQuestion2: user.securityQuestion2 || null,
      });
    } catch (error) {
      console.error('Get security questions error:', error);
      res.status(500).json({ error: 'Failed to get security questions' });
    }
  });

  app.get('/api/families/:familyId/kids', async (req: Request, res: Response) => {
    try {
      const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
      const kids = await storage.getKidsByFamily(familyId);
      res.json(kids.map(k => ({ id: k.id, name: k.name, avatar: k.avatar })));
    } catch (error) {
      console.error('Get kids error:', error);
      res.status(500).json({ error: 'Failed to get kids' });
    }
  });

  // Super Admin Routes
  const SUPER_ADMIN_EMAIL = 'ashoka6@gmail.com';
  const SUPER_ADMIN_PASSCODE = process.env.SUPER_ADMIN_PASSCODE;

  app.post('/api/super-admin/login', async (req: Request, res: Response) => {
    try {
      const { email, passcode } = req.body;

      if (!email || !passcode) {
        return res.status(400).json({ error: 'Email and passcode required' });
      }

      if (email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied - not authorized' });
      }

      if (!SUPER_ADMIN_PASSCODE || passcode !== SUPER_ADMIN_PASSCODE) {
        return res.status(403).json({ error: 'Invalid passcode' });
      }

      res.json({ success: true, message: 'Super admin access granted' });
    } catch (error) {
      console.error('Super admin login error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  app.post('/api/super-admin/impersonate', async (req: Request, res: Response) => {
    try {
      const { userId, adminEmail, passcode } = req.body;

      if (adminEmail?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!SUPER_ADMIN_PASSCODE || passcode !== SUPER_ADMIN_PASSCODE) {
        return res.status(403).json({ error: 'Invalid passcode' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const membership = await storage.getUserFamily(userId);
      if (!membership) {
        return res.status(404).json({ error: 'User has no family membership' });
      }

      req.session.userId = user.id;
      req.session.familyId = membership.familyId;
      req.session.isChild = user.isChild ?? false;
      req.session.isSuperAdmin = true;

      req.session.save((err) => {
        if (err) {
          console.error('Session save error during impersonation:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        res.json({ success: true, user: { id: user.id, name: user.name } });
      });
    } catch (error) {
      console.error('Impersonation error:', error);
      res.status(500).json({ error: 'Impersonation failed' });
    }
  });

  app.post('/api/super-admin/reset-password', async (req: Request, res: Response) => {
    try {
      const { adminEmail, passcode, userId, newPassword } = req.body;

      if (adminEmail?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!SUPER_ADMIN_PASSCODE || passcode !== SUPER_ADMIN_PASSCODE) {
        return res.status(403).json({ error: 'Invalid passcode' });
      }

      if (!userId || !newPassword) {
        return res.status(400).json({ error: 'User ID and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await storage.updateUser(userId, { password: hashedPassword });

      res.json({ success: true, message: `Password reset for ${user.name}` });
    } catch (error) {
      console.error('Super admin reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.get('/api/families', async (req: Request, res: Response) => {
    if (req.session.isSuperAdmin) {
      const families = await storage.getFamilies();
      return res.json(families);
    }
    if (req.session.familyId) {
      const family = await storage.getFamily(req.session.familyId);
      return res.json(family ? [family] : []);
    }
    const families = await storage.getFamilies();
    res.json(families);
  });

  app.get('/api/families/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const family = await storage.getFamily(id);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    res.json(family);
  });

  app.get('/api/families/:id/members', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const users = await storage.getUsersByFamily(id);
    res.json(users);
  });

  app.get('/api/users', async (_req: Request, res: Response) => {
    const allUsers = await storage.getUsers();
    const allFamilies = await storage.getFamilies();

    const usersWithFamily = await Promise.all(
      allUsers.map(async (user) => {
        const membership = await storage.getUserFamily(user.id);
        const family = membership ? allFamilies.find(f => f.id === membership.familyId) : null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isChild: user.isChild,
          familyId: membership?.familyId || null,
          familyName: family?.name || "No Family",
        };
      })
    );
    res.json(usersWithFamily);
  });

  app.get('/api/notification-settings', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || !req.session.familyId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const settings = await storage.getNotificationSettings(req.session.userId, req.session.familyId);
      if (!settings) {
        return res.json({
          medicationsEnabled: true,
          medicationsMinutes: 15,
          choresEnabled: true,
          choresMinutes: 30,
          remindersEnabled: true,
          remindersMinutes: 15,
          groceriesEnabled: false,
          calendarEnabled: true,
          calendarMinutes: 15,
          pushEnabled: false
        });
      }
      res.json(settings);
    } catch (error) {
      console.error('Error getting notification settings:', error);
      res.status(500).json({ error: 'Failed to get notification settings' });
    }
  });

  app.post('/api/notification-settings', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || !req.session.familyId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const settings = await storage.upsertNotificationSettings({
        userId: req.session.userId,
        familyId: req.session.familyId,
        ...settingsData
      });
      res.json(settings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      res.status(500).json({ error: 'Failed to save notification settings' });
    }
  });

  app.get('/api/dashboard-config', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const config = await storage.getDashboardConfig(req.session.userId);
      if (!config) {
        return res.json({ widgets: null });
      }
      res.json(config);
    } catch (error) {
      console.error('Error getting dashboard config:', error);
      res.status(500).json({ error: 'Failed to get dashboard config' });
    }
  });

  app.post('/api/dashboard-config', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const { widgets } = req.body;
      if (!widgets || !Array.isArray(widgets)) {
        return res.status(400).json({ error: 'widgets array is required' });
      }
      const config = await storage.upsertDashboardConfig(req.session.userId, widgets);
      res.json(config);
    } catch (error) {
      console.error('Error saving dashboard config:', error);
      res.status(500).json({ error: 'Failed to save dashboard config' });
    }
  });

  app.patch('/api/users/:id/points', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const { id } = req.params;
      const { points } = req.body;
      
      if (typeof points !== 'number' || points < 0) {
        return res.status(400).json({ error: 'Invalid points value' });
      }
      
      await storage.updateUserPoints(id, points);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user points:', error);
      res.status(500).json({ error: 'Failed to update points' });
    }
  });

  app.patch('/api/users/:id/avatar', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Users can only update their own avatar
      if (req.params.id !== req.session.userId) {
        return res.status(403).json({ error: 'You can only update your own profile photo' });
      }
      
      const { avatar } = req.body;
      if (!avatar || typeof avatar !== 'string') {
        return res.status(400).json({ error: 'Avatar data is required' });
      }
      
      if (avatar.length > 2 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image too large. Max 2MB allowed.' });
      }
      
      const user = await storage.updateUser(req.params.id, { avatar });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ success: true, avatar: user.avatar });
    } catch (error) {
      console.error('Avatar update error:', error);
      res.status(500).json({ error: 'Failed to update avatar' });
    }
  });

  app.patch('/api/users/:id/pin', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId || !req.session.familyId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { pin } = req.body;
      
      if (!pin || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      }
      
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser || currentUser.isChild) {
        return res.status(403).json({ error: 'Only guardians can update PINs' });
      }
      
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!targetUser.isChild) {
        return res.status(400).json({ error: 'Can only set PIN for children' });
      }
      
      const familyMembers = await storage.getUsersByFamily(req.session.familyId);
      const isInFamily = familyMembers.some(m => m.id === targetUserId);
      if (!isInFamily) {
        return res.status(403).json({ error: 'Can only update PINs for your family members' });
      }
      
      const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);
      await storage.updateUser(targetUserId, { pinHash: hashedPin });
      
      res.json({ success: true, message: 'PIN updated successfully' });
    } catch (error) {
      console.error('PIN update error:', error);
      res.status(500).json({ error: 'Failed to update PIN' });
    }
  });

  app.get('/api/families/:familyId/chores', async (req: Request, res: Response) => {
    const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
    const chores = await storage.getChores(familyId);
    res.json(chores);
  });

  app.post('/api/families/:familyId/chores', async (req: Request, res: Response) => {
    const chore = await storage.createChore({
      ...req.body,
      familyId: req.params.familyId,
    });
    res.json(chore);
  });

  app.patch('/api/chores/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    // Get current chore to check if status is changing to COMPLETED
    const existingChore = await storage.getChore(id);
    if (!existingChore) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    const chore = await storage.updateChore(id, req.body);
    if (!chore) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    // If status changed to COMPLETED, add points to user's chorePoints
    if (req.body.status === 'COMPLETED' && existingChore.status !== 'COMPLETED' && chore.assignedTo) {
      const user = await storage.getUser(chore.assignedTo);
      if (user) {
        const currentPoints = (user as any).chorePoints || 0;
        await storage.updateUser(chore.assignedTo, { chorePoints: currentPoints + (chore.points || 0) });
      }
    }
    
    res.json(chore);
  });

  app.delete('/api/chores/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await storage.deleteChore(id);
    res.json({ success: true });
  });

  app.get('/api/families/:familyId/groceries', async (req: Request, res: Response) => {
    const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
    const items = await storage.getGroceryItems(familyId);
    res.json(items);
  });

  app.post('/api/families/:familyId/groceries', async (req: Request, res: Response) => {
    const item = await storage.createGroceryItem({
      ...req.body,
      familyId: req.params.familyId,
    });
    res.json(item);
  });

  app.patch('/api/groceries/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await storage.updateGroceryItem(id, req.body);
    if (!item) {
      return res.status(404).json({ error: 'Grocery item not found' });
    }
    res.json(item);
  });

  app.delete('/api/groceries/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await storage.deleteGroceryItem(id);
    res.json({ success: true });
  });

  // Grocery Essentials routes
  app.get('/api/families/:familyId/grocery-essentials', async (req: Request, res: Response) => {
    const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
    const essentials = await storage.getGroceryEssentials(familyId);
    res.json(essentials);
  });

  app.post('/api/families/:familyId/grocery-essentials', async (req: Request, res: Response) => {
    const essential = await storage.createGroceryEssential({
      ...req.body,
      familyId: req.params.familyId,
    });
    res.json(essential);
  });

  app.delete('/api/grocery-essentials/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await storage.deleteGroceryEssential(id);
    res.json({ success: true });
  });

  // Grocery Stores routes
  app.get('/api/families/:familyId/grocery-stores', async (req: Request, res: Response) => {
    const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
    const stores = await storage.getGroceryStores(familyId);
    res.json(stores);
  });

  app.post('/api/families/:familyId/grocery-stores', async (req: Request, res: Response) => {
    const store = await storage.createGroceryStore({
      ...req.body,
      familyId: req.params.familyId,
    });
    res.json(store);
  });

  app.delete('/api/grocery-stores/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await storage.deleteGroceryStore(id);
    res.json({ success: true });
  });

  // Grocery Buy Again routes
  app.get('/api/families/:familyId/grocery-buy-again', async (req: Request, res: Response) => {
    const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
    const buyAgainItems = await storage.getGroceryBuyAgain(familyId);
    res.json(buyAgainItems);
  });

  app.post('/api/families/:familyId/grocery-buy-again', async (req: Request, res: Response) => {
    const item = await storage.createGroceryBuyAgain({
      ...req.body,
      familyId: req.params.familyId,
    });
    res.json(item);
  });

  app.patch('/api/grocery-buy-again/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await storage.updateGroceryBuyAgain(id, req.body);
    if (!item) {
      return res.status(404).json({ error: 'Buy again item not found' });
    }
    res.json(item);
  });

  app.delete('/api/grocery-buy-again/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await storage.deleteGroceryBuyAgain(id);
    res.json({ success: true });
  });

  app.get('/api/families/:familyId/medicines', async (req: Request, res: Response) => {
    const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
    const allMedicines = await storage.getMedicines(familyId);

    if (req.session.isChild && req.session.userId) {
      const filtered = allMedicines.filter(m => m.assignedTo === req.session.userId);
      return res.json(filtered);
    }

    res.json(allMedicines);
  });

  app.post('/api/families/:familyId/medicines', async (req: Request, res: Response) => {
    const medicine = await storage.createMedicine({
      ...req.body,
      familyId: req.params.familyId,
    });
    res.json(medicine);
  });

  app.patch('/api/medicines/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const medicine = await storage.updateMedicine(id, req.body);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json(medicine);
  });

  app.delete('/api/medicines/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await storage.deleteMedicine(id);
    res.json({ success: true });
  });

  app.get('/api/families/:familyId/medicine-logs', async (req: Request, res: Response) => {
    const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
    const logs = await storage.getMedicineLogs(familyId);
    res.json(logs);
  });

  app.post('/api/families/:familyId/medicine-logs', async (req: Request, res: Response) => {
    const { takenAt, ...rest } = req.body;
    const log = await storage.createMedicineLog({
      ...rest,
      familyId: req.params.familyId,
      takenAt: takenAt ? new Date(takenAt) : new Date(),
    });
    res.json(log);
  });

  app.get('/api/families/:familyId/reminders', async (req: Request, res: Response) => {
    const familyId = Array.isArray(req.params.familyId) ? req.params.familyId[0] : req.params.familyId;
    let remindersList;
    if (req.session.isChild && req.session.userId) {
      remindersList = await storage.getRemindersByUser(familyId, req.session.userId);
    } else {
      remindersList = await storage.getReminders(familyId);
    }
    const remindersWithTargets = await Promise.all(
      remindersList.map(async (r) => {
        const targetUserIds = await storage.getReminderTargets(r.id);
        return { ...r, targetUserIds };
      })
    );
    res.json(remindersWithTargets);
  });

  app.post('/api/families/:familyId/reminders', async (req: Request, res: Response) => {
    const { startTime, endTime, targetUserIds, ...rest } = req.body;
    const reminder = await storage.createReminder({
      ...rest,
      familyId: req.params.familyId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });
    if (targetUserIds && Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      await storage.setReminderTargets(reminder.id, targetUserIds);
    }
    const targets = await storage.getReminderTargets(reminder.id);
    res.json({ ...reminder, targetUserIds: targets });
  });

  app.patch('/api/reminders/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { targetUserIds, ...updates } = req.body;
    const reminder = await storage.updateReminder(id, updates);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    if (targetUserIds && Array.isArray(targetUserIds)) {
      await storage.setReminderTargets(id, targetUserIds);
    }
    const targets = await storage.getReminderTargets(id);
    res.json({ ...reminder, targetUserIds: targets });
  });

  app.delete('/api/reminders/:id', async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await storage.deleteReminder(id);
    res.json({ success: true });
  });

  app.post('/api/ai/schedule', async (req: Request, res: Response) => {
    const { text, familyId, timezone } = req.body as ScheduleRequest & { timezone?: string };
    
    if (!text || !text.trim()) {
      return res.json({
        message: 'Please provide some text to process.',
        items: [],
        choresCreated: 0,
        remindersCreated: 0,
        groceriesCreated: 0,
        medicationsCreated: 0
      } as ScheduleResponse);
    }
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.json({
        message: 'AI feature requires OpenAI API key. Please configure OPENAI_API_KEY in your secrets.',
        items: [],
        choresCreated: 0,
        remindersCreated: 0,
        groceriesCreated: 0,
        medicationsCreated: 0
      } as ScheduleResponse);
    }
    
    try {
      const aiResponse = await callOpenAI(text, timezone);
      
      if (!aiResponse) {
        return res.json({
          message: 'Could not get a response from AI. Please try again.',
          items: [],
          choresCreated: 0,
          remindersCreated: 0,
          groceriesCreated: 0,
          medicationsCreated: 0
        } as ScheduleResponse);
      }
      
      const parsedItems = parseAIResponse(aiResponse);
      
      if (parsedItems.length === 0) {
        return res.json({
          message: "I couldn't identify any tasks, reminders, medications, or grocery items in your message. Please try being more specific.",
          items: [],
          choresCreated: 0,
          remindersCreated: 0,
          groceriesCreated: 0,
          medicationsCreated: 0
        } as ScheduleResponse);
      }
      
      let choresCreated = 0;
      let remindersCreated = 0;
      let groceriesCreated = 0;
      let medicationsCreated = 0;
      const responseItems: ParsedItem[] = [];

      const families = await storage.getFamilies();
      const targetFamilyId = familyId || families[0]?.id;
      
      for (const item of parsedItems) {
        if (!item.type || !item.title) continue;
        
        switch (item.type.toLowerCase()) {
          case 'chore':
            if (targetFamilyId) {
              let assignedToId: string | null = null;
              if (item.assignedToName) {
                const users = await storage.getUsersByFamily(targetFamilyId);
                const searchName = item.assignedToName.toLowerCase().trim();
                const matchedUser = users.find(u => {
                  if (!u.name) return false;
                  const userName = u.name.toLowerCase().trim();
                  return userName.includes(searchName) || searchName.includes(userName);
                });
                if (matchedUser) {
                  assignedToId = matchedUser.id;
                }
              }
              await storage.createChore({
                familyId: targetFamilyId,
                title: item.title,
                dueDate: item.dateTime ? item.dateTime.split('T')[0] : new Date().toISOString().split('T')[0],
                points: item.points || 5,
                status: 'PENDING',
                assignedTo: assignedToId,
              });
            }
            choresCreated++;
            responseItems.push(item);
            break;
          case 'reminder':
          case 'event':
            if (targetFamilyId) {
              const userTimezone = timezone || 'UTC';
              await storage.createReminder({
                familyId: targetFamilyId,
                title: item.title,
                description: item.description,
                type: 'Custom',
                schedule: { type: 'ONCE' },
                startTime: item.dateTime ? convertLocalToUTC(item.dateTime, userTimezone) : new Date(),
                endTime: item.endDateTime ? convertLocalToUTC(item.endDateTime, userTimezone) : undefined,
              });
            }
            remindersCreated++;
            responseItems.push(item);
            break;
          case 'grocery':
            if (targetFamilyId) {
              await storage.createGroceryItem({
                familyId: targetFamilyId,
                name: item.title,
                category: item.category || 'Other',
                store: item.store || null,
                status: 'NEEDED',
              });
            }
            groceriesCreated++;
            responseItems.push(item);
            break;
          case 'medication':
            if (targetFamilyId) {
              await storage.createMedicine({
                familyId: targetFamilyId,
                name: item.title,
                dosage: item.dosage || null,
                schedule: { type: 'DAILY', times: item.times || ['08:00'] },
                active: true,
                inventory: 30,
                startDate: item.startDate || new Date().toISOString().split('T')[0],
                endDate: item.endDate || null,
              });
            }
            medicationsCreated++;
            responseItems.push(item);
            break;
        }
      }
      
      const totalCreated = choresCreated + remindersCreated + groceriesCreated + medicationsCreated;
      
      return res.json({
        message: totalCreated > 0 
          ? `Successfully created ${totalCreated} item(s) from your input!`
          : "I understood your message but couldn't identify any valid items.",
        items: responseItems,
        choresCreated,
        remindersCreated,
        groceriesCreated,
        medicationsCreated
      } as ScheduleResponse);
      
    } catch (error) {
      console.error('Error processing schedule text:', error);
      return res.json({
        message: "Sorry, something went wrong. Please try again.",
        items: [],
        choresCreated: 0,
        remindersCreated: 0,
        groceriesCreated: 0,
        medicationsCreated: 0
      } as ScheduleResponse);
    }
  });

  return httpServer;
}
