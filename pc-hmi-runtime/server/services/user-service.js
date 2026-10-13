// UserService — accounts, login/session, and account-management actions. As of 2026-09-03
// this is built on top of GroupService: a user carries `groups: [groupId, ...]` (can belong
// to more than one group at once) instead of a single fixed `role` string, and their
// effective security level is always computed live from GroupService.getLevel(groups) rather
// than stored — so editing a group's level instantly changes what every member of that group
// can do, without touching a single user record.
const crypto = require('node:crypto');
const { AsyncLocalStorage } = require('node:async_hooks');

// Logins are per client: each successful login gets a random token (sent back by the browser
// in the X-HMI-Session header), and server/index.js runs every request inside
// runWithSession(token) so getCurrentUser()/canAccess() see only that client's login.
// Module-level so sessions survive the UserService being rebuilt on a project reload.
const sessionContext = new AsyncLocalStorage();
const sessions = new Map(); // token -> username

class UserService {
  constructor(users = [], groupService) {
    this.users = users;
    this.groupService = groupService;
  }

  static runWithSession(token, fn) {
    return sessionContext.run({ token: token ? String(token) : '' }, fn);
  }

  static currentToken() {
    return sessionContext.getStore()?.token || '';
  }

  // Live summary for a session token, or null if the token is unknown or its account has since
  // been deleted, disabled or locked.
  userForToken(token) {
    const username = token ? sessions.get(token) : null;
    const user = username ? this.findUser(username) : null;
    if (!user || user.enabled === false || user.locked) return null;
    return this.summarize(user);
  }

  isCurrentUser(username) {
    const current = this.getCurrentUser();
    return Boolean(current) && current.username.toLowerCase() === String(username).trim().toLowerCase();
  }

  endSessionsFor(username) {
    const name = String(username).trim().toLowerCase();
    for (const [token, owner] of sessions) {
      if (owner.toLowerCase() === name) sessions.delete(token);
    }
  }

  // One-time migration for users saved before groups existed (a lone `role`/`level` string,
  // no `groups` array yet). Maps the old role name onto the matching built-in group (by name,
  // case-insensitively) so a migrated user keeps the exact same effective level they had
  // before; an unrecognized/missing role falls back to the lowest-level built-in group.
  // Mutates the array in place and also returns { users, changed }. Safe to call every load —
  // a user that already has a `groups` array is left untouched. `changed` matters: the caller
  // (server/index.js's loadProjectRuntimeInner) must persist the result back to project.json
  // as soon as it's true, NOT wait for some unrelated user-mutation route to happen to save it
  // later — Studio reads project.json directly and independently of this runtime service, and
  // its own "can't delete a group that's still in use" guard only understands the new `groups`
  // array shape. Leaving a migrated-in-memory-only project on disk in the old shape would let
  // Studio's guard silently miscount legacy users as having zero group memberships, allowing a
  // built-in group that's actually still in use to be deleted from Studio.
  static migrateLegacyUsers(users, groupService) {
    let changed = false;
    const fallbackGroup = groupService.listGroups().sort((a, b) => a.level - b.level)[0];
    for (const user of users) {
      if (Array.isArray(user.groups)) continue;
      changed = true;
      let group = null;
      if (user.role) {
        // The old ROLE_LEVELS keys were singular ("Operator"/"Engineer"/"Administrator");
        // the built-in groups are plural ("Operators"/"Engineers"/"Administrators") to read
        // naturally as a group name. Try the exact saved role name first (covers a project
        // that already happened to match a real group), then the singular->plural map
        // (case-insensitive), so an existing Administrator lands in "Administrators" and NOT
        // silently in the lowest-level fallback group — get this wrong and every real admin
        // gets demoted on first load.
        const mappedName = UserService.LEGACY_ROLE_TO_GROUP_NAME[String(user.role).trim().toLowerCase()];
        group = groupService.findGroup(user.role) || groupService.findGroup(mappedName);
      }
      if (!group && Number.isFinite(user.level)) {
        // Last resort for a role string that doesn't match anything: fall back by the old
        // numeric level instead of guessing, so a legacy Administrator (level 3) still lands
        // in whichever built-in group actually carries level 3, even under a renamed project.
        group = groupService.listGroups().find((g) => g.level === user.level) || null;
      }
      user.groups = [group ? group.id : fallbackGroup?.id].filter(Boolean);
      delete user.role;
      delete user.level;
    }
    return { users, changed };
  }

