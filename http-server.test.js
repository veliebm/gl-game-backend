/** Tests for the HTTP server. */
const http = require("http");
const { startServer, _handleRequest, httpServer } = require("./http-server");

jest.mock("http", () => ({
  createServer: jest.fn().mockReturnThis(),
  listen: jest.fn(),
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

describe("_handleRequest", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const request = {
    method: "GET",
    url: "http://some-url.com",
  };

  const response = {
    writeHead: jest.fn(),
    end: jest.fn(),
  };

  test("should write a 404 response.", () => {
    _handleRequest(request, response);

    expect(response.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
  });
});
