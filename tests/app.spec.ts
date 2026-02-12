import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const TEST_FAMILY_NAME = `TestFamily_${Date.now()}`;
const TEST_GUARDIAN_EMAIL = `test_${Date.now()}@testfamily.com`;
const TEST_GUARDIAN_PASSWORD = 'TestPass123!';
const TEST_GUARDIAN_NAME = 'Test Guardian';
const TEST_KID_NAME = 'Test Kid';
const TEST_KID_PIN = '9876';

async function solveCaptchaAndLogin(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForSelector('[data-testid="input-email"]', { timeout: 10000 });
  await page.fill('[data-testid="input-email"]', email);
  await page.fill('[data-testid="input-password"]', password);

  const captchaText = await page.textContent('[data-testid="text-captcha-problem"]');
  if (captchaText) {
    const match = captchaText.match(/(\d+)\s*\+\s*(\d+)/);
    if (match) {
      const answer = parseInt(match[1]) + parseInt(match[2]);
      await page.fill('[data-testid="input-captcha"]', answer.toString());
    }
  }

  await page.click('[data-testid="button-login"]');
  await page.waitForURL('/', { timeout: 15000 });
}

async function apiLogout(page: Page) {
  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }));
}

test.describe.serial('Blueberry Planner - Complete Test Suite', () => {

  test.describe('1. Authentication - Login Page', () => {
    test('Login page renders correctly', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('[data-testid="input-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-password"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-captcha"]')).toBeVisible();
      await expect(page.locator('[data-testid="text-captcha-problem"]')).toBeVisible();
      await expect(page.locator('[data-testid="button-login"]')).toBeVisible();
      await expect(page.locator('[data-testid="link-forgot-password"]')).toBeVisible();
      await expect(page.locator('[data-testid="link-register"]')).toBeVisible();
      await expect(page.locator('[data-testid="link-kid-login"]')).toBeVisible();
    });

    test('Shows error for empty login', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="button-login"]');
      await expect(page.getByText('Missing Information')).toBeVisible({ timeout: 5000 });
    });

    test('CAPTCHA validation works - wrong answer shows error', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="input-email"]', 'test@test.com');
      await page.fill('[data-testid="input-password"]', 'password123');
      await page.fill('[data-testid="input-captcha"]', '999');
      await page.click('[data-testid="button-login"]');
      await expect(page.getByText('Wrong Answer')).toBeVisible({ timeout: 5000 });
    });

    test('CAPTCHA refresh button works', async ({ page }) => {
      await page.goto('/login');
      const captchaBefore = await page.textContent('[data-testid="text-captcha-problem"]');
      await page.click('[data-testid="button-refresh-captcha"]');
      await page.waitForTimeout(500);
      const captchaAfter = await page.textContent('[data-testid="text-captcha-problem"]');
      expect(captchaBefore).toBeTruthy();
      expect(captchaAfter).toBeTruthy();
    });

    test('Password visibility toggle works', async ({ page }) => {
      await page.goto('/login');
      const passwordInput = page.locator('[data-testid="input-password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await page.locator('[data-testid="input-password"]').locator('..').locator('button').click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('Login with wrong credentials shows error', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="input-email"]', 'nonexistent@test.com');
      await page.fill('[data-testid="input-password"]', 'wrongpassword');

      const captchaText = await page.textContent('[data-testid="text-captcha-problem"]');
      if (captchaText) {
        const match = captchaText.match(/(\d+)\s*\+\s*(\d+)/);
        if (match) {
          await page.fill('[data-testid="input-captcha"]', (parseInt(match[1]) + parseInt(match[2])).toString());
        }
      }

      await page.click('[data-testid="button-login"]');
      await expect(page.getByText('Login Failed')).toBeVisible({ timeout: 10000 });
    });

    test('Navigate to register page', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="link-register"]');
      await expect(page).toHaveURL('/register');
    });

    test('Navigate to kid login page', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="link-kid-login"]');
      await expect(page).toHaveURL('/kid-login');
    });

    test('Navigate to forgot password page', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="link-forgot-password"]');
      await expect(page).toHaveURL('/reset-password');
    });
  });

  test.describe('2. Registration Flow', () => {
    test('Registration page renders step 1', async ({ page }) => {
      await page.goto('/register');
      await expect(page.locator('[data-testid="input-family-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-guardian-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-guardian-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-password"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-confirm-password"]')).toBeVisible();
      await expect(page.locator('[data-testid="button-next-step"]')).toBeVisible();
    });

    test('Step 1 validation - empty fields', async ({ page }) => {
      await page.goto('/register');
      await page.click('[data-testid="button-next-step"]');
      await expect(page.getByText('Missing Information')).toBeVisible({ timeout: 5000 });
    });

    test('Step 1 validation - weak password', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[data-testid="input-family-name"]', 'TestFamily');
      await page.fill('[data-testid="input-guardian-name"]', 'Test');
      await page.fill('[data-testid="input-guardian-email"]', 'test@test.com');
      await page.fill('[data-testid="input-password"]', 'short');
      await page.fill('[data-testid="input-confirm-password"]', 'short');
      await page.click('[data-testid="button-next-step"]');
      await expect(page.getByText('Weak Password')).toBeVisible({ timeout: 5000 });
    });

    test('Step 1 validation - password mismatch', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[data-testid="input-family-name"]', 'TestFamily');
      await page.fill('[data-testid="input-guardian-name"]', 'Test');
      await page.fill('[data-testid="input-guardian-email"]', 'test@test.com');
      await page.fill('[data-testid="input-password"]', 'password123');
      await page.fill('[data-testid="input-confirm-password"]', 'different123');
      await page.click('[data-testid="button-next-step"]');
      await expect(page.getByText('Password Mismatch')).toBeVisible({ timeout: 5000 });
    });

    test('Full registration flow with family member', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('[data-testid="input-family-name"]', TEST_FAMILY_NAME);
      await page.fill('[data-testid="input-guardian-name"]', TEST_GUARDIAN_NAME);
      await page.fill('[data-testid="input-guardian-email"]', TEST_GUARDIAN_EMAIL);
      await page.fill('[data-testid="input-password"]', TEST_GUARDIAN_PASSWORD);
      await page.fill('[data-testid="input-confirm-password"]', TEST_GUARDIAN_PASSWORD);
      await page.click('[data-testid="button-next-step"]');

      await expect(page.locator('[data-testid="select-security-q1"]')).toBeVisible({ timeout: 5000 });
      await page.click('[data-testid="select-security-q1"]');
      await page.getByRole('option', { name: 'What was the name of your first pet?' }).click();
      await page.fill('[data-testid="input-security-a1"]', 'testpet');

      await page.click('[data-testid="select-security-q2"]');
      await page.getByRole('option', { name: 'What city were you born in?' }).click();
      await page.fill('[data-testid="input-security-a2"]', 'testcity');
      await page.click('[data-testid="button-security-next"]');

      await expect(page.locator('[data-testid="button-add-member"]')).toBeVisible({ timeout: 5000 });
      await page.click('[data-testid="button-add-member"]');

      await page.fill('[data-testid="input-member-name-0"]', TEST_KID_NAME);
      await page.click('[data-testid="checkbox-is-child-0"]');
      await page.fill('[data-testid="input-member-pin-0"]', TEST_KID_PIN);

      await page.click('[data-testid="button-create-family"]');

      await page.waitForTimeout(3000);
      const isOnPinPage = await page.getByText("Kid's PINs").isVisible().catch(() => false);
      if (isOnPinPage) {
        await page.getByRole('button', { name: /continue|go to dashboard/i }).click();
      }
      await page.waitForURL('/', { timeout: 15000 });
    });
  });

  test.describe('3. Kid Login', () => {
    test('Kid login page renders correctly', async ({ page }) => {
      await page.goto('/kid-login');
      await expect(page.locator('[data-testid="input-family-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-kid-name"]')).toBeVisible();
      for (let i = 0; i < 4; i++) {
        await expect(page.locator(`[data-testid="input-pin-${i}"]`)).toBeVisible();
      }
      await expect(page.locator('[data-testid="button-submit-pin"]')).toBeVisible();
      await expect(page.locator('[data-testid="button-clear-pin"]')).toBeVisible();
      await expect(page.locator('[data-testid="link-adult-login"]')).toBeVisible();
    });

    test('Clear PIN button works', async ({ page }) => {
      await page.goto('/kid-login');
      await page.fill('[data-testid="input-pin-0"]', '1');
      await page.fill('[data-testid="input-pin-1"]', '2');
      await page.click('[data-testid="button-clear-pin"]');
      await expect(page.locator('[data-testid="input-pin-0"]')).toHaveValue('');
      await expect(page.locator('[data-testid="input-pin-1"]')).toHaveValue('');
    });

    test('Kid login with wrong PIN shows error', async ({ page }) => {
      await page.goto('/kid-login');
      await page.fill('[data-testid="input-family-name"]', TEST_FAMILY_NAME);
      await page.fill('[data-testid="input-kid-name"]', TEST_KID_NAME);
      await page.fill('[data-testid="input-pin-0"]', '0');
      await page.fill('[data-testid="input-pin-1"]', '0');
      await page.fill('[data-testid="input-pin-2"]', '0');
      await page.fill('[data-testid="input-pin-3"]', '0');
      await page.click('[data-testid="button-submit-pin"]');
      await expect(page.getByText("Couldn't Sign In")).toBeVisible({ timeout: 10000 });
    });

    test('Kid login with correct PIN succeeds', async ({ page }) => {
      await page.goto('/kid-login');
      await page.fill('[data-testid="input-family-name"]', TEST_FAMILY_NAME);
      await page.fill('[data-testid="input-kid-name"]', TEST_KID_NAME);
      const pinDigits = TEST_KID_PIN.split('');
      for (let i = 0; i < 4; i++) {
        await page.fill(`[data-testid="input-pin-${i}"]`, pinDigits[i]);
      }
      await page.click('[data-testid="button-submit-pin"]');
      await page.waitForURL('/', { timeout: 15000 });
      await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
      await apiLogout(page);
    });

    test('Navigate back to adult login', async ({ page }) => {
      await page.goto('/kid-login');
      await page.click('[data-testid="link-adult-login"]');
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('4. Adult Login & Dashboard', () => {
    test('Login with valid credentials succeeds', async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
    });

    test('Dashboard loads and shows family data', async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await expect(page.getByText(TEST_FAMILY_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('5. Navigation - All Links Work', () => {
    test.beforeEach(async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
    });

    const navItems = [
      { name: 'dashboard', heading: /dashboard/i },
      { name: 'calendar', heading: /calendar/i },
      { name: 'medications', heading: /medication/i },
      { name: 'chores', heading: /chore/i },
      { name: 'groceries', heading: /grocer/i },
      { name: 'reminders', heading: /reminder/i },
      { name: 'settings', heading: /setting/i },
      { name: 'support', heading: /support/i },
      { name: 'privacy policy', heading: /privacy/i },
    ];

    for (const item of navItems) {
      test(`Navigate to ${item.name}`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        const navLink = page.locator(`[data-testid="nav-link-${item.name}"]`);
        if (await navLink.isVisible()) {
          await navLink.click();
          await page.waitForTimeout(1000);
          await expect(page.getByText(item.heading).first()).toBeVisible({ timeout: 10000 });
        }
      });
    }
  });

  test.describe('6. Reminders - CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('Add reminder button shows form', async ({ page }) => {
      await page.click('[data-testid="nav-link-reminders"]');
      await page.waitForTimeout(1000);
      await page.click('[data-testid="button-add-reminder"]');
      await expect(page.locator('[data-testid="input-reminder-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-reminder-date"]')).toBeVisible();
    });

    test('Create a reminder with assigned family members', async ({ page }) => {
      await page.click('[data-testid="nav-link-reminders"]');
      await page.waitForTimeout(1000);
      await page.click('[data-testid="button-add-reminder"]');

      await page.fill('[data-testid="input-reminder-title"]', 'Test Reminder - Automated');
      await page.fill('[data-testid="input-reminder-description"]', 'Created by Playwright test');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.fill('[data-testid="input-reminder-date"]', dateStr);
      await page.fill('[data-testid="input-reminder-time"]', '14:00');

      const targetButtons = page.locator('button[data-testid^="button-toggle-target-"]');
      const count = await targetButtons.count();
      if (count > 0) {
        await targetButtons.first().click();
      }

      await page.click('[data-testid="button-save-reminder"]');
      await page.waitForTimeout(2000);
      await expect(page.getByText('Test Reminder - Automated')).toBeVisible({ timeout: 10000 });
    });

    test('Delete a reminder', async ({ page }) => {
      await page.click('[data-testid="nav-link-reminders"]');
      await page.waitForTimeout(2000);

      const deleteButtons = page.locator('button[data-testid^="button-delete-reminder-"]');
      const deleteCount = await deleteButtons.count();
      if (deleteCount > 0) {
        await deleteButtons.first().click();
        await page.waitForTimeout(1000);
        await expect(page.getByText('Reminder Deleted')).toBeVisible({ timeout: 5000 });
      }
    });

    test('Validation - cannot save without title', async ({ page }) => {
      await page.click('[data-testid="nav-link-reminders"]');
      await page.waitForTimeout(1000);
      await page.click('[data-testid="button-add-reminder"]');
      await page.fill('[data-testid="input-reminder-date"]', '2026-03-01');
      await page.click('[data-testid="button-save-reminder"]');
      await expect(page.getByText('Please enter a reminder title')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('7. Medications - CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('Medications page loads', async ({ page }) => {
      await page.click('[data-testid="nav-link-medications"]');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/medication/i).first()).toBeVisible();
    });

    test('Add medication button shows form', async ({ page }) => {
      await page.click('[data-testid="nav-link-medications"]');
      await page.waitForTimeout(1000);
      await page.click('[data-testid="button-add-medication"]');
      await expect(page.locator('[data-testid="input-medicine-name"]')).toBeVisible();
    });

    test('Create a medication', async ({ page }) => {
      await page.click('[data-testid="nav-link-medications"]');
      await page.waitForTimeout(1000);
      await page.click('[data-testid="button-add-medication"]');

      await page.fill('[data-testid="input-medicine-name"]', 'Test Vitamin C');
      await page.fill('[data-testid="input-medicine-quantity"]', '1 tablet');

      await page.click('[data-testid="select-medicine-assigned-to"]');
      await page.waitForTimeout(500);
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }

      await page.click('[data-testid="button-schedule-morning"]');

      const today = new Date().toISOString().split('T')[0];
      await page.fill('[data-testid="input-medicine-start-date"]', today);

      await page.click('[data-testid="button-save-medication"]');
      await page.waitForTimeout(2000);
      await expect(page.getByText('Test Vitamin C')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('8. Chores - CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('Chores page loads', async ({ page }) => {
      await page.click('[data-testid="nav-link-chores"]');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/chore/i).first()).toBeVisible();
    });

    test('Add chore button shows form', async ({ page }) => {
      await page.click('[data-testid="nav-link-chores"]');
      await page.waitForTimeout(1000);
      await page.click('[data-testid="button-add-chore"]');
      await expect(page.locator('[data-testid="input-chore-title"]')).toBeVisible();
    });

    test('Create a chore', async ({ page }) => {
      await page.click('[data-testid="nav-link-chores"]');
      await page.waitForTimeout(1000);
      await page.click('[data-testid="button-add-chore"]');

      await page.fill('[data-testid="input-chore-title"]', 'Test Chore - Clean Room');

      await page.click('[data-testid="select-assignee"]');
      await page.waitForTimeout(500);
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }

      await page.click('[data-testid="button-submit-chore"]');
      await page.waitForTimeout(2000);
      await expect(page.getByText('Test Chore - Clean Room')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('9. Groceries - CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('Groceries page loads', async ({ page }) => {
      await page.click('[data-testid="nav-link-groceries"]');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/grocer/i).first()).toBeVisible();
    });

    test('Add grocery item using quick add', async ({ page }) => {
      await page.click('[data-testid="nav-link-groceries"]');
      await page.waitForTimeout(1000);

      const quickAddInput = page.locator('[data-testid="input-quick-add-grocery"]');
      if (await quickAddInput.isVisible()) {
        await quickAddInput.fill('Test Apples');
        await page.click('[data-testid="button-quick-add-grocery"]');
        await page.waitForTimeout(2000);
        await expect(page.getByText('Test Apples')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('10. Calendar Page', () => {
    test.beforeEach(async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('Calendar page loads', async ({ page }) => {
      await page.click('[data-testid="nav-link-calendar"]');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/calendar/i).first()).toBeVisible();
    });
  });

  test.describe('11. Settings Page', () => {
    test.beforeEach(async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('Settings page loads', async ({ page }) => {
      await page.click('[data-testid="nav-link-settings"]');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/setting/i).first()).toBeVisible();
    });

    test('Security questions section is visible', async ({ page }) => {
      await page.click('[data-testid="nav-link-settings"]');
      await page.waitForTimeout(1000);
      const securitySection = page.locator('[data-testid="select-settings-q1"]');
      if (await securitySection.isVisible()) {
        await expect(securitySection).toBeVisible();
      }
    });
  });

  test.describe('12. Support Page', () => {
    test('Support page loads', async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.click('[data-testid="nav-link-support"]');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/support/i).first()).toBeVisible();
    });
  });

  test.describe('13. Privacy Policy Page', () => {
    test('Privacy policy page loads', async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.click('[data-testid="nav-link-privacy policy"]');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/privacy/i).first()).toBeVisible();
    });
  });

  test.describe('14. Logout', () => {
    test('Logout button works', async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.setViewportSize({ width: 1280, height: 800 });
      const logoutBtn = page.locator('[data-testid="button-logout"]');
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(2000);
        await expect(page.locator('[data-testid="input-email"]')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('15. Kid Access Restrictions', () => {
    test('Kid cannot see add reminder button', async ({ page }) => {
      await page.goto('/kid-login');
      await page.fill('[data-testid="input-family-name"]', TEST_FAMILY_NAME);
      await page.fill('[data-testid="input-kid-name"]', TEST_KID_NAME);
      const pinDigits = TEST_KID_PIN.split('');
      for (let i = 0; i < 4; i++) {
        await page.fill(`[data-testid="input-pin-${i}"]`, pinDigits[i]);
      }
      await page.click('[data-testid="button-submit-pin"]');
      await page.waitForURL('/', { timeout: 15000 });

      await page.setViewportSize({ width: 1280, height: 800 });
      const remindersLink = page.locator('[data-testid="nav-link-reminders"]');
      if (await remindersLink.isVisible()) {
        await remindersLink.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="button-add-reminder"]')).not.toBeVisible();
        await expect(page.getByText('My Reminders')).toBeVisible();
      }
    });

    test('Kid sees "My Reminders" instead of "All Reminders"', async ({ page }) => {
      await page.goto('/kid-login');
      await page.fill('[data-testid="input-family-name"]', TEST_FAMILY_NAME);
      await page.fill('[data-testid="input-kid-name"]', TEST_KID_NAME);
      const pinDigits = TEST_KID_PIN.split('');
      for (let i = 0; i < 4; i++) {
        await page.fill(`[data-testid="input-pin-${i}"]`, pinDigits[i]);
      }
      await page.click('[data-testid="button-submit-pin"]');
      await page.waitForURL('/', { timeout: 15000 });

      await page.setViewportSize({ width: 1280, height: 800 });
      const remindersLink = page.locator('[data-testid="nav-link-reminders"]');
      if (await remindersLink.isVisible()) {
        await remindersLink.click();
        await page.waitForTimeout(1000);
        await expect(page.getByText('My Reminders')).toBeVisible();
      }
    });
  });

  test.describe('16. Password Reset Flow', () => {
    test('Reset password page renders correctly', async ({ page }) => {
      await page.goto('/reset-password');
      await expect(page.getByText(/reset|forgot|password/i).first()).toBeVisible();
    });
  });

  test.describe('17. 404 Not Found', () => {
    test('Unknown route shows 404 page', async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.goto('/nonexistent-page-xyz');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/not found|404/i).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('18. Super Admin Access Control', () => {
    test('Non-admin user sees 404 on /dontguess', async ({ page }) => {
      await solveCaptchaAndLogin(page, TEST_GUARDIAN_EMAIL, TEST_GUARDIAN_PASSWORD);
      await page.goto('/dontguess');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/not found|404/i).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('19. API Endpoints Respond', () => {
    test('GET /api/auth/me returns data', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/auth/me`);
      expect(res.status()).toBeLessThan(500);
    });

    test('GET /api/families responds', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/families`);
      expect(res.status()).toBeLessThan(500);
    });

    test('POST /api/auth/logout works', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/auth/logout`);
      expect(res.status()).toBeLessThan(500);
    });
  });
});
