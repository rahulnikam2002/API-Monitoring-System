import mongoose from "mongoose";
import bcrypt from "bcryptjs"
import SecurityUtils from "../utils/SecurityUtils";

/**
 * User Schema - Represents a user in the system with authentication and role-based access control.
 * Each user can be associated with a client (except super_admin) and has specific permissions.
 * Passwords are hashed before saving to the database for security.
 */
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        validate: {
            validator: function (userName) {
                return /^[a-zA-Z0-9_.-]+$/.test(userName);
            },
            message: "Please enter a valid username"
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: "Please enter a valid email"
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        validate: {
            validator: function (password) {
                if (this.isModified('password') && password && !password.startsWith('$2a$')) {
                    const validation = SecurityUtils.validatePassword(password)
                    return validation.success
                };
                return true
            },
            message: function (props) {
                if (props.value && !props.value.startsWith('$2a$')) {
                    const validation = SecurityUtils.validatePassword(props.value)
                    // ["Password is required", "Password must contain at least one uppercase letter"]
                    // "Password is required. Password must contain at least one uppercase letter."
                    return validation.errors.join(". ");
                };
                return "Password validation failed"
            }
        },
    },
    role: {
        type: String,
        enum: ['super_admin', 'client_admin', 'client_viewer'],
        default: 'client_viewer'
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId, // 123
        ref: "Client",
        required: function () {
            return this.role !== "super_admin"
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    permissions: {
        canCreateApiKeys: {
            type: Boolean,
            default: false,
        },
        canManageUsers: {
            type: Boolean,
            default: false,
        },
        canViewAnalytics: {
            type: Boolean,
            default: true,
        },
        canExportData: {
            type: Boolean,
            default: false,
        },
    },
}, {
    timestamps: true,
    collection: "users"
})

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Indexes for efficient querying
userSchema.index({ clientId: 1, isActive: 1 });
userSchema.index({ role: 1 })

const User = mongoose.model("User", userSchema)
export default User