import { isValidRole } from "../../../shared/constants/roles.js";

/**
 * Validation schemas for the Auth module.
 */
export const onboardSuperAdminSchema = {
    username: {
        required: true,
    },
    email: {
        required: true,
    },
    password: {
        required: true,
        minLength: 6
    }
}

/**
 * Validation schema for user registration.
 */
export const registrationSchema = {
    username: {
        required: true,
    },
    email: {
        required: true,
    },
    password: {
        required: true,
        minLength: 6
    },
    role: {
        required: false,
        custom: (value) => {
            if (!value) return null;
            return isValidRole(value) ? null : 'Invalid role';
        }
    },
}

/**
 * Validation schema for user login.
 */
export const loginSchema = {
    username: { required: true },
    password: { required: true },
};