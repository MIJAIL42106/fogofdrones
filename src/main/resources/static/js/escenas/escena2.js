gameState = {       // va a almacenar el estado del juego
                    // o variables/informacion que necesitamos pasar entre funciones, mejor opcion que globales
    colorVerde: 0xaaffaa,
    colorRojo: 0xffaaaa
}; 
    
class escena2 extends Phaser.Scene {
    
    constructor() {
        super({key: "prueba"});  // nombre de escena
    }
    
    preload() {
        //this.load.image("Fondo",".//assets/eldenmiedo.jpg");
        this.load.spritesheet("dronN",".//assets/sprites/dronN-512x512x2.png",{frameWidth: 512, frameHeight: 512});
    }

     
    create() {          // si voy a usar una variable en 2 funciones distintas, ej create y update, debo crerla global a ellas, por fuera, hay otras formas pero para juego pequeño no es mucho problema
        //var fondo = this.add.image(930,530,"Fondo"); // agregamos el fondo a la escena
        //fondo.setScale(3.5);//escalamos el fondo
        
        gameState.apretado = false;

        gameState.dron = this.add.sprite(500,500,"dronN");

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('dronN', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: 1,
        });
        
        gameState.dron.setInteractive();
        
        //gameState.tiles = Tile[][] = [[]];

        // crear circlulo // this.add.circle(x,y,r,color)
        // gameState.circle = this.add.circle(500,500,500,gameState.colorVerde);
        // crear rectangulo // this.add.rectangle(x,y,ancho,alto,color)
        gameState.rectangle = this.add.rectangle(0,1000,500,160,gameState.colorRojo);
        gameState.rectangle.setInteractive();
        // inputs
        // hacer gameobject interactivo // gameState.objeto.setInteractive()
        // hace que phaser escuche los eventos interactivos en ese objeto
        // gameState.circle.setInteractive();

        // darle un event handler a el objeto
        // funcion event handler llamada con interacciones especificas con el objeto
        // interacciones ej:    //  gameState.objeto.on(evento, funcion que se ejecutara)
        // 'pointerdown'    // evento llamado al presionar mouse sobre objeto // no al soltar
        // 'pointerup'      // evento llamado al soltar mouse sobre objeto
        // 'pointerover'    // evento llamado al pasar mouse sobre objeto
        // 'pointerout'     // evento llamado al quitar mouse sobre objeto
        // gameState.circle.on('pointermove', function(pointer) {  // si usamos posicion del cursor dentro de funcion le pasamos pointer
        //    this.fillColor += 0xF0F8FF;     // this aca se refiere al circulo                 
        //    gameState.circle.x = pointer.x; // la posiscion del circulo en x sigue la del cursor
        // });
        // los event listeners permiten que cosas cambien sin estar en el update,forman parte de la definicion del objeto y seteo del juego
    
        // eventos del teclado
        // 2 formas
        // primer forma solo en create()
        // this.input.keyboard.on(accion-tecla,funcion)
        // this.input.keyboard.on('keydown-UP', function() {
        //     gameState.circle.radius += 5 ;      // problema no cambia hitbox
        // });
        // this.input.keyboard.on('keydown-DOWN', function() { 
        //     gameState.circle.radius -= 5 ;      // problema no cambia hitbox
        // });
        // segunda forma con create() y update() para flechitas, shift y espacio
        // gameState.cursors = this.input.keyboard.createCursorKeys()
        // gameState.cursors = this.input.keyboard.createCursorKeys()
        // sigue en update()
        // if (gameState.cursors.left.isDown) {
        //  gameState.circle.x -= 3;
        // }
        // createCursorKeys() // parece que genera interferencia si se usan esas teclas en otras cosas aunque no se usen en update
        
        this.tweens.add({
            targets: gameState.rectangle,
            duration: 1000, 
            x: 1000,
        });
        
        /*
        this.input.on('pointerdown', function () {
            if (!tween.isPlaying())
            {
                tween.play();
            }
        });
        */

        //this.input.keyboard.on('keydown-UP', function() {
        //    this.tween.play();
        //});

        gameState.rectangle.on('pointerdown', function() {
            this.scene.stop('prueba');
            this.scene.start('tablero'); // Cambiar a tu escena principal
        });
    }

    update() {
        
        gameState.dron.on('pointerdown', function() {  // si usamos posicion del cursor dentro de funcion le pasamos pointer 
            gameState.apretado = true;   
        });

        gameState.dron.on('pointerup', function(){
            gameState.apretado = false;
        });  

        if (gameState.apretado) {
            gameState.dron.x = this.input.x; // la posiscion del circulo en x sigue la del cursor
            gameState.dron.y = this.input.y;
            
        } else {
            gameState.dron.anims.play('idle',true);
        };


        // if (gameState.cursors.left.isDown) {
        //    gameState.circle.x -= 3;
        // }
    } 
}
