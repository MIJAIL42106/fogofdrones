gameState = {       // va a almacenar el estado del juego
                        // o variables/informacion que necesitamos pasar entre funciones, mejor opcion que globales
    colorVerde: 0xaaffaa,
    colorRojo: 0xffaaaa,
    equipo: ""
};  

const mensajeLogin = {
    nombre: ""
};

class escena1 extends Phaser.Scene {

    constructor() {
        super({key: "menu"});  // nombre
    }
    preload() {
    }  

    create() { 
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor('#1a1a2e');
        this.pendingLoginPayload = null;
        this.awaitingLoginResponse = false;
        this.startedPartida = false;
        this.wsClient = createFogWebSocketClient();

        this.crearNombreInput();
        this.conectarSTOMP();
    
        const backButton = this.add.text(width / 2, height - 50, 'Jugar', {
            fontSize: '40px',
            color: '#ffffff',
            backgroundColor: '#4bae5f',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        
        backButton.on('pointerdown', () => {
            mensajeLogin.nombre = this.nombreInput.value.trim();

            if (!mensajeLogin.nombre) {
                alert('falta nombre');
                return;
            }

            this.awaitingLoginResponse = true;
            const payload = JSON.stringify(mensajeLogin);
            if (this.wsClient && this.wsClient.isConnected()) {
                this.enviarMensage(payload);
            } else {
                this.pendingLoginPayload = payload;
                this.conectarSTOMP();
            }

        });
    }

    normalizarNombre(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    iniciarPartida(nombre, equipo) {
        if (this.startedPartida) {
            return;
        }

        this.startedPartida = true;
        this.awaitingLoginResponse = false;
        gameState.equipo = (equipo || '').toString();

        if (this.domElements) {
            this.domElements.forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        }

        this.scene.stop('menu');
        this.scene.start('partida', { nombre, equipo: gameState.equipo });
    }

    // establece conexion STOMP con SockJS
    conectarSTOMP() {
        if (this.connectingStomp || (this.wsClient && this.wsClient.isConnected())) {
            return;
        }
        this.connectingStomp = true;

        this.wsClient.connect({
            onConnected: () => {
                this.connectingStomp = false;

                if (!this.loginSubscription) {
                    this.loginSubscription = this.wsClient.subscribe('/topic/login', (message) => {
                        let msg;
                        try {
                            msg = JSON.parse(message.body);
                        } catch (error) {
                            return;
                        }

                        const nombreLocal = this.normalizarNombre(mensajeLogin.nombre);
                        const nombreRemoto = this.normalizarNombre(msg.nombre);
                        const mismoJugador = nombreLocal.length > 0 && nombreLocal === nombreRemoto;

                        if (msg && msg.tipoMensaje === 2 && mismoJugador) {
                            this.awaitingLoginResponse = false;
                            alert(msg.error || 'No se pudo iniciar sesión');
                            return;
                        }

                        const esperandoYConEquipo = this.awaitingLoginResponse && msg && msg.equipo != null;

                        if (mismoJugador || esperandoYConEquipo) {
                            this.iniciarPartida(mensajeLogin.nombre, msg.equipo);
                        }
                    });
                }

                if (this.pendingLoginPayload) {
                    this.enviarMensage(this.pendingLoginPayload);
                    this.pendingLoginPayload = null;
                }
            },
            onError: () => {
                this.connectingStomp = false;
            }
        });
    }

    enviarMensage(data) {
        this.wsClient.send("/app/login", data);
    }

    // inputs HTML
    crearNombreInput() {
        const { width } = this.cameras.main;

        // input
        this.nombreInput = document.createElement('input');
        this.nombreInput.type = 'text';
        this.nombreInput.id = 'nombre';
        this.nombreInput.placeholder = 'Tu nombre';
        this.nombreInput.maxLength = 20;
        this.nombreInput.style.cssText = `
            position: relative;
            left: 50%;
            bottom: 20%;
            width: 200px;
            height: 16px;
            transform: translate(-113px, -100px);
            padding: 2px;
            font-size: 16px;
            border: 2px solid #667eea;
            border-radius: 5px;
        `;
        document.body.appendChild(this.nombreInput);

        this.domElements = [this.nombreInput];
    }
    shutdown() {
        if (this.wsClient) {
            this.wsClient.disconnect();
        }
        if (this.domElements) {
            this.domElements.forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        }
    }
}
