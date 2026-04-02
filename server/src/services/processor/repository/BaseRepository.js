/**
 * BaseRepository
 * Database-agnostic repository contract. 
 * Concrete repositories should extend this class and implement/override database-specific methods.
 */
export class BaseRepository {
    constructor({ logger: l = console } = {}) {
        this.logger = l;
    }

    // Implementations should override these methods as appropriate.
    async save() {
        throw new Error('Method not implemented: save');
    }

    async find() {
        throw new Error('Method not implemented: find');
    }

    async count() {
        throw new Error('Method not implemented: count');
    }

    async deleteOldHits() {
        throw new Error('Method not implemented: deleteOldHits');
    }
}
