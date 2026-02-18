gameState = {
    colorVerde: 0xaaffaa,
    colorRojo: 0xffaaaa,
    width: 64, 
    height: 36
}; 
var conj;

class Cell {
    constructor (grid, x, y) {
        this.res = 22.45;
        
        this.tile = grid.scene.add.image((y*this.res),(x*this.res),"tileT").setScale(1.45);
        this.tile.setInteractive();

        grid.board.add(this.tile);
    }
}   

class Grid
{
    constructor (scene)
    {  
        this.scene = scene; 

        this.size = gameState.width * gameState.height;
        this.offset = new Phaser.Math.Vector2(12, 55);

        // scene.add.container(escena, posx, posy, [hijos])
        this.board = this.scene.add.container (45, 55);   // 930, 530
        
        //this.board.setScrollFactor(1, 1);

        this.createCells();

        let posx = scene.add.text(1500 , 900,"X: ", { fill: "#222222", font: "40px Times New Roman"});
        let posy = scene.add.text(1500 , 1000,"Y: ", { fill: "#222222", font: "40px Times New Roman"});
        let indx = scene.add.text(1700 , 900,"iX: ", { fill: "#222222", font: "40px Times New Roman"});
        let indy = scene.add.text(1700 , 1000,"iY: ", { fill: "#222222", font: "40px Times New Roman"});
        
        for (let l=0 ; l<this.size; l++) {
            let celda = this.board.getAt(l);
            let par = 0;
            celda.on('pointerdown', function()
            {
                if (par % 3 === 0){
                    celda.setTint(0x44ff44);
                    par++;
                } else if (par % 3 === 1) {
                    celda.setTint(0xff44ff);
                    par++;
                } else {
                    celda.clearTint();
                    par++;
                }
                posx.setText("X: "+ Phaser.Math.RoundTo(celda.x, 0) );
                posy.setText("Y: "+ Phaser.Math.RoundTo(celda.y, 0) );       
                indx.setText("iX: "+ Phaser.Math.ToXY(l, gameState.width, gameState.height).x);  // this.board.getIndex(celda) 
                indy.setText("iY: "+ Phaser.Math.ToXY(l, gameState.width, gameState.height).y);
            });
            //celda.on('pointerout', function()
            //{
            //    celda.clearTint();
            //});
        }

        // posicion child
        // const p = container.localTransform.transformPoint(sprite.x, sprite.y);

    }

    createCells ()
    {   
        for (var i = 0; i < gameState.height; i++) {
            for (var j = 0; j< gameState.width; j++) {
                new Cell(this,i,j);
            }
        }
    }
    /*
    getCell (index)
    {
        const pos = Phaser.Math.ToXY(index, this.width, this.height);      // transforma un numero index a su ubicacion en una matrix XY

        return this.data[pos.x][pos.y];
    }*/
    /*
    getCellXY (x, y)
    {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
        {
            return null;
        }

        return this.data[x][y];
    }*/
}

class escena3 extends Phaser.Scene {

    constructor() {
        super({key: "tablero"});  // nombre de escena
    }
    
    preload() {
        this.load.image("tileT",".//assets/tilesets/tileT.png");
        this.load.image("Fondo1",".//assets/fondo.png");
    }

    create() {  

        var fondo = this.add.image(960,540,"Fondo1");
        fondo.setScale(1);

        this.grid = new Grid(this);
    }

    update() {
    }

}

