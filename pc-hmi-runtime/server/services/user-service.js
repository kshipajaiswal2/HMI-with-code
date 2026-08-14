class UserService {
  constructor(users = []) {
    this.users = users;
    this.currentUser = null;
  }

  login(username, password) {
    const user = this.users.find(
      (u) => u.username === username && u.password === password && u.enabled !== false
    );
    if (!user) return { success: false, error: 'Invalid credentials or user is disabled' };
    this.currentUser = { username: user.username, role: user.role, level: user.level, group: user.group };
    return { success: true, user: this.currentUser };
  }

  logout() {
    this.currentUser = null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  canAccess(requiredLevel) {
    if (!requiredLevel) return true;
    if (!this.currentUser) return requiredLevel === 0;
    return this.currentUser.level >= requiredLevel;
  }

  getAllUsers() {
    return this.users.map(u => ({
      username: u.username,
      role: u.role,
      level: u.level,
      group: u.group,
      enabled: u.enabled !== false
    }));
  }

  addUser(username, password, group = 'Operators') {
    if (this.users.find(u => u.username === username)) {
      return { success: false, error: `User '${username}' already exists` };
    }
    const newUser = {
      username,
      password,
      role: 'operator',
      level: 1,
      group,
      enabled: true
    };
    this.users.push(newUser);
    return { success: true, user: newUser };
  }

  deleteUser(username) {
    const idx = this.users.findIndex(u => u.username === username);
    if (idx === -1) {
      return { success: false, error: `User '${username}' not found` };
    }
    if (this.currentUser?.username === username) {
      return { success: false, error: 'Cannot delete the currently logged-in user' };
    }
    this.users.splice(idx, 1);
    return { success: true, message: `User '${username}' deleted` };
  }

  enableUser(username) {
    const user = this.users.find(u => u.username === username);
    if (!user) {
      return { success: false, error: `User '${username}' not found` };
    }
    user.enabled = true;
    return { success: true, message: `User '${username}' enabled` };
  }

  disableUser(username) {
    const user = this.users.find(u => u.username === username);
    if (!user) {
      return { success: false, error: `User '${username}' not found` };
    }
    if (this.currentUser?.username === username) {
      return { success: false, error: 'Cannot disable the currently logged-in user' };
    }
    user.enabled = false;
    return { success: true, message: `User '${username}' disabled` };
  }

  changePassword(username, newPassword) {
    const user = this.users.find(u => u.username === username);
    if (!user) {
      return { success: false, error: `User '${username}' not found` };
    }
    user.password = newPassword;
    return { success: true, message: `Password for '${username}' changed` };
  }

  changeGroup(username, group) {
    const user = this.users.find(u => u.username === username);
    if (!user) {
      return { success: false, error: `User '${username}' not found` };
    }
    user.group = group || 'Operators';
    return { success: true, message: `User '${username}' group changed to '${user.group}'` };
  }
}

module.exports = { UserService };
