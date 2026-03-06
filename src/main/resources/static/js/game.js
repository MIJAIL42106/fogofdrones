var config = {
    type:Phaser.AUTO,
    scale: {
        mode:Phaser.Scale.FIT,                  // scala automaticamente // RESIZE // solo elementos phaser
        autoCenter:Phaser.Scale.CENTER_BOTH,    // centra automaticamente
        width:1920,                             // ancho de pantalla
        height:1080,                            // alto de pantalla
    },
    backgroundColor: "#000000",

    scene:[ 
        escena1,    // escena de menu
        escena3,    // escena de partida
    ]  
}

var game = new Phaser.Game(config)