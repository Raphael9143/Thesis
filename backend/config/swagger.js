const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Thesis API Documentation",
      version: "1.0.0",
      description: "API documentation for Thesis project",
      contact: {
        name: "API Support",
        email: "support@thesis.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
    path.join(__dirname, "../models/*.js"),
  ],
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
};
