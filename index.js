/**
 * Run this script to start the server.
 */

const { startServer } = require("./websocket-server");

const port = process.env.PORT || 8000;
const hostname = process.env.HOSTNAME || "localhost";
startServer(port, hostname);
