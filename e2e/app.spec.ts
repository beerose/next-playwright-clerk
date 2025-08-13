import { createClerkClient } from "@clerk/backend";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect, Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

const TEST_EMAIL = process.env.TEST_EMAIL || "test+clerk_test@example.com";
const TEST_PHONE = process.env.TEST_PHONE_NUMBER || "+12015550100";
const TEST_OTP = process.env.TEST_OTP_CODE || "424242";

const expectProtected = async (page: import("@playwright/test").Page) => {
  await expect(page.locator("h1")).toContainText("This is a PROTECTED page");
};

const fillOtp = async (page: Page, code: string) => {
  const digits = code.split("");
  for (let i = 0; i < digits.length; i++) {
    await page.locator(`input[name=codeInput-${i}]`).fill(digits[i]);
  }
};

test.describe("auth flows", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test.afterAll(async () => {
    // Clean up the test user after all tests are done
    const users = await clerkClient.users.getUserList({
      emailAddress: [TEST_EMAIL],
      phoneNumber: [TEST_PHONE],
    });

    for (const user of users.data) {
      if (user.id) {
        await clerkClient.users.deleteUser(user.id);
      }
    }
  });

  test("sign up with email + code", async ({ page }) => {
    await page.goto("/sign-up");
    await clerk.loaded({ page });
    await page.waitForSelector(".cl-signUp-root", { state: "attached" });
    await page.locator("input[name=emailAddress]").fill(TEST_EMAIL);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForSelector(".cl-signUp-emailCode");
    await page.waitForTimeout(1000);
    await fillOtp(page, TEST_OTP);
    await page.waitForURL("**/protected");
    await expectProtected(page);
  });

  test("sign in with email + code", async ({ page }) => {
    await page.goto("/protected");
    await expect(page.locator("h1")).toContainText("Sign In");
    await page.waitForSelector(".cl-signIn-root", { state: "attached" });
    await page.locator("input[name=identifier]").fill(TEST_EMAIL);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForSelector(".cl-signIn-emailCode", { state: "attached" });
    await page.waitForTimeout(1000);
    await fillOtp(page, TEST_OTP);
    await page.waitForURL("**/protected");
    await expectProtected(page);
  });

  test("sign in with email using helper", async ({ page }) => {
    await page.goto("/");
    await clerk.signIn({
      page,
      signInParams: { strategy: "email_code", identifier: TEST_EMAIL },
    });
    await page.goto("/protected");
    await expectProtected(page);
  });

  test("sign up with phone + code", async ({ page }) => {
    await page.goto("/sign-up");
    await clerk.loaded({ page });
    await page.waitForSelector(".cl-signUp-root", { state: "attached" });
    await page.getByRole("link", { name: /Use phone/ }).click();
    await page.locator("input[name=phoneNumber]").fill(TEST_PHONE);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForSelector(".cl-signUp-phoneCode", { state: "attached" });
    await page.waitForTimeout(1000);
    await fillOtp(page, TEST_OTP);
    await page.waitForURL("**/protected");
    await expectProtected(page);
  });

  test("sign in with phone + code", async ({ page }) => {
    await page.goto("/protected");
    await expect(page.locator("h1")).toContainText("Sign In");
    await page.waitForSelector(".cl-signIn-root", { state: "attached" });
    await page.getByRole("link", { name: /Use phone/ }).click();
    await page.locator("input[name=identifier]").fill(TEST_PHONE);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForSelector(".cl-signIn-phoneCode", { state: "attached" });
    await page.waitForTimeout(1000);
    await fillOtp(page, TEST_OTP);
    await page.waitForURL("**/protected");
    await expectProtected(page);
  });

  test("sign in with phone using helper", async ({ page }) => {
    await page.goto("/");
    await clerk.signIn({
      page,
      signInParams: { strategy: "phone_code", identifier: TEST_PHONE },
    });
    await page.goto("/protected");
    await expectProtected(page);
  });

  test("sign out using helpers", async ({ page }) => {
    await page.goto("/");
    await clerk.signIn({
      page,
      signInParams: { strategy: "phone_code", identifier: TEST_PHONE },
    });
    await page.goto("/protected");
    await expectProtected(page);
    await clerk.signOut({ page });
    await page.goto("/protected");
    await page.waitForSelector("h1:has-text('Sign in')");
  });
});
