const fs = require("fs");

// 1. ????? .env
const envData = "\nCLOUDINARY_CLOUD_NAME=u0x5opyh\nCLOUDINARY_API_KEY=472159413429157\nCLOUDINARY_API_SECRET=Ab7P54hG8y3GYIGjNc5a_j6twYg\n";
if (!fs.existsSync(".env") || !fs.readFileSync(".env", "utf8").includes("CLOUDINARY_CLOUD_NAME")) {
    fs.appendFileSync(".env", envData);
}

// 2. ????? server.js
let server = fs.readFileSync("server.js", "utf8");
fs.writeFileSync("server.js.backup-cloud", server);

if (!server.includes("require(\"cloudinary\")") && !server.includes("require(\x27cloudinary\x27)")) {
    server = "require(\"dotenv\").config();\nconst cloudinary = require(\"cloudinary\").v2;\nconst { CloudinaryStorage } = require(\"multer-storage-cloudinary\");\n" + server;
}

const cloudConfig = "cloudinary.config({\n" +
"    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || \x27u0x5opyh\x27,\n" +
"    api_key: process.env.CLOUDINARY_API_KEY || \x27472159413429157\x27,\n" +
"    api_secret: process.env.CLOUDINARY_API_SECRET || \x27Ab7P54hG8y3GYIGjNc5a_j6twYg\x27\n" +
"});\n\n" +
"const storage = new CloudinaryStorage({\n" +
"    cloudinary: cloudinary,\n" +
"    params: {\n" +
"        folder: \x27massar-dates\x27,\n" +
"        allowed_formats: [\x27jpg\x27, \x27png\x27, \x27jpeg\x27, \x27webp\x27, \x27svg\x27, \x27gif\x27]\n" +
"    }\n" +
"});";

server = server.replace(/const\s+storage\s*=\s*multer\.diskStorage\(\{[\s\S]*?\}\);?/, cloudConfig);
server = server.replace(/res\.json\(\{\s*url:\s*[\x27\x22`]\/uploads\/[\x27\x22`]\s*\+\s*req\.file\.filename\s*\}\);?/g, "res.json({ url: req.file.path });");

fs.writeFileSync("server.js", server);
console.log("SUCCESS_CLOUDINARY_READY");
