const mongoose = require("mongoose");
const User = require("../models/userModel");
const AppChoice = require("../models/appChoiceModel");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const { ROLES, APP_CHOICES } = require("./general");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const path = require("path");
const crypto = require("crypto");
const { snakeCase } = require("lodash");

let gridfsBucket;

const connectDB = async () => {
  try {
    mongoose.connection.once("open", () => {
      gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads",
      });
      require("../models/fileModel");
      console.log(`Grid Filesystem initialized`);
    });
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    runPostStartRoutine();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const runPostStartRoutine = async () => {
  await createSeedAdmin();
  await seedAppChoices();
};

const seedAppChoices = async () => {
  for (let i = 0; i < APP_CHOICES.length; i++) {
    const { key, values } = APP_CHOICES[i];
    const appChoice = await AppChoice.findOne({ key: key });

    if (!appChoice) {
      const newAppChoice = new AppChoice({ key: key, values });
      await newAppChoice.save();
      console.log(`Created new AppChoice with key: ${key}`);
    } else {
      console.log(`AppChoice with key: ${key} already exists`);
    }
  }
};

const uploadFileFromObject = async (fileObject) => {
  if (!fileObject.fileName || !fileObject.mimeType || !fileObject.data) {
    throw new Error("Invalid file object.");
  }
  const buf = crypto.randomBytes(16);
  const newFileName =
    buf.toString("hex") + "_" + path.extname(fileObject.fileName);

  let uploadStream = gridfsBucket.openUploadStream(newFileName, {
    contentType: fileObject.mimeType,
    metadata: { ...fileObject.metadata, originalName: fileObject.fileName },
  });
  uploadStream.write(fileObject.data, "base64");
  uploadStream.end();
  return new Promise((resolve, reject) => {
    uploadStream.on("finish", () => {
      resolve(newFileName);
    });
  });
};

const getObjectFromFile = async (fileInfo) => {
  let downloadStream = gridfsBucket.openDownloadStreamByName(fileInfo.filename);
  downloadStream.read();
  let chunks = [];
  return new Promise((resolve, reject) => {
    downloadStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    downloadStream.on("error", (err) => reject(err));
    downloadStream.on("end", () =>
      resolve({
        fileName: fileInfo.filename,
        mimeType: fileInfo.contentType,
        data: Buffer.concat(chunks).toString("base64"),
      })
    );
  });
};

const readFiles = async (fileName) => {
  let query = fileName ? { filename: fileName } : {};
  let files = await gridfsBucket.find(query).toArray();
  if (!files || !files.length) {
    files = [];
  }
  if (fileName && !files.length) return false;
  return fileName ? files[0] : files;
};

const deleteFileFromStorage = async (filename) => {
  let file = await gridfsBucket.find({ filename }).toArray();
  if (!file || !file.length) {
    return { error: "File not found. Already deleted?" };
  }
  await gridfsBucket.delete(file[0]._id);
  return { success: true };
};

const getReadStream = asyncHandler(async (filename) => {
  let file = await gridfsBucket.find({ filename }).toArray();
  if (!file || !file.length) {
    return { error: "File not found." };
  }
  return gridfsBucket.openDownloadStreamByName(filename);
});

const createSeedAdmin = async () => {
  const rolesToSeed = [ROLES.ADMIN, ROLES.CLUB_OWNER];
  for (const role of rolesToSeed) {
    const existingAdminCount = await User.count({ role });
    console.log(`Found ${existingAdminCount} ${role}`);
    if (existingAdminCount === 0) {
      console.log(`No ${role} found, creating a seed admin`);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        process.env.SEED_ADMIN_PASSWORD,
        salt
      );
      const user = {
        name: role,
        email: `${snakeCase(role)}@appx.com`,
        phone: process.env.SEED_ADMIN_PHONE,
        role: role,
        password: hashedPassword,
        active: true,
      };

      const createdUser = await User.create(user);
      console.log(
        `Seed ${role} created => `,
        createdUser.name,
        createdUser.email
      );
    }
  }
};

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename =
          buf.toString("hex") + "_" + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
          metadata: { ...req.query, originalName: file.originalname },
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({ storage });

connectDB();

module.exports = {
  readFiles,
  deleteFileFromStorage,
  getReadStream,
  upload,
  uploadFileFromObject,
  getObjectFromFile,
};
