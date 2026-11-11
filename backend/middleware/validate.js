export const validate = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse({
                body: req.body ?? {},
                query: req.query ?? {},
                params: req.params ?? {}
            });

            if (!result.success) {
                console.log(
                    "VALIDATION ERRORS:",
                    result.error.issues
                );

                return res.status(400).json({
                    success: false,
                    message: "Input validation failed",
                    errors: result.error.issues.map((issue) => ({
                        path: issue.path.join("."),
                        message: issue.message
                    }))
                });
            }

            req.body = result.data.body ?? {};

            next();
        } catch (error) {
            next(error);
        }
    };
};