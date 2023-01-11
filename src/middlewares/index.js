const {checkToken} = require("./checkToken");
const { uploadImageAvatar, uploadImageProduct } = require("./uploadFiles");
const {adminNotDestroy} = require('./adminNotDestroy');
const { checkRol } = require("./checkRol");


module.exports = {
uploadImageProduct,
uploadImageAvatar,
checkToken,
adminNotDestroy,
checkRol
} 