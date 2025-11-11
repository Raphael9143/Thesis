const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const dest = path.join(__dirname, '../uploads/submissions');
		fs.mkdir(dest, { recursive: true }, (err) => cb(err, dest));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, uniqueSuffix + '-' + file.originalname);
	}
});

const upload = multer({ storage });

module.exports = upload;
