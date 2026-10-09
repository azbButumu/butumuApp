// app.json の設定に、ファイルがあるときだけ足すものをここで足す。
const fs = require('fs')
const path = require('path')

// Android の push 通知(FCM)に必要。Firebase Console からダウンロードして
// mobile/ 直下に置く。無いうちは通知なしでビルドできるようにしておく。
const GOOGLE_SERVICES_FILE = './google-services.json'

module.exports = ({ config }) => {
  if (!fs.existsSync(path.join(__dirname, GOOGLE_SERVICES_FILE))) return config
  return {
    ...config,
    android: { ...config.android, googleServicesFile: GOOGLE_SERVICES_FILE },
  }
}
