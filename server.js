import APP from 'express'
import DBConnection from './config/dbConnection'
import Utils from './app/utils'
import Config from './config'
import routes from './routes'
import { httpConstants } from './app/common/constants'
import WebSocketService from "./app/service/WebsocketService";
import AMQP from "./library";


const app = new APP()
require('./config/express')(app)
global.lhtWebLog = Utils.lhtLog

class Server {
  static listen () {
    Promise.all([
      DBConnection.connect() ,
       AMQP.conn(Config.AMQP_HOST_URL, true)]).then(async() => {
      app.listen(Config.PORT)
      Utils.lhtLog('listen', `Server Started on port ${Config.PORT}`, {}, 'AyushK', httpConstants.LOG_LEVEL_TYPE.INFO)
      routes(app)
      global.web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
      require('./config/jobInitializer')
    }).catch(error => Utils.lhtLog('listen', 'failed to connect', { err: error }, 'AyushK', httpConstants.LOG_LEVEL_TYPE.ERROR))
  }
}

Server.listen()
