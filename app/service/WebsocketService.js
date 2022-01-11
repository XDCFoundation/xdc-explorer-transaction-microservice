import Web3 from "xdc3";

export default class WebSocketService {
    static webSocketConnection(url) {
        try {
            console.log(url)
            return new Web3(new Web3.providers.WebsocketProvider(url,
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
                }));
        } catch (err) {
            console.log("webSocketConnection err", err);
            global.web3 = new Web3(new Web3.providers.WebsocketProvider(url,  {
                clientConfig: {
                    keepalive: true,
                    keepaliveInterval: 60000,
                },
                reconnect: {
                    auto: true,
                    delay: 2500,
                    onTimeout: true,
                }
            }));
        }
    }
}

// module.exports = WebSocketService;
