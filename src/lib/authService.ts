import type { User, Role } from '../types';

export const SUPER_ADMIN_EMAIL = 'deshithanayanajith@gmail.com';
export const SUPER_ADMIN_DEFAULT_PASSWORD = 'deshitha@123';

export const INITIAL_SUPER_ADMIN: User = {
  id: 'user-super-admin-01',
  name: 'Deshitha Nayanajith',
  username: SUPER_ADMIN_EMAIL,
  email: SUPER_ADMIN_EMAIL,
  password: SUPER_ADMIN_DEFAULT_PASSWORD,
  role: 'admin',
  isSuperAdmin: true,
  createdAt: new Date().toISOString(),
};

const USERS_STORAGE_KEY = 'welding_pos_system_users';
const SESSION_STORAGE_KEY = 'welding_pos_auth_user';

/**
 * Retrieve all registered users from storage, ensuring the super admin always exists.
 */
export function getRegisteredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      saveRegisteredUsers([INITIAL_SUPER_ADMIN]);
      return [INITIAL_SUPER_ADMIN];
    }
    const parsed: User[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveRegisteredUsers([INITIAL_SUPER_ADMIN]);
      return [INITIAL_SUPER_ADMIN];
    }

    // Ensure the designated super admin account is present and has admin role
    const superAdminExists = parsed.some(
      u => u.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    );
    if (!superAdminExists) {
      parsed.unshift(INITIAL_SUPER_ADMIN);
      saveRegisteredUsers(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load registered users:', err);
    return [INITIAL_SUPER_ADMIN];
  }
}

/**
 * Persist users list to storage
 */
export function saveRegisteredUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save registered users:', err);
  }
}

/**
 * Get active session user
 */
export function getStoredSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const user: User = JSON.parse(raw);
    if (!user || !user.email) return null;

    // Verify user still exists in registered users
    const allUsers = getRegisteredUsers();
    const existing = allUsers.find(
      u => u.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    );
    if (!existing) {
      clearStoredSession();
      return null;
    }
    // Return the updated data from storage (without returning password in session)
    const { password, ...safeUser } = existing;
    return safeUser as User;
  } catch (err) {
    console.error('Failed to load auth session:', err);
    return null;
  }
}

/**
 * Store active user session
 */
export function setStoredSession(user: User): void {
  try {
    const { password, ...safeUser } = user;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
  } catch (err) {
    console.error('Failed to save auth session:', err);
  }
}

/**
 * Clear session on logout
 */
export function clearStoredSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear auth session:', err);
  }
}

/**
 * Validate login credentials
 */
export function authenticateUser(emailOrUsername: string, passwordInput: string): { success: boolean; user?: User; error?: string } {
  const cleanIdentifier = emailOrUsername.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanIdentifier) {
    return { success: false, error: 'Please enter your username or email address.' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'Please enter your password.' };
  }

  const allUsers = getRegisteredUsers();
  const match = allUsers.find(
    u =>
      u.email.trim().toLowerCase() === cleanIdentifier ||
      u.username.trim().toLowerCase() === cleanIdentifier
  );

  if (!match) {
    return { success: false, error: 'Access denied: User email not registered. Please contact the administrator.' };
  }

  if (match.password !== cleanPassword) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  const { password, ...safeUser } = match;
  return { success: true, user: safeUser as User };
}

/**
 * Manually add a new authorized user
 */
export function registerNewUser(
  currentUser: User | null,
  newUser: { email: string; name: string; password?: string; role: Role }
): { success: boolean; user?: User; error?: string } {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Only an administrator can add new users.' };
  }

  const cleanEmail = newUser.email.trim().toLowerCase();
  const cleanName = newUser.name.trim();
  const cleanPassword = (newUser.password || 'welding@123').trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Please provide a full name for the user.' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'Password cannot be empty.' };
  }

  const allUsers = getRegisteredUsers();
  const exists = allUsers.some(u => u.email.trim().toLowerCase() === cleanEmail);
  if (exists) {
    return { success: false, error: `A user with email "${cleanEmail}" is already registered.` };
  }

  const userRecord: User = {
    id: 'user-' + Date.now(),
    name: cleanName,
    username: cleanEmail,
    email: cleanEmail,
    password: cleanPassword,
    role: newUser.role || 'staff',
    isSuperAdmin: false,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...allUsers, userRecord];
  saveRegisteredUsers(updatedUsers);

  const { password, ...safeUser } = userRecord;
  return { success: true, user: safeUser as User };
}

/**
 * Remove user access (cannot remove super admin)
 */
export function deleteRegisteredUser(
  currentUser: User | null,
  userIdToDelete: string
): { success: boolean; error?: string } {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Only an administrator can remove users.' };
  }

  const allUsers = getRegisteredUsers();
  const target = allUsers.find(u => u.id === userIdToDelete);
  if (!target) {
    return { success: false, error: 'User not found.' };
  }

  if (target.isSuperAdmin || target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { success: false, error: 'Cannot remove the primary Super Admin account.' };
  }

  if (target.id === currentUser.id) {
    return { success: false, error: 'You cannot remove your own active account.' };
  }

  const updatedUsers = allUsers.filter(u => u.id !== userIdToDelete);
  saveRegisteredUsers(updatedUsers);
  return { success: true };
}

/**
 * Update user password or role
 */
export function updateRegisteredUser(
  currentUser: User | null,
  userId: string,
  updates: Partial<Pick<User, 'name' | 'password' | 'role'>>
): { success: boolean; error?: string } {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Only an administrator can modify users.' };
  }

  const allUsers = getRegisteredUsers();
  const targetIndex = allUsers.findIndex(u => u.id === userId);
  if (targetIndex === -1) {
    return { success: false, error: 'User not found.' };
  }

  const target = allUsers[targetIndex];
  // Super admin role must remain admin
  const finalRole = (target.isSuperAdmin || target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())
    ? 'admin'
    : (updates.role || target.role);

  allUsers[targetIndex] = {
    ...target,
    name: updates.name ? updates.name.trim() : target.name,
    password: updates.password ? updates.password.trim() : target.password,
    role: finalRole,
  };

  saveRegisteredUsers(allUsers);
  return { success: true };
}
