
class ConexionWS {
    constructor(url = 'http://localhost:8080/game') {
        this.url = url;
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = {};
    }

    conectar(onConnectCallback, onErrorCallback) {
        console.log('conectar');
        if (this.connected) {
            if (onConnectCallback) onConnectCallback();
            return;
        }
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
        console.log('desconectar');
        if (this.stompClient && this.connected) {
            this.stompClient.disconnect(() => {
                this.connected = false;
            });
        }
    }

    enviar(destino, cuerpo) {
        console.log('enviar');
        if (this.stompClient && this.connected) {
            this.stompClient.send(destino, {}, JSON.stringify(cuerpo));
        }
    }

    suscribir(topico, callback) {
        console.log('suscribir');

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
        console.log('desuscribir');
        if (this.subscriptions[topico]) {
            this.subscriptions[topico].unsubscribe();
            delete this.subscriptions[topico];
        }
    }
}

// Exportar como singleton global
window.conexionWS = new ConexionWS();