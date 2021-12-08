import Config from '.'
import mongoose from 'mongoose'
const fs = require('fs');

export default class DBConnection {
  static connect() {
    console.log('DB trying to connect on ' + new Date() + ' to url ' + Config.DB)
    const options = {
      keepAlive: 1,
      poolSize: 10,
      ssl: true,
      sslValidate: false,
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      retryWrites: false,
      sslCA: [fs.readFileSync(__dirname  + Config.RDS_FILE)]
    }
    return mongoose.connect(Config.DB, options)
  }

}