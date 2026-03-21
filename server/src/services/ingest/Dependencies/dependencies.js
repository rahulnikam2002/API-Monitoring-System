import { createEventProducer } from "../../../shared/events/producer/createEventProducer.js";
import { IngestController } from "../controller/ingestController.js";
import { IngestService } from "../services/ingestServices.js";

/**
 * Container class for managing dependencies in the ingest module. This class initializes the necessary services and controllers for the ingest functionality, ensuring that all dependencies are properly injected. The init method creates an instance of the EventProducer, which is then passed to the IngestService. The IngestController is created with the IngestService as its dependency. This approach allows for better modularity and separation of concerns, making it easier to manage and test the components of the ingest module.
 */
class Container {
    /**
     * Initializes the dependencies for the ingest module. It creates an instance of the EventProducer and injects it into the IngestService, which is then injected into the IngestController. The method returns an object containing the initialized services and controllers for use in the application.
     * @returns {{services: {ingestService: IngestService}, controllers: {ingestController: IngestController}}} - The initialized services and controllers.
     */
    static init() {
        const eventProducer = createEventProducer();

        const services = {
            ingestService: new IngestService({ eventProducer })
        }

        const controllers = {
            ingestController: new IngestController(services)
        }

        return { services, controllers }
    }
}

// Initialize the container and export the services and controllers for use in the application
const container = Container.init();
export default {
    ingestService: container.services.ingestService,
    ingestController: container.controllers.ingestController,
    Container
}