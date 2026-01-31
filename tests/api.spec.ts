import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should return health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });

  test('should get families', async ({ request }) => {
    const response = await request.get('/api/families');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should get users', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});

test.describe('Chores API', () => {
  let familyId: string;

  test.beforeAll(async ({ request }) => {
    const families = await request.get('/api/families');
    const familiesData = await families.json();
    if (familiesData.length > 0) {
      familyId = familiesData[0].id;
    }
  });

  test('should get chores for family', async ({ request }) => {
    if (!familyId) {
      test.skip();
      return;
    }
    const response = await request.get(`/api/families/${familyId}/chores`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});

test.describe('Medications API', () => {
  let familyId: string;

  test.beforeAll(async ({ request }) => {
    const families = await request.get('/api/families');
    const familiesData = await families.json();
    if (familiesData.length > 0) {
      familyId = familiesData[0].id;
    }
  });

  test('should get medications for family', async ({ request }) => {
    if (!familyId) {
      test.skip();
      return;
    }
    const response = await request.get(`/api/families/${familyId}/medicines`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});

test.describe('Groceries API', () => {
  let familyId: string;

  test.beforeAll(async ({ request }) => {
    const families = await request.get('/api/families');
    const familiesData = await families.json();
    if (familiesData.length > 0) {
      familyId = familiesData[0].id;
    }
  });

  test('should get grocery items for family', async ({ request }) => {
    if (!familyId) {
      test.skip();
      return;
    }
    const response = await request.get(`/api/families/${familyId}/groceries`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});
