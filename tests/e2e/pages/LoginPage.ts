/**
 * Page Object Model: Login Page
 */

import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly passwordToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.forgotPasswordLink = page.locator('a[href*="forgot-password"]');
    this.registerLink = page.locator('a[href*="register"]');
    this.rememberMeCheckbox = page.locator('input[name="rememberMe"]');
    this.passwordToggle = page.locator('[data-testid="password-toggle"]');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL('/dashboard');
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectValidationError(field: string, message: string) {
    const fieldError = this.page.locator(`[data-testid="${field}-error"]`);
    await expect(fieldError).toContainText(message);
  }

  async togglePasswordVisibility() {
    await this.passwordToggle.click();
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
