/** Error message that can be sent to the client. */
export class ExceptionMessage {
  /** The Type of this object. */
  type = "Exception";
  /** The HTTP status code to return. */
  code: number;
  /** The message to accompany the error. */
  message: string;

  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }

  /** Converts this object to JSON. */
  toJson() {
    return JSON.stringify(this);
  }

  /** Logs an error message to console. Returns this object for chaining. */
  withInternalMessage(internalMessage: string) {
    console.error(internalMessage);
    return this;
  }
}
