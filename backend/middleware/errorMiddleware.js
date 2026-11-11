
export const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};


export const errorHandler = (err, req, res, next) => {

    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Internal Server Error";

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID format";
    }

    // Duplicate database value
    if (err.code === 11000) {
        statusCode = 409;

        const field = Object.keys(err.keyValue || {})[0];

        message = field
            ? `${field} already exists`
            : "Duplicate value";
    }

    // MongoDB validation errors
    if (err.name === "ValidationError") {
        statusCode = 400;

        message = Object.values(err.errors)
            .map((item) => item.message)
            .join(", ");
    }

    // Invalid or expired JWT
    if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError"
    ) {
        statusCode = 401;
        message = "Invalid or expired token";
    }

    // Invalid JSON request
    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        "body" in err
    ) {
        statusCode = 400;
        message = "Invalid JSON request body";
    }

    // Hide internal server errors in production
    if (statusCode >= 500 && process.env.NODE_ENV === "production") {
        message = "Internal Server Error";
    }

    // Send final error response
    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack
        })
    });
};
