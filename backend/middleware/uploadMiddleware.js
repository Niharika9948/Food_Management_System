
import multer from "multer";

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
            new Error("Only JPG, PNG and WEBP images are allowed")
        );
    }

    callback(null, true);
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    },
    fileFilter
});

export const uploadFoodImages = (req, res, next) => {
    upload.array("images", 5)(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.code === "LIMIT_FILE_SIZE"
                    ? "Each image must be 5 MB or smaller"
                    : error.code === "LIMIT_FILE_COUNT"
                        ? "You can upload a maximum of 5 photos"
                        : error.message
            });
        }

        for (const field of ["allergens", "dietaryTags"]) {
            if (typeof req.body[field] === "string") {
                try {
                    req.body[field] = JSON.parse(req.body[field]);
                } catch {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid ${field} format`
                    });
                }
            }
        }
        console.log("FILES RECEIVED BY MULTER:", req.files?.length);
        next();
    });
};
