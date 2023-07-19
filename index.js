/**
 * Run this script to start the server.
 */

const { startServer } = require("./websocket-server");

const port = process.env.PORT || 8000;
const hostname = process.env.HOSTNAME || "127.0.0.1";
startServer(port, hostname);
