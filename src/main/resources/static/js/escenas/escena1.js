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
        this.load.image("FondoMenu",".//assets/fondos/fondo_lobby.png");
    }  

    create() { 
        const { width, height } = this.cameras.main;
        //this.cameras.main.setBackgroundColor('#1a1a2e');
        this.fondo = this.add.image(width / 2, height / 2, "FondoMenu");
        this.pendingLoginPayload = null;
        this.awaitingLoginResponse = false;
        this.startedPartida = false;

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
            if (this.stompClient && this.stompClient.connected) {
                this.enviarMensage(payload);
            } else {
                this.pendingLoginPayload = payload;
                this.conectarSTOMP();
            }

        });
    }

    getSocketCandidates() {
        const customBase = window.FOG_BACKEND_URL || localStorage.getItem('fogBackendUrl');
        const bases = [customBase, window.location.origin, 'http://26.169.248.78:8080']
            .filter(Boolean)
            .map(base => base.replace(/\/$/, ''));

        return [...new Set(bases)].map(base => base + '/game');
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
        if (this.connectingStomp || (this.stompClient && this.stompClient.connected)) {
            return;
        }

        const socketCandidates = this.getSocketCandidates();
        this.connectingStomp = true;

        const intentarConexion = (index) => {
            if (index >= socketCandidates.length) {
                this.connectingStomp = false;
                return;
            }

            const socket = new SockJS(socketCandidates[index]);
            const stompClient = Stomp.over(socket);
            stompClient.debug = null;

            stompClient.connect({}, () => {
                this.stompClient = stompClient;
                this.connectingStomp = false;

                this.stompClient.subscribe('/topic/login', (message) => {
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

                if (this.pendingLoginPayload) {
                    this.enviarMensage(this.pendingLoginPayload);
                    this.pendingLoginPayload = null;
                }
            }, () => {
                intentarConexion(index + 1);
            });
        };

        intentarConexion(0);
    }

    enviarMensage(data) {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.send("/app/login", {}, data);
        }
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
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.disconnect();
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
