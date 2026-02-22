gameState = {       // va a almacenar el estado del juego
                        // o variables/informacion que necesitamos pasar entre funciones, mejor opcion que globales
        colorVerde: 0xaaffaa,
        colorRojo: 0xffaaaa
    };  

class escena1 extends Phaser.Scene {

    constructor() {
        super({key: "chat"});  // nombre
    }
    preload() {
    }  

    create() { 
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor('#1a1a2e');

        this.add.text(width / 2, 50, 'CHAT', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        //this.messageY = 150; // Posición Y mensajes
        //this.messages = []; // Array mensajes

        this.crearNombreInput();
        //this.connectWebSocket();
    
        const backButton = this.add.text(width / 2, height - 50, 'Ir al Juego', {
            fontSize: '40px',
            color: '#ffffff',
            backgroundColor: '#667eea',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        

        backButton.on('pointerdown', () => {
            const nom = this.nombreInput.value.trim();

            if (!nom) {
                alert('falta nombre');
                return;
            }

            if (this.domElements) {
                this.domElements.forEach(element => {
                    if (element && element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                });
            }
            this.scene.stop('chat');
            this.scene.start('partida',{nombre:nom}); // Cambiar a tu escena principal
        });
    }

    // inputs HTML
    crearNombreInput() {
        const { width } = this.cameras.main;

        // input
        this.nombreInput = document.createElement('input');
        this.nombreInput.type = 'text';
        this.nombreInput.id = 'chat-nombre';
        this.nombreInput.placeholder = 'Tu nombre';
        this.nombreInput.maxLength = 20;
        this.nombreInput.style.cssText = `
            position: relative;
            left: 50%;
            bottom: 120px;
            width: 200px;
            padding: 10px;
            font-size: 16px;
            border: 2px solid #667eea;
            border-radius: 5px;
        `;
        document.body.appendChild(this.nombreInput);

        this.domElements = [this.nombreInput];
    }

    /**
     * NOTA: El método connectWebSocket está comentado porque la conexión
     * se realiza directamente en escena3.js cuando empieza la partida.
     * Si necesitas funcionalidad de chat, puedes descomentar y adaptar este método.
     */
    /*
    conectarSTOMP() {
        const socket = new SockJS(window.location.origin + '/game');
        this.stompClient = Stomp.over(socket);
        
        this.stompClient.connect({}, (frame) => {
            console.log('Conectado a STOMP: ' + frame);
            
            this.stompClient.subscribe('/topic/game', (message) => {
                this.addMessage(message.body);
            });
        }, (error) => {
            console.error('Error de conexión STOMP: ' + error);
        });
    }
    */
/*
    sendMessage() {
        const nombre = this.nombreInput.value.trim();
        const message = this.messageInput.value.trim();

        if (!nombre) {
            alert('falta nombre');
            return;
        }

        if (!message) {
            alert('falta mensaje');
            return;
        }

       if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const fullMessage = `${nombre}: ${message}`;
            this.socket.send(fullMessage);
            this.messageInput.value = '';
        } else {
            alert('No servidor');
        }
    }
    
    addMessage(text) {
        const messageText = this.add.text(100, this.messageY, text, {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 },
            wordWrap: { width: 1200 }
        });
        this.messages.push(messageText);
        this.messageY += 35;

        if (this.messages.length > 20) {
            const oldMessage = this.messages.shift();
            oldMessage.destroy();

            this.messages.forEach(msg => {
                msg.y -= 35;
            });

            this.messageY -= 35;
        }
    }*/

    shutdown() {
        // Cerrar conexión STOMP si existe
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
