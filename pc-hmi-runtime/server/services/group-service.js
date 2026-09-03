// GroupService — real, editable Groups for PlantHMI's User Management, replacing the old
// fixed 3-role model. A Group is {id, name, level, builtIn}. A user now belongs to zero or
// more groups (UserService stores `groups: [groupId, ...]` per user); a user's effective
// security level is the HIGHEST level among the groups they belong to — mirrors how
// FactoryTalk resolves permissions when a user is a member of more than one group.
//
// `level` is a simple ordered rank (matches the existing screen `securityLevel` field and
// UserService.canAccess semantics) rather than independent named permission codes — chosen
// deliberately to stay consistent with what's already wired into screens, and because it's
// far simpler to build/reason about than a full named-permission-code editor.
class GroupService {
  constructor(groups = []) {
    this.groups = Array.isArray(groups) && groups.length ? groups : GroupService.defaultGroups();
  }

  static defaultGroups() {
    // Matches the levels the old hardcoded UserService.ROLE_LEVELS used, so migrating an
    // existing project's users (see UserService.migrateLegacyUsers) lands them in a group
    // with the exact same effective level they had before.
    return [
      { id: 'administrators', name: 'Administrators', level: 3, builtIn: true },
      { id: 'engineers', name: 'Engineers', level: 2, builtIn: true },
      { id: 'operators', name: 'Operators', level: 1, builtIn: true }
    ];
  }

  listGroups() {
    return this.groups.map((g) => ({ ...g })).sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
  }

  findGroup(idOrName) {
    if (!idOrName) return null;
    const needle = String(idOrName).trim().toLowerCase();
    if (!needle) return null;
    return this.groups.find((g) => g.id.toLowerCase() === needle || g.name.toLowerCase() === needle) || null;
  }

  // Effective level for a user's group-membership list — the highest level among the groups
  // that still exist (a stale/deleted group id in a user's `groups` array is simply ignored,
  // never throws, since project data can drift and this must stay robust at runtime).
  getLevel(groupIds) {
    if (!Array.isArray(groupIds) || !groupIds.length) return 0;
    let max = 0;
    for (const id of groupIds) {
      const g = this.findGroup(id);
      if (g && g.level > max) max = g.level;
    }
    return max;
  }

  // Display label for a user's group-membership list — the name of their highest-level group
  // (falls back to "Guest" for a user in no known groups), used anywhere the old single
  // `role` string used to be shown.
  primaryGroupName(groupIds) {
    if (!Array.isArray(groupIds) || !groupIds.length) return 'Guest';
    let best = null;
    for (const id of groupIds) {
      const g = this.findGroup(id);
      if (g && (!best || g.level > best.level)) best = g;
    }
    return best ? best.name : 'Guest';
  }

  // Resolves a list of group ids/names the client supplied into valid group ids, or an error
  // if any of them don't match a real group. Used by every user-management method that
  // accepts a `groups` array, so a typo or a stale id never silently creates a broken
  // membership.
  resolveGroupIds(groupIdsOrNames) {
    const list = Array.isArray(groupIdsOrNames) ? groupIdsOrNames : (groupIdsOrNames ? [groupIdsOrNames] : []);
    const resolved = [];
    for (const entry of list) {
      const g = this.findGroup(entry);
      if (!g) return { success: false, error: `No group found named/id "${entry}"` };
      if (!resolved.includes(g.id)) resolved.push(g.id);
    }
    return { success: true, groupIds: resolved };
  }

  createGroup({ name, level } = {}) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return { success: false, error: 'Group name is required' };
    if (this.findGroup(trimmed)) return { success: false, error: `A group named "${trimmed}" already exists` };
    const numericLevel = Number(level);
    const resolvedLevel = Number.isFinite(numericLevel) ? Math.max(0, Math.round(numericLevel)) : 1;
    const id = GroupService.slugify(trimmed, this.groups);
    const group = { id, name: trimmed, level: resolvedLevel, builtIn: false };
    this.groups.push(group);
    return { success: true, group: { ...group } };
  }

  editGroup({ id, name, level } = {}) {
    const group = this.findGroup(id);
    if (!group) return { success: false, error: `No group found with id/name "${id}"` };
    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return { success: false, error: 'Group name cannot be blank' };
      const clash = this.findGroup(trimmed);
      if (clash && clash.id !== group.id) return { success: false, error: `A group named "${trimmed}" already exists` };
      group.name = trimmed;
    }
    if (level !== undefined) {
      const numericLevel = Number(level);
      if (!Number.isFinite(numericLevel)) return { success: false, error: 'Level must be a number' };
      group.level = Math.max(0, Math.round(numericLevel));
    }
    return { success: true, group: { ...group } };
  }

  // `usersInUse` is the list of usernames still assigned to this group — pass it in from the
  // caller (UserService knows the users, GroupService doesn't) so a group can never be
  // deleted out from under a user's membership list, leaving a dangling reference.
  deleteGroup({ id } = {}, usersInUse = []) {
    const group = this.findGroup(id);
    if (!group) return { success: false, error: `No group found with id/name "${id}"` };
    if (usersInUse.length) {
      return {
        success: false,
        error: `Cannot delete "${group.name}" — still assigned to ${usersInUse.length} user(s): ${usersInUse.join(', ')}. Remove them from the group first.`
      };
    }
    this.groups = this.groups.filter((g) => g.id !== group.id);
    return { success: true, group: { ...group } };
  }

  static slugify(name, existingGroups) {
    const base = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'group';
    let id = base;
    let n = 2;
    while (existingGroups.some((g) => g.id === id)) {
      id = `${base}-${n++}`;
    }
    return id;
  }
}

// Minimum level required for account-management actions (create/delete/unlock/enable/disable
// a user, change a password, edit group membership or properties). A fixed threshold rather
// than a lookup of "whatever the Administrators group is currently named" — renaming that
// built-in group must not accidentally lock every admin action, so server/index.js's
// requireAdministrator() checks against this constant, not a group name.
GroupService.ADMIN_LEVEL = 3;

module.exports = { GroupService };
