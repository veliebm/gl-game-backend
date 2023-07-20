/** Exception to send to clients. */
class ClientExceptionMessage {
  type = "Exception";
  code;
  message;

  constructor(code, message, internalMessage) {
    this.code = code;
    this.message = message;
    console.error(internalMessage);
  }

  /** Returns this object as a JSON-encoded string. */
  toJson() {
    return JSON.stringify(this);
  }
}

module.exports = {
  ClientExceptionMessage: ClientExceptionMessage,
};
