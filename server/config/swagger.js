const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load the swagger.yaml file
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

// Swagger UI options
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none', // Don't expand operations by default
    filter: true, // Enable filtering
    showRequestHeaders: true,
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 5px; }
  `,
  customSiteTitle: "Milk Dairy Management API Documentation",
  customfavIcon: "/favicon.ico"
};

// Alternative JSDoc approach (if you prefer to use JSDoc comments in your routes)
const jsdocOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Milk Dairy Management System API',
      version: '1.0.0',
      description: 'A comprehensive MERN stack application for managing milk dairy operations',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.milkdairy.com/api' 
          : 'http://localhost:5000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API files
};

// Generate swagger spec from JSDoc (alternative approach)
const jsdocSpecs = swaggerJsdoc(jsdocOptions);

module.exports = {
  swaggerDocument,
  swaggerOptions,
  swaggerUi,
  jsdocSpecs
};