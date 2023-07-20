/** A simple HTTP server that logs requests and returns NOT_FOUND. */

const http = require("http");

const httpServer = http.createServer((request, response) => {
  console.log(
    `Incoming HTTP request: ${request.method.toUpperCase()} ${request.url}`
  );
  response.writeHead(404, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*",
  });
  response.end("There be nothing to see here.");
});

module.exports = {
  httpServer,
};