  findUser(username) {
    const name = String(username || '').trim();
    if (!name) return null;
    return this.users.find((u) => u.username.toLowerCase() === name.toLowerCase()) || null;
  }

  // Builds the small public-facing summary of a user record used in every method's response
  // and in the `user-list-changed` broadcast — never includes the password, always includes
  // the live-computed level/role label alongside the raw `groups` id list so a UI can show
  // either (a simple level number, or the actual group names via a separate groups lookup).
  summarize(user) {
    return {
      username: user.username,
      groups: [...(user.groups || [])],
      level: this.groupService.getLevel(user.groups),
      role: this.groupService.primaryGroupName(user.groups),
      enabled: user.enabled !== false,
      locked: Boolean(user.locked)
    };
  }

  login(username, password) {
    const user = this.users.find((u) => u.username === username);
    if (!user) return { success: false, error: 'Invalid credentials' };
    if (user.locked) {
      return { success: false, error: 'This account is locked. Ask an administrator to unlock it.' };
    }
    if (user.enabled === false) {
      return { success: false, error: 'This account is disabled. Ask an administrator to enable it.' };
    }
    if (user.password !== password) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= UserService.MAX_FAILED_ATTEMPTS) {
        user.locked = true;
        return { success: false, error: 'Too many failed attempts — account locked. Ask an administrator to unlock it.' };
      }
      return { success: false, error: 'Invalid credentials' };
    }
    user.failedAttempts = 0;
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, user.username);
    return { success: true, user: this.summarize(user), token };
  }

  logout() {
    sessions.delete(UserService.currentToken());
  }

  getCurrentUser() {
    return this.userForToken(UserService.currentToken());
  }

  // Computed live from the session's user record and current group levels, so a group or
  // membership edit takes effect immediately for every logged-in session.
  canAccess(requiredLevel) {
    if (!requiredLevel) return true;
    const current = this.getCurrentUser();
    if (!current) return false;
    return this.groupService.getLevel(current.groups) >= requiredLevel;
  }

  // Generic alias for canAccess, matching the standard "CheckAccess" HMI command name — same
  // behavior, just the name a protected button/screen check reads more naturally as.
  checkAccess(requiredLevel) {
    return this.canAccess(requiredLevel);
  }

  addUser({ username, password, groups } = {}) {
    const name = String(username || '').trim();
    const pass = String(password || '');
    if (!name) return { success: false, error: 'Username is required' };
    if (!pass) return { success: false, error: 'Password is required' };
    if (this.findUser(name)) {
      return { success: false, error: 'A user with that username already exists' };
    }
    const requested = Array.isArray(groups) && groups.length ? groups : [UserService.defaultGroupName];
    const resolved = this.groupService.resolveGroupIds(requested);
    if (!resolved.success) return resolved;
    const user = {
      username: name,
      password: pass,
      groups: resolved.groupIds,
      enabled: true,
      locked: false,
      failedAttempts: 0
    };
    this.users.push(user);
    return { success: true, user: this.summarize(user) };
  }

  deleteUser({ username } = {}) {
    const name = String(username || '').trim();
    if (!name) return { success: false, error: 'Username is required' };
    const idx = this.users.findIndex((u) => u.username.toLowerCase() === name.toLowerCase());
    if (idx === -1) return { success: false, error: `No user found with the username "${name}"` };
    const loggedOutSelf = this.isCurrentUser(name);
    const [removed] = this.users.splice(idx, 1);
    this.endSessionsFor(name);
    return { success: true, user: this.summarize(removed), loggedOutSelf };
  }

  unlockUser({ username } = {}) {
    const name = String(username || '').trim();
    if (!name) return { success: false, error: 'Username is required' };
    const user = this.findUser(name);
    if (!user) return { success: false, error: `No user found with the username "${name}"` };
    if (!user.locked) return { success: false, error: `User "${user.username}" is not locked` };
    user.locked = false;
    user.failedAttempts = 0;
    return { success: true, user: this.summarize(user) };
  }

  setUserEnabled({ username, enabled } = {}) {
    const name = String(username || '').trim();
    if (!name) return { success: false, error: 'Username is required' };
    const user = this.findUser(name);
    if (!user) return { success: false, error: `No user found with the username "${name}"` };
    const nextEnabled = Boolean(enabled);
    const currentlyEnabled = user.enabled !== false;
    if (currentlyEnabled === nextEnabled) {
      return { success: false, error: `User "${user.username}" is already ${nextEnabled ? 'enabled' : 'disabled'}` };
    }
    const loggedOutSelf = !nextEnabled && this.isCurrentUser(name);
    user.enabled = nextEnabled;
    if (!nextEnabled) this.endSessionsFor(name);
    return { success: true, user: this.summarize(user), loggedOutSelf };
  }

  // Full-replace a user's group membership set — the bulk "Modify Group Membership" action.
  // For granular single add/remove, see addUserToGroup/removeUserFromGroup below.
  modifyGroup({ username, groups } = {}) {
    const name = String(username || '').trim();
    if (!name) return { success: false, error: 'Username is required' };
    if (!Array.isArray(groups) || !groups.length) return { success: false, error: 'At least one group is required' };
    const user = this.findUser(name);
    if (!user) return { success: false, error: `No user found with the username "${name}"` };
    const resolved = this.groupService.resolveGroupIds(groups);
    if (!resolved.success) return resolved;
    user.groups = resolved.groupIds;
    return { success: true, user: this.summarize(user) };
  }

  addUserToGroup({ username, group } = {}) {
    const name = String(username || '').trim();
    if (!name) return { success: false, error: 'Username is required' };
    const user = this.findUser(name);
    if (!user) return { success: false, error: `No user found with the username "${name}"` };
    const g = this.groupService.findGroup(group);
    if (!g) return { success: false, error: `No group found named/id "${group}"` };
    user.groups = Array.isArray(user.groups) ? user.groups : [];
    if (user.groups.includes(g.id)) {
      return { success: false, error: `User "${user.username}" is already in "${g.name}"` };
    }
    user.groups.push(g.id);
    return { success: true, user: this.summarize(user) };
  }

  removeUserFromGroup({ username, group } = {}) {
    const name = String(username || '').trim();
    if (!name) return { success: false, error: 'Username is required' };
    const user = this.findUser(name);
    if (!user) return { success: false, error: `No user found with the username "${name}"` };
    const g = this.groupService.findGroup(group);
    if (!g) return { success: false, error: `No group found named/id "${group}"` };
    const idx = (user.groups || []).indexOf(g.id);
    if (idx === -1) return { success: false, error: `User "${user.username}" is not in "${g.name}"` };
    user.groups.splice(idx, 1);
    return { success: true, user: this.summarize(user) };
  }

  changePassword({ username, password } = {}) {
    const name = String(username || '').trim();
    const pass = String(password || '');
    if (!name) return { success: false, error: 'Username is required' };
    if (!pass) return { success: false, error: 'New password is required' };
    const user = this.findUser(name);
    if (!user) return { success: false, error: `No user found with the username "${name}"` };
    user.password = pass;
    return { success: true, user: this.summarize(user) };
  }

  changeUserProperties({ username, groups, enabled } = {}) {
    const name = String(username || '').trim();
    if (!name) return { success: false, error: 'Username is required' };
    const user = this.findUser(name);
    if (!user) return { success: false, error: `No user found with the username "${name}"` };
    if (groups !== undefined) {
      if (!Array.isArray(groups) || !groups.length) return { success: false, error: 'At least one group is required' };
      const resolved = this.groupService.resolveGroupIds(groups);
      if (!resolved.success) return resolved;
      user.groups = resolved.groupIds;
    }
    let loggedOutSelf = false;
    if (enabled !== undefined) {
      const nextEnabled = Boolean(enabled);
      loggedOutSelf = !nextEnabled && this.isCurrentUser(name);
      user.enabled = nextEnabled;
      if (!nextEnabled) this.endSessionsFor(name);
    }
    return { success: true, user: this.summarize(user), loggedOutSelf };
  }

  // Names still referencing a given group id — passed to GroupService.deleteGroup so a group
  // in use can never be deleted out from under its members.
  usersInGroup(groupId) {
    return this.users.filter((u) => Array.isArray(u.groups) && u.groups.includes(groupId)).map((u) => u.username);
  }
}

// Name of the built-in group new users default into when no groups are specified — matches
// the old default role ('Operator' -> the 'Operators' built-in group).
UserService.defaultGroupName = 'Operators';

// Maps the old (pre-groups) singular role strings, lowercased, to the plural built-in group
// name that replaces them — used only by migrateLegacyUsers, above.
UserService.LEGACY_ROLE_TO_GROUP_NAME = {
  operator: 'Operators',
  engineer: 'Engineers',
  administrator: 'Administrators'
};
UserService.MAX_FAILED_ATTEMPTS = 5;

module.exports = { UserService };
