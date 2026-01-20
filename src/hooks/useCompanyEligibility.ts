import { Company } from '@/types'

export interface CompanyEligibilityError {
  code: string
  message: string
  details?: string
}

export function useCompanyEligibility() {
  const checkProfileCompletion = (company: Company | undefined): CompanyEligibilityError | null => {
    if (!company) {
      return {
        code: 'COMPANY_NOT_FOUND',
        message: 'Data perusahaan tidak ditemukan'
      }
    }

    // Check basic profile fields
    if (!company.company_name) {
      return {
        code: 'INCOMPLETE_PROFILE',
        message: 'Lengkapi profil perusahaan terlebih dahulu',
        details: 'Nama perusahaan harus diisi'
      }
    }

    if (!company.company_description) {
      return {
        code: 'INCOMPLETE_PROFILE',
        message: 'Lengkapi profil perusahaan terlebih dahulu',
        details: 'Deskripsi perusahaan harus diisi'
      }
    }

    if (!company.company_website) {
      return {
        code: 'INCOMPLETE_PROFILE',
        message: 'Lengkapi profil perusahaan terlebih dahulu',
        details: 'Website perusahaan harus diisi'
      }
    }

    if (!company.company_industry) {
      return {
        code: 'INCOMPLETE_PROFILE',
        message: 'Lengkapi profil perusahaan terlebih dahulu',
        details: 'Industri perusahaan harus dipilih'
      }
    }

    if (!company.company_size) {
      return {
        code: 'INCOMPLETE_PROFILE',
        message: 'Lengkapi profil perusahaan terlebih dahulu',
        details: 'Ukuran perusahaan harus dipilih'
      }
    }

    if (!company.company_location) {
      return {
        code: 'INCOMPLETE_PROFILE',
        message: 'Lengkapi profil perusahaan terlebih dahulu',
        details: 'Lokasi perusahaan harus diisi'
      }
    }

    return null
  }

  const checkDocumentsUploaded = (company: Company | undefined): CompanyEligibilityError | null => {
    if (!company) {
      return {
        code: 'COMPANY_NOT_FOUND',
        message: 'Data perusahaan tidak ditemukan'
      }
    }

    const missingDocs: string[] = []

    if (!company.ktp_founder_url) {
      missingDocs.push('KTP Pendiri')
    }
    if (!company.akta_pendirian_url) {
      missingDocs.push('Akta Pendirian')
    }
    if (!company.npwp_url) {
      missingDocs.push('NPWP')
    }
    if (!company.nib_url) {
      missingDocs.push('NIB')
    }

    if (missingDocs.length > 0) {
      return {
        code: 'MISSING_DOCUMENTS',
        message: 'Unggah semua dokumen yang diperlukan',
        details: `Dokumen yang belum diunggah: ${missingDocs.join(', ')}`
      }
    }

    return null
  }

  const checkVerification = (company: Company | undefined): CompanyEligibilityError | null => {
    if (!company) {
      return {
        code: 'COMPANY_NOT_FOUND',
        message: 'Data perusahaan tidak ditemukan'
      }
    }

    // Check if documents are verified
    if (company.verification_status === 'pending') {
      return {
        code: 'PENDING_VERIFICATION',
        message: 'Admin sedang memverifikasi dokumen Anda',
        details: 'Silakan menunggu verifikasi dokumen (1-2 hari kerja)'
      }
    }

    if (company.verification_status === 'rejected') {
      return {
        code: 'VERIFICATION_REJECTED',
        message: 'Dokumen Anda ditolak oleh admin',
        details: 'Silakan upload ulang dokumen yang sesuai'
      }
    }

    if (company.verification_status === 'suspended') {
      return {
        code: 'ACCOUNT_SUSPENDED',
        message: 'Akun perusahaan Anda di-suspend',
        details: 'Hubungi admin untuk informasi lebih lanjut'
      }
    }

    if (company.verification_status !== 'verified') {
      return {
        code: 'NOT_VERIFIED',
        message: 'Perusahaan belum diverifikasi oleh admin'
      }
    }

    return null
  }

  const canCreateJobs = (company: Company | undefined): { canCreate: boolean; error: CompanyEligibilityError | null } => {
    // Check profile completion
    const profileError = checkProfileCompletion(company)
    if (profileError) {
      return { canCreate: false, error: profileError }
    }

    // Check documents uploaded
    const documentsError = checkDocumentsUploaded(company)
    if (documentsError) {
      return { canCreate: false, error: documentsError }
    }

    // Check verification status
    const verificationError = checkVerification(company)
    if (verificationError) {
      return { canCreate: false, error: verificationError }
    }

    return { canCreate: true, error: null }
  }

  return {
    checkProfileCompletion,
    checkDocumentsUploaded,
    checkVerification,
    canCreateJobs
  }
}
