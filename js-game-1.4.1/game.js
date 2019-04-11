'use strict';

class Vector {
  constructor(left = 0, top = 0) {
		this.x = left;
		this.y = top;
  }

  plus(vectorObj) {
		if (!(vectorObj instanceof Vector)) {
			throw new Error("Можно прибавлять к вектору только вектор типа Vector");
		} 
		return new Vector(vectorObj.x + this.x, vectorObj.y + this.y)
  }
	
	times(mul) {
		return new Vector(this.x * mul, this.y * mul)
	}
}

class Actor {
	constructor(pos = new Vector(0, 0), size =  new Vector(1, 1), speed = new Vector(0, 0), type = 'actor') {	
		if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
			throw new Error("Нужно передавать только обьект типа Vector");
		}	
		this.pos = pos;
		this.size = size;
		this.speed = speed;
		this.type = type;
		Object.defineProperty(this, 'type', {writable: false});
	}
	
	get left() {
		return this.pos.x;
	}  
	
	get top() {
		return this.pos.y;
	} 

	get right() {
		return this.pos.x + this.size.x;
	} 

	get bottom() {
		return this.pos.y + this.size.y;
	} 
	
	act() { 
	}
	
	isIntersect(actorObj) {
		if(!(actorObj instanceof Actor)) {
			throw new Error("Нужно передавать только обьект типа Actor");
		}
	
		// проверка пересечения с самим собой
		if (actorObj == this) {  
			return false;
		}
		
		// пересечения обьектов (смежные границы не являются пересечением)
		if(!(this.top + 0.1 > actorObj.bottom || this.bottom - 0.1 < actorObj.top || this.right - 0.1 < actorObj.left || this.left + 0.1 > actorObj.right)) {
			return true;
		}
		
		else {
			return false;
		}
	}		
}

class Level {
	constructor(grid = 0, actors = 0) {
		this.grid = grid;
		this.actors = actors;
		
		for(let actor in this.actors) {
			if(this.actors[actor].type == 'player') {
				this.player = this.actors[actor];
			}
		}
		
		this.grid.length ? this.height = this.grid.length : this.height = 0;
		
		this.width = 0;
		for(let x in this.grid) {
			if(this.grid[x].length > this.width) {
				this.width = this.grid[x].length;
			}
		}

		this.status = null;
		this.finishDelay = 1;
	}
	
	isFinished() {
		return (this.status != null && this.finishDelay < 0); 
	}
	
	actorAt(actorObj) {
		if(!(actorObj instanceof Actor)) {
			throw new Error("Нужно передавать только обьект типа Actor");
		}
			
		// проверка пересечений с обьектами
		for(let actor in this.actors) {
			if(actorObj.isIntersect(this.actors[actor])) {
				return this.actors[actor]
			}
		}
	}
	
	obstacleAt(vectorPos, vectorSize) {
		if (!(vectorPos instanceof Vector) || !(vectorSize instanceof Vector)) {
			throw new Error("Нужно передавать только обьект типа Vector");
    }
		
		// создание временного обьекта из переданных векторов 	
		let actorObj = new Actor(vectorPos, vectorSize, new Vector());
		
		if(actorObj.bottom > this.height) {
			return 'lava';
		}
	
		if(actorObj.left < 0.0 || actorObj.right > this.width || actorObj.top < 0.0) {
			return 'wall';
		}
		
		if(this.status != 'lost') {	
			let left = Math.floor(actorObj.left + 0.01);  
			let top = Math.ceil(actorObj.top - 0.8);  
			let right = Math.floor(actorObj.right - 0.01);  
			let bottom = Math.floor(actorObj.bottom - 0.01);  
			
			let leftTop = this.grid[top][left];  
			let rightTop = this.grid[top][right];  
			let rightBottom = this.grid[bottom][right];  
			let leftBottom = this.grid[bottom][left];  
			
			let leftCenter = this.grid[Math.round(top + ((bottom - top)/2))][left];  // левая сторона центр
			let rightCenter = this.grid[Math.round(top + ((bottom - top)/2))][right];  // правая сторона центр
			
			if (leftTop == 'lava' || rightBottom == 'lava' || rightTop == 'lava' || leftBottom == 'lava') {
				return 'lava'; 
			}
			else if(leftTop == 'wall' || rightBottom == 'wall' || rightTop == 'wall' || leftBottom == 'wall' || leftCenter == 'wall' || rightCenter == 'wall') {
				return 'wall';
			}
		}
	}
	
	removeActor(actorObj) {
		let actorRem = this.actors.indexOf(actorObj);
		if(actorRem == -1) {
			return false;
		}
		this.actors.splice(actorRem, 1);
	}
	
	noMoreActors(vectorType) {
		return !(this.actors.some(checkActor => checkActor.type == vectorType))
	}
	
	playerTouched(actorType, actorObj = 0) {
		if(this.status != null) {
			return
		}
		
		if(actorType == 'lava' || actorType == 'fireball') {
			this.status = 'lost';
		}
		
		if(actorType == 'coin') {
			this.removeActor(actorObj);
			if(this.noMoreActors(actorType)) {
				this.status = 'won';
			}
		}
	}		
}

