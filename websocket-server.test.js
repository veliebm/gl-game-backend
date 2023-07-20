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

describe("_onMessage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should log error when incorrect message type comes in.", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
    const clientId = "client1";
    const data = {
      type: "utf8",
      utf8Data: JSON.stringify({
        id: "client2",
        content: "Hello World",
      }),
    };
    global.activeConnections = {
      client2: {
        send: jest.fn(),
      },
    };

    _onMessage(data, clientId);

    expect(consoleLog).toHaveBeenCalled();

    consoleError.mockRestore();
    consoleLog.mockRestore();
  });
});
