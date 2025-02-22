const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageToCloudinary = async (imageBuffer) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "auto" },
          (error, result) => error ? reject(error) : resolve(result)
        )
        .end(imageBuffer);
    });
    return result.secure_url;
  } catch (error) {
    throw new Error(`Error Cloudinary: ${error.message}`);
  }
};

module.exports = { uploadImageToCloudinary };