import { createEventProducer } from "../../../shared/events/producer/createEventProducer.js";
import { IngestController } from "../controller/ingestController.js";
import { IngestService } from "../services/ingestServices.js";


class Container {
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

const container = Container.init();
export default {
    ingestService: container.services.ingestService,
    ingestController: container.controllers.ingestController,
    Container
}