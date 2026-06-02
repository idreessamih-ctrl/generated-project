import helmet from 'helmet';
import { securityHeadersConfig } from '../config/security';

export const securityHeadersMiddleware = helmet(securityHeadersConfig);