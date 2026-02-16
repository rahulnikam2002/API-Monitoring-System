import mongoose from 'mongoose';

/**
 * MongoDB schema for clients/organizations
 * Each client represents a business/organization using the monitoring service
 */
const clientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: /^[a-z0-9-]+$/,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            maxlength: 500,
            default: '',
        },
        website: {
            type: String,
            default: '',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        settings: {
            dataRetentionDays: {
                type: Number,
                default: 30,
                min: 7,
                max: 365,
            },
            alertsEnabled: {
                type: Boolean,
                default: true,
            },
            timezone: {
                type: String,
                default: 'UTC',
            },
        },
    },
    {
        timestamps: true,
        collection: 'clients',
    }
);

clientSchema.index({ isActive: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;