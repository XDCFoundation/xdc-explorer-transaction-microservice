import Web3 from "xdc3";

export default class WebSocketService {
    static webSocketConnection(url) {
        try {
            console.log(url)
            return new Web3((url));
            /** Add following object when connecting with Websocket URL not with RPC
              {
                clientConfig: {
                    keepalive: true,
                    keepaliveInterval: 60000,
                },
                reconnect: {
                    auto: true,
                    delay: 2500,
                    onTimeout: true,
                }
            }
             */
        } catch (err) {
            console.log("webSocketConnection err", err);
            global.web3 = new Web3((url));
        }
    }
}

// module.exports = WebSocketService;
