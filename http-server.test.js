/** Tests for the HTTP server. */
const { _handleRequest } = require("./http-server");

describe("_handleRequest", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should write a 404 response.", () => {
    const request = {
      method: "GET",
      url: "http://some-url.com",
    };
    const response = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };

    _handleRequest(request, response);

    expect(response.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
  });
});