class LevelParser {
	constructor(actrosDisct) {
		this.actorsDict = actrosDisct;
		this.grid;
		this.actors;
	}
	
	actorFromSymbol(actorSymbol) {
		if(!actorSymbol) {
			return undefined;
		}
		return this.actorsDict[actorSymbol];
	}
	
	obstacleFromSymbol(obstacleSymbol) {
		if(obstacleSymbol == 'x') {
			return 'wall';
		}
		if(obstacleSymbol == '!') {
			return 'lava';
		}
		return undefined;
	}
	
	createGrid(planLevel) {
		let grid = [];
		for(let row in planLevel) {
			let gridRow = [];
			for(let elem = 0; elem < planLevel[row].length; elem++) {
				gridRow.push(this.obstacleFromSymbol(planLevel[row][elem]));
			}
			grid.push(gridRow);
		}
		return grid;
	}
	
	createActors(planLevel) {
		let actors = []; 
		if(!this.actorsDict) {
			return actors
		}
		
		for(let y in planLevel) { 	
			for(let x = 0; x < planLevel[y].length; x++) { 
				let actorObjGrid;	
				
				let actorObj = this.actorFromSymbol(planLevel[y][x]);				
				if((typeof actorObj) != 'function') {
					continue;
				} 
				
				actorObjGrid = new actorObj(new Vector(parseInt(x), parseInt(y))); 				
				if(!(actorObjGrid instanceof Actor)) {
					continue;
				}  
				actors.push(actorObjGrid); 
			}
		}
		return actors;
	}
	
	parse(planLevel) {
		return new Level(this.createGrid(planLevel), this.createActors(planLevel))
	}
	
}

class Fireball extends Actor {
	constructor(pos = 0, speed = 0) {
		super(pos? pos: new Vector(), new Vector(1,1), speed? speed: new Vector(1,0), 'fireball');
	}
	
	getNextPosition(time = 1) {
		return new Vector(this.pos.x + (this.speed.x * time), this.pos.y + (this.speed.y * time));
	}
	
	handleObstacle() {
		this.speed = new Vector(this.speed.x * (-1), this.speed.y * (-1));
	}
	
	act(time, level) {
		let newPos = this.getNextPosition(time);
		if(level.obstacleAt(newPos, this.size) == undefined) {
			this.pos = newPos;
		} 
		else {
			this.handleObstacle();
		}	
	}
}

class HorizontalFireball extends Fireball {
	constructor(pos = 0, speed = 0) {
		super(pos? pos: new Vector(), speed? speed: new Vector(2,0), new Vector(1,1));
	}
	
	getNextPosition(time = 2) {
		return new Vector(this.pos.x + (this.speed.x * time), this.pos.y);
	}
}

class VerticalFireball extends Fireball {
	constructor(pos = 0, speed = 0) {
		super(pos? pos: new Vector(), speed? speed: new Vector(0,2), new Vector(1, 1));
	}
	
	getNextPosition(time = 2) {
		return new Vector(this.pos.x, this.pos.y + (this.speed.y * time));
	}
}

class FireRain extends Fireball {
	constructor(pos = 0, speed = 0) {
		super(pos? pos: new Vector(), speed? speed: new Vector(0,3), new Vector(1, 1));
		this.posSave = this.pos;
	}
	
	getNextPosition(time = 3) {
		return new Vector(this.pos.x, this.pos.y + (this.speed.y * time));
	}
	
	handleObstacle() {
		this.pos = this.posSave;
	}
}

class Coin extends Actor {
	constructor(pos) {
		super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6), new Vector(0,0), 'coin');
		this.posBase = this.pos;
		this.springSpeed = 8; 
		this.springDist = 0.07; 
		this.spring = Math.random() * (2 * Math.PI); 
	}
	
	updateSpring(time = 1){
		this.spring = this.spring + (this.springSpeed * time);
	}
	
	getSpringVector() {
		return new Vector(0, Math.sin(this.spring) * this.springDist);
	}
	
	getNextPosition(time = 1) {
		this.updateSpring(time)
		return this.posBase.plus(this.getSpringVector());
	}
	
	act(time) {
		this.pos = this.getNextPosition(time);
	}
}

class Player extends Actor {
	constructor(pos) {
		super(pos.plus(new Vector(0.0, -0.5)), new Vector(0.8, 1.5), new Vector(0,0), 'player');
	}
}


const schemas = [
  [
		'            ',
		'=       o   ',
		' o    xxx!  ',
		' |        v ',
		'      o     ',
		'      xxx   ',
		' xx x       ',
		'            ', 
		'  @     x  o',
		'xxxxxx xxxxx',
		'            '
  ],
  [
    '      v    |',
    '  v v       ',
    '   x o      ',
    ' x   x   o  ',
    '         x  ',
    '@   x      o',
    'xx         x',
    '            '
  ],
  [
    '   |          v    = ',
    '     xxx!v     o  x! ',
    '             o     v ',
    '     o           o   ',
    '     x       x   x   ',
    '@          x      o= ',
    'xx               xx  ',
    '        x            '
  ]
];

const actorDict = {
  '@': Player,
  'v': FireRain,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'o': Coin
}

const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));