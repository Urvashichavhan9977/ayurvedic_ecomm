// Compatibility shim: admin pages import `contactApi` (singular).
// Re-export the admin contacts implementation in contactsApi.js to provide
// list/get/updateStatus/remove without duplicating code.
import { contactsApi } from './contactsApi'

export const contactApi = contactsApi
