const SESSION_KEY = 'copiloto-admin-session';
export function hasAdminSession(){return sessionStorage.getItem(SESSION_KEY)==='active'}
export function startAdminSession(){sessionStorage.setItem(SESSION_KEY,'active')}
export function endAdminSession(){sessionStorage.removeItem(SESSION_KEY)}
