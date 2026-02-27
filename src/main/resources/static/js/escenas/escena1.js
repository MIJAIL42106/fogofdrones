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
        this.load.image("Buscar",".//assets/fondos/Buscar.png");
        this.load.image("Cargar",".//assets/fondos/Cargar.png");
    }  

    create() { 
        const { width, height } = this.cameras.main;
        
        //this.cameras.main.setBackgroundColor('#FF0000'); // Rojo
        //this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.5)'); // Transparente
        document.body.style.backgroundColor = '#000000';  // este cubre todo el fondo, incluso el canvas
        
        this.fondo = this.add.image(width / 2, height / 2, "FondoMenu");
        this.awaitingLoginResponse = false;
        this.startedPartida = false;
        this.buscandoPartida = false;
        
        this.crearNombreInput();

        this.jugarBtn = this.add.text(width / 2, height - 50, 'Jugar', {
            fontSize: '40px',
            color: '#ffffff',
            backgroundColor: '#4bae5f',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        this.estadoTexto = this.add.text(width / 2, height - 120, '', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.conectarSTOMP();

        this.jugarBtn.on('pointerdown', () => {
            if (this.buscandoPartida) {
                this.cancelarBusqueda();
                return;
            }
            mensajeLogin.nombre = this.nombreInput.value.trim();
            if (!mensajeLogin.nombre) {
                alert('falta nombre');
                return;
            }
            this.buscandoPartida = true;
            this.nombreInput.disabled = true;
            this.jugarBtn.setText('Cancelar');
            this.jugarBtn.setBackgroundColor('#ff6b6b');
            this.estadoTexto.setText('Esperando contrincante...');
            this.awaitingLoginResponse = true;
            window.conexionWS.enviar('/app/login', { nombre: mensajeLogin.nombre });
        });
    }

    // Centraliza la conexión y suscripción a los tópicos usando ConexionWS
    conectarSTOMP() {
        window.conexionWS.conectar(() => {
            window.conexionWS.suscribir('/topic/login', (msg) => {
                const nombreLocal = this.normalizarNombre(mensajeLogin.nombre);
                const nombreRemoto = this.normalizarNombre(msg.nombre);
                const mismoJugador = nombreLocal.length > 0 && nombreLocal === nombreRemoto;
                if (msg && msg.tipoMensaje === 2 && mismoJugador) {
                    this.awaitingLoginResponse = false;
                    this.buscandoPartida = false;
                    this.nombreInput.disabled = false;
                    this.jugarBtn.setText('Jugar');
                    this.jugarBtn.setBackgroundColor('#4bae5f');
                    this.estadoTexto.setText('');
                    alert(msg.error || 'No se pudo iniciar sesión');
                    return;
                }
            });
            window.conexionWS.suscribir('/topic/partida-lista', (msg) => {
                const nombreLocal = this.normalizarNombre(mensajeLogin.nombre);
                const nombreRemoto = this.normalizarNombre(msg.nombre);
                const mismoJugador = nombreLocal.length > 0 && nombreRemoto && nombreLocal === nombreRemoto;
                if (mismoJugador && this.buscandoPartida) {
                    this.iniciarPartida(mensajeLogin.nombre, msg.equipo);
                }
            });
        }, (error) => {
            this.estadoTexto.setText('Error de conexión');
        });
    }

    cancelarBusqueda() {
        this.buscandoPartida = false;
        this.awaitingLoginResponse = false;
        this.nombreInput.disabled = false;
        this.jugarBtn.setText('Jugar');
        this.jugarBtn.setBackgroundColor('#4bae5f');
        this.estadoTexto.setText('');
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

    // La conexión y suscripción ahora se maneja con ConexionWS en create()
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Enviar mensaje usando ConexionWS // no se usa
    enviarMensage(data) {
        window.conexionWS.enviar('/app/login', data);
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
        window.conexionWS.desuscribir('/topic/login');
        window.conexionWS.desuscribir('/topic/partida-lista');
        window.conexionWS.desconectar();
        
        if (this.domElements) {
            this.domElements.forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        }   
    }
}
