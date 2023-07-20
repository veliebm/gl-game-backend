/** Tests for WebSocket server. */

const {
  startServer,
  _onMessage,
  _onClose,
  _onRequest,
} = require("./websocket-server");

jest.mock("./http-server", () => ({
  httpServer: {
    listen: jest.fn(),
  },
}));

jest.mock("websocket", () => ({
  server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
}));

describe("On message", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should log error when incorrect message type comes in.", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const clientId = "some-client";
    const data = {
      type: "some-invalid-type",
    };

    _onMessage(data, clientId);

    expect(consoleError).toHaveBeenCalled();
  });
});
