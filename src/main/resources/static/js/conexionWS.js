class ConexionWS { 
    constructor() {                                     //constructor(url = 'http://localhost:8080/juego') {   
        this.url = 'http://26.169.248.78:8080/juego';    // http://26.169.248.78:8080/juego // http://localhost:8080/juego
        this.clienteStomp = null;
        this.conectado = false;
        this.suscripciones = {};
    }

    conectar(onConnectCallback, onErrorCallback) {
        console.log('conectar');
        if (this.conectado) {
            if (onConnectCallback) onConnectCallback();
            return;
        }
        const socket = new SockJS(this.url);
        this.clienteStomp = Stomp.over(socket);
        this.clienteStomp.debug = null;
        this.clienteStomp.connect({}, () => {
            this.conectado = true;
            if (onConnectCallback) onConnectCallback();
        }, (error) => {
            this.conectado = false;
            if (onErrorCallback) onErrorCallback(error);
        });
    }

    desconectar() {
        console.log('desconectar');
        if (this.clienteStomp && this.conectado) {
            this.clienteStomp.disconnect(() => {
                this.conectado = false;
            });
        }
    }

    enviar(destino, cuerpo) {
        console.log('enviar');
        if (this.clienteStomp && this.conectado) {
            this.clienteStomp.send(destino, {}, JSON.stringify(cuerpo));
        }
    }

    suscribir(topico, callback) {
        console.log('suscribir');

        if (this.clienteStomp && this.conectado) {
            if (this.suscripciones[topico]) {
                this.suscripciones[topico].unsubscribe();
            }
            this.suscripciones[topico] = this.clienteStomp.subscribe(topico, (mensaje) => {
                callback(JSON.parse(mensaje.body));
            });
        }
    }

    desuscribir(topico) {
        console.log('desuscribir');
        if (this.suscripciones[topico]) {
            this.suscripciones[topico].unsubscribe();
            delete this.suscripciones[topico];
        }
    }
}

// Exportar como singleton global
window.conexionWS = new ConexionWS();