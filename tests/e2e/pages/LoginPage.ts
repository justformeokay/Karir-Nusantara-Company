/**
 * Page Object Model: Login Page
 */

import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly pageContainer: Locator;
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageContainer = page.locator('[data-testid="login-page"]');
    this.loginForm = page.locator('[data-testid="login-form"]');
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('.text-red-500');
    this.forgotPasswordLink = page.locator('a[href*="forgot-password"]');
    this.registerLink = page.locator('a[href*="register"]');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.loginForm).toBeVisible({ timeout: 10000 });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL('/dashboard', { timeout: 15000 });
  }

  async expectErrorMessage() {
    await expect(this.errorMessage.first()).toBeVisible();
  }

  async navigateToForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL('/forgot-password');
  }

  async navigateToRegister() {
    await this.registerLink.click();
    await this.page.waitForURL('/register');
  }
}
