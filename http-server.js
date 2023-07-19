/** A simple HTTP server that logs requests and returns NOT_FOUND. */

const http = require("http");

/** Logs a request and returns NOT_FOUND. */
const _handleRequest = (request, response) => {
  console.log(
    `Incoming HTTP request: ${request.method.toUpperCase()} ${request.url}`
  );
  response.writeHead(404, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*",
  });
  response.end("There be nothing to see here.");
};

/** The HTTP server. */
const httpServer = http.createServer(_handleRequest);

module.exports = {
  _handleRequest,
  httpServer,
};
