import { ApiHitRepository } from "../repository/ApiHitRepository.js";
import { MetricsRepository } from "../repository/MetricsRepository.js";
import { ProcessorService } from "../service/ProcessorService.js";

import ApiHit from '../../../shared/models/ApiHits.js';
import postgres from '../../../shared/config/postgres.js';
import logger from '../../../shared/config/logger.js';

class Container {
    static init() {
        const repositories = {
            apiHitRepository: new ApiHitRepository({ model: ApiHit, logger }),
            metricsRepository: new MetricsRepository({ logger, postgres }),
        };

        const services = {
            processorService: new ProcessorService(repositories),
        };

        return { repositories, services }
    }
}


const initialized = Container.init();
export { Container };
export default initialized;

