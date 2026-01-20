import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const token = useAuthStore.getState().token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    // Handle 204 No Content response
    if (response.status === 204) {
      return { success: true } as T
    }

    return response.json()
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params)
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      ...options,
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params)
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params)
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params)
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params)
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
      ...options,
    })
    return this.handleResponse<T>(response)
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = useAuthStore.getState().token
    const headers: HeadersInit = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    return this.handleResponse<T>(response)
  }
}

export const api = new ApiClient(API_BASE_URL)
