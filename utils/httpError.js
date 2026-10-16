class HttpError extends Error {
  constructor(message, statusCode, statusText) {
    super(typeof message === "string" ? message : "validation failed");
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.statusText = statusText;
    if (typeof message !== "string") this.details = message;
  }
}

// keeps the old call style: HttpError.create(message, statusCode, statusText)
// but returns a NEW error each time instead of mutating a shared singleton
const create = (message, statusCode, statusText) =>
  new HttpError(message, statusCode, statusText);

module.exports = { HttpError, create };
