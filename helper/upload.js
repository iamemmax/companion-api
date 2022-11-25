const multer = require("multer");

const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + file.originalname);
    },
    destination: (req, file, cb) => {
        cb(null, "");
    },
});





const upload = multer({
    storage: storage,
    limits: {
      fieldNameSize: 200,
      fileSize: 30 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image" || "video")) {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error("File types allowed .jpeg, .jpg and .png!"));
        }

    },
});

module.exports = upload;