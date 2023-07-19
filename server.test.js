/** Tests for the server */
const websocket = require("websocket");
const http = require("http");
const { startServer, httpServer } = require("./server");

jest.mock("http", () => ({
  createServer: jest.fn().mockReturnThis(),
  listen: jest.fn(),
}));

jest.mock("websocket", () => ({
  server: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
}));

describe("startServer", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should start server with given port and hostname.", () => {
    const port = 3000;
    const hostname = "localhost";

    startServer(port, hostname);

    expect(httpServer.listen).toHaveBeenCalledWith(
      port,
      hostname,
      expect.any(Function)
    );
  });
});
