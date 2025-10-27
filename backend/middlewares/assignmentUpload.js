const multer = require('multer');
const path = require('path');

// Cấu hình lưu file upload vào thư mục uploads/ với tên gốc, có thể đổi tên nếu muốn
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, '../uploads/assignments'));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, uniqueSuffix + '-' + file.originalname);
	}
});

// Allow only .use files for assignments
const upload = multer({ storage, fileFilter: (req, file, cb) => {
	const ext = path.extname(file.originalname).toLowerCase();
	if (ext !== '.use') {
		return cb(new Error('Only .use files are allowed for assignments'));
	}
	cb(null, true);
}});

module.exports = upload;
