import { type Page, type APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const TEST_FAMILY_NAME = `TestFamily_${Date.now()}`;
const TEST_GUARDIAN_EMAIL = `test_${Date.now()}@testfamily.com`;
const TEST_GUARDIAN_PASSWORD = 'TestPass123!';
const TEST_GUARDIAN_NAME = 'Test Guardian';
const TEST_KID_NAME = 'Test Kid';
const TEST_KID_PIN = '9876';

export const TEST_DATA = {
  familyName: TEST_FAMILY_NAME,
  guardianEmail: TEST_GUARDIAN_EMAIL,
  guardianPassword: TEST_GUARDIAN_PASSWORD,
  guardianName: TEST_GUARDIAN_NAME,
  kidName: TEST_KID_NAME,
  kidPin: TEST_KID_PIN,
};

export async function registerTestFamily(request: APIRequestContext) {
  const res = await request.post(`${BASE_URL}/api/auth/register`, {
    data: {
      familyName: TEST_DATA.familyName,
      guardianName: TEST_DATA.guardianName,
      guardianEmail: TEST_DATA.guardianEmail,
      password: TEST_DATA.guardianPassword,
      securityQuestion1: 'What was the name of your first pet?',
      securityAnswer1: 'testpet',
      securityQuestion2: 'What city were you born in?',
      securityAnswer2: 'testcity',
      members: [
        {
          name: TEST_DATA.kidName,
          isChild: true,
          pin: TEST_DATA.kidPin,
        },
      ],
    },
  });
  return res;
}

export async function loginAsAdult(page: Page) {
  await page.goto('/login');
  await page.waitForSelector('[data-testid="input-email"]', { timeout: 10000 });

  await page.fill('[data-testid="input-email"]', TEST_DATA.guardianEmail);
  await page.fill('[data-testid="input-password"]', TEST_DATA.guardianPassword);

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

export async function loginAsKid(page: Page) {
  await page.goto('/kid-login');
  await page.waitForSelector('[data-testid="input-family-name"]', { timeout: 10000 });

  await page.fill('[data-testid="input-family-name"]', TEST_DATA.familyName);
  await page.fill('[data-testid="input-kid-name"]', TEST_DATA.kidName);

  const pinDigits = TEST_DATA.kidPin.split('');
  for (let i = 0; i < 4; i++) {
    await page.fill(`[data-testid="input-pin-${i}"]`, pinDigits[i]);
  }

  await page.click('[data-testid="button-submit-pin"]');
  await page.waitForURL('/', { timeout: 15000 });
}

export async function logout(page: Page) {
  const logoutBtn = page.locator('[data-testid="button-logout"]');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL(/\/(login)?$/, { timeout: 10000 });
  } else {
    await page.goto('/');
    await page.evaluate(() => {
      return fetch('/api/auth/logout', { method: 'POST' });
    });
    await page.goto('/login');
  }
}
