import { api } from './client'

export const policiesApi = {
  // Download privacy policy PDF
  downloadPrivacyPolicyPDF: async (): Promise<void> => {
    const blob = await api.download('/policies/privacy-policy/pdf')
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kebijakan_privasi_karir_nusantara_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  },

  // Download terms of service PDF
  downloadTermsOfServicePDF: async (): Promise<void> => {
    const blob = await api.download('/policies/terms-of-service/pdf')
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `terms_of_service_karir_nusantara_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  },
}
