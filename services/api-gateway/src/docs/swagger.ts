import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import fs from 'fs';

export function setupSwagger(app: Express): void {
  const openApiPaths = [
    path.resolve(process.cwd(), '../../docs/api/openapi.yaml'),
    path.resolve(process.cwd(), './docs/api/openapi.yaml'),
    path.resolve(process.cwd(), '../docs/api/openapi.yaml'),
  ];

  let specPath = openApiPaths.find((p) => fs.existsSync(p));

  if (specPath) {
    const swaggerDocument = yaml.load(specPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } else {
    app.get('/api-docs', (_req, res) => {
      res.status(404).send('OpenAPI spec file not found');
    });
  }
}
