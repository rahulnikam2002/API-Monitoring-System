export const ROLES = [
    'super_admin',
    'client_admin',
    'client_viewer',
];

export const CLIENT_ROLES = [
    'client_admin',
    'client_viewer',
];

export const APPLICATION_ROLES = {
    SUPER_ADMIN: "super_admin",
    CLIENT_VIEWER: "client_viewer",
    CLIENT_ADMIN: "client_admin"
}

export const isValidClientRole = (role) => CLIENT_ROLES.includes(role);
export const isValidRole = (role) => ROLES.includes(role);