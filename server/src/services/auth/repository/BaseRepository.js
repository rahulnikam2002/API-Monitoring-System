/**
 * BaseRepository serves as an abstract class that defines the structure for repository classes in the authentication service. It provides method signatures for common database operations such as creating a new record, finding a record by ID, username, or email, and retrieving all records. Each method throws an error indicating that it is not implemented, which enforces that any subclass must provide its own implementation of these methods.
 */
export default class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        throw new Error("Method not implemented")
    };

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findByUsername(username) {
        throw new Error('Method not implemented');
    }

    async findByEmail(email) {
        throw new Error('Method not implemented');
    }

    async findAll() {
        throw new Error('Method not implemented');
    }
}