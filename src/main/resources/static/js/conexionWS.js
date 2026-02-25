
class ConexionWS {
    constructor(url = 'http://26.169.248.78:8080/game') {
        this.url = url;
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = {};
    }

    conectar(onConnectCallback, onErrorCallback) {
        if (this.connected) return;
        const socket = new SockJS(this.url);
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = null;
        this.stompClient.connect({}, () => {
            this.connected = true;
            if (onConnectCallback) onConnectCallback();
        }, (error) => {
            this.connected = false;
            if (onErrorCallback) onErrorCallback(error);
        });
    }

    desconectar() {
        if (this.stompClient && this.connected) {
            this.stompClient.disconnect(() => {
                this.connected = false;
            });
        }
    }

    enviar(destino, cuerpo) {
        if (this.stompClient && this.connected) {
            this.stompClient.send(destino, {}, JSON.stringify(cuerpo));
        }
    }

    suscribir(topico, callback) {
        if (this.stompClient && this.connected) {
            if (this.subscriptions[topico]) {
                this.subscriptions[topico].unsubscribe();
            }
            this.subscriptions[topico] = this.stompClient.subscribe(topico, (mensaje) => {
                callback(JSON.parse(mensaje.body));
            });
        }
    }

    desuscribir(topico) {
        if (this.subscriptions[topico]) {
            this.subscriptions[topico].unsubscribe();
            delete this.subscriptions[topico];
        }
    }
}

// Exportar como singleton global
window.conexionWS = new ConexionWS();