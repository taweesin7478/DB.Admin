const crypto = require('crypto');
// const CryptoJS = require("crypto-js");

function encode (data) {
  try {
    let logic = crypto.createCipher('aes-128-cbc', process.env.SECRET_TOKEN);
    let encode = logic.update(data, 'utf8', 'hex')
    encode += logic.final('hex');
    return encode
  } catch (error) {
    console.log(error);
    return error
  }
}

function decode (data) {
  try {
    let logic = crypto.createDecipher('aes-128-cbc', process.env.SECRET_TOKEN);
    let decode = logic.update(data, 'hex', 'utf8')
    decode += logic.final('utf8');
    return decode
  } catch (error) {
    console.log(error);
    return error
  }
}

function decodeToken (token, secretkey) {
  try {
    let logic = crypto.createDecipher('aes-128-cbc', secretkey);
    let decode = logic.update(token, 'hex', 'utf8')
    decode += logic.final('utf8');
    return decode
  } catch (error) {
    console.log(error);
    return error
  }
}

// function encodeJS (data) {
//   try {
//     var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), process.env.SECRET_TOKEN).toString();
//     return ciphertext
//   } catch (error) {
//     console.log(error);
//     return error
//   }
// }

// function decodeJS (data) {
//   try {
//     var bytes = CryptoJS.AES.decrypt(data, process.env.SECRET_TOKEN);
//     var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
//     return decryptedData
//   } catch (error) {
//     console.log(error);
//     return error
//   }
// }

// function encodeAccessToken (data) {
//   try {
//     var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), process.env.access_token_key).toString();
//     return ciphertext
//   } catch (error) {
//     console.log(error);
//     return error
//   }
// }

// function decodeAccessToken (data) {
//   try {
//     var bytes = CryptoJS.AES.decrypt(data, process.env.access_token_key);
//     var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
//     return decryptedData
//   } catch (error) {
//     console.log(error);
//     return error
//   }
// }


module.exports = {
  encode, decode, decodeToken
}