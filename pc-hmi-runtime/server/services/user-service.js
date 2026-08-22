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
}

module.exports = { UserService };
