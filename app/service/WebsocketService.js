import Web3 from "xdc3";

export default class WebSocketService {
    static webSocketConnection(url) {
        try {
            console.log(url)
            return new Web3(new Web3.providers.WebsocketProvider(url));
        } catch (err) {
            console.log("webSocketConnection err", err);
            global.web3 = new Web3(new Web3.providers.WebsocketProvider(url));
        }
    }
}

// module.exports = WebSocketService;
