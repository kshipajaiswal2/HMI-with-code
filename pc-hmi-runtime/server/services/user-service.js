class UserService {
  constructor(users = []) {
    this.users = users;
    this.currentUser = null;
  }

  login(username, password) {
    const user = this.users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) return { success: false, error: 'Invalid credentials' };
    this.currentUser = { username: user.username, role: user.role, level: user.level };
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

  addUser({ username, password, role, level } = {}) {
    const name = String(username || '').trim();
    const pass = String(password || '');
    if (!name) return { success: false, error: 'Username is required' };
    if (!pass) return { success: false, error: 'Password is required' };
    if (this.users.some((u) => u.username.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: 'A user with that username already exists' };
    }
    const resolvedRole = role || 'Operator';
    const resolvedLevel = Number.isFinite(level) ? level : UserService.ROLE_LEVELS[resolvedRole] ?? 1;
    const user = { username: name, password: pass, role: resolvedRole, level: resolvedLevel };
    this.users.push(user);
    return { success: true, user: { username: user.username, role: user.role, level: user.level } };
  }

  deleteUser({ username } = {}) {
    const name = String(username || '').trim();
    if (!name) return { success: false, error: 'Username is required' };
    const idx = this.users.findIndex((u) => u.username.toLowerCase() === name.toLowerCase());
    if (idx === -1) return { success: false, error: `No user found with the username "${name}"` };
    const [removed] = this.users.splice(idx, 1);
    let loggedOutSelf = false;
    if (this.currentUser && this.currentUser.username.toLowerCase() === name.toLowerCase()) {
      this.currentUser = null;
      loggedOutSelf = true;
    }
    return {
      success: true,
      user: { username: removed.username, role: removed.role, level: removed.level },
      loggedOutSelf
    };
  }
}

UserService.ROLE_LEVELS = { Operator: 1, Engineer: 2, Administrator: 3 };

module.exports = { UserService };
