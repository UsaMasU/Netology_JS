'use strict';

class Vector {
// класс контролирует расположение объектов в двумерном пространстве и управляет их размером и перемещением
    constructor(left = 0, top = 0) {
        // левый верхний угол обьекта
		this.x = left;  
        this.y = top;
    }

    plus(vectorObj) {
	// сложение координат
        if (!(vectorObj instanceof Vector)) {
            throw new Error("Можно прибавлять к вектору только вектор типа Vector");
        } 
        return new Vector(vectorObj.x + this.x, vectorObj.y + this.y)
    }
	
	times(mul) {
	// умножение координат
		return new Vector(this.x * mul, this.y * mul)
	}
}

class Actor {
//  класс контролирует все движущиеся объекты на игровом поле и определяет их пересечения
	constructor(pos = new Vector(0, 0), size =  new Vector(1, 1), speed = new Vector(0, 0)) {	
		// проверка что аргументы являются обьектами Vector
		if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
            throw new Error("Нужно передавать только обьект типа Vector");
        }
		
		this.pos = pos;  // позиция
		this.size = size;  // размер
		this.speed = speed;  // скорость
		this._type = 'actor';  // тип объекта
		Object.defineProperty(this, '_type', {writable: false});
	}
	
	get type() {return this._type;}  // получение типа обьекта
	set type(newType) {this._type = newType;}  // смена типа обьекта
	
	get left() {return this.pos.x;}  // левый край
	get top() {return this.pos.y;}  // верхний край
	get right() {return this.pos.x + this.size.x;}  // правый край
	get bottom() {return this.pos.y + this.size.y;}  // нижний край
	
	act() { 
	// пустой метод 
	}
	
	isIntersect(actorObj) {
	// контроль пересечния оьбектов
		// проверка что аргумент является обьектом Actor
		if(!(actorObj instanceof Actor)) {
			throw new Error("Нужно передавать только обьект типа Actor");
		}

		/*
		(this.left, this.top)______________
				   |                   	   |
				   |                   	   |
				   |                   	   |
				   |___________(this.right, this.bottom)
				   
				(actorObj.left, actorObj.top)_______________________
							  |                          			|
							  |                          			|
							  |                          			|
							  |_____________________(actorObj.right, actorObj.bottom)
		*/

		// проверка пересечения с самим собой
		if (actorObj == this) {return false;}
		
		// пересечения обьектов (смежные границы не являются пересечением)
		if(!(this.top + 0.1 > actorObj.bottom || this.bottom - 0.1 < actorObj.top || this.right - 0.1 < actorObj.left || this.left + 0.1 > actorObj.right)) {
			return true;
		}
		
		// нет пересечений
		else {return false;}
	}	
	
}

class Level {
// класс реализует схему игрового поля конкретного уровня, контролирует все движущиеся объекты на нём и реализует логику игры. Уровень представляет собой координатное поле, имеющее фиксированную ширину и высоту
	constructor(grid = 0, actors = 0) {
		this.grid = grid;  // сетка уровня 
		this.actors = actors;  // объекты уровня
		
		for(let actor in this.actors) {
			if(this.actors[actor].type == 'player') {
				this.player = this.actors[actor];
			}
		}
		
		this.grid.length ? this.height = this.grid.length : this.height = 0;   // высота игрового поля уровня
		
		this.width = 0;  // ширина игрового поля уровня
		for(let x in this.grid) {
			if(this.grid[x].length > this.width) {
				this.width = this.grid[x].length;
			}
		}

		this.status = null;  //  статус уровня
		this.finishDelay = 1;  // пауза при завершении уровня
	}
	
	isFinished() {
	// определяет, завершен ли уровень
		if(this.status != null && this.finishDelay < 0) {
			return true;
		}
		return false;
	}
	
	actorAt(actorObj) {
	// определяет, расположен ли какой-то другой движущийся объект в переданной позиции, и если да, вернёт этот объект. Если нет то вернет undefined
		// проверка что аргумент является обьектом Actor
		if(!(actorObj instanceof Actor)) {
			throw new Error("Нужно передавать только обьект типа Actor");
		}
			
		// проверка пересечений с обьектами
		for(let actor in this.actors) {
			if(actorObj.isIntersect(this.actors[actor])) {
				return this.actors[actor]
			}
		}		
		return undefined;
	}
	
	obstacleAt(vectorPos, vectorSize) {
	// аналогично методу actorAt определяет, нет ли препятствия в указанном месте. Также этот метод контролирует выход объекта за границы игрового поля
		// проверка что аргументы являются обьектами Vector
		if (!(vectorPos instanceof Vector) || !(vectorSize instanceof Vector)) {
            throw new Error("Нужно передавать только обьект типа Vector");
        }
		
		// создание временного обьекта из переданных векторов 	
		let actorObj = new Actor(vectorPos, vectorSize, new Vector());
		
		// пересечение с лавой
		if(actorObj.bottom > this.height) {
			return 'lava';
		}
	
		// пересечение со стеной
		if(actorObj.left < 0.0 || actorObj.right > this.width || actorObj.top < 0.0) {
			return 'wall';
		}
		
		if(this.status != 'lost') {
			
			//let lRaw = actorObj.left;
			//let tRaw = actorObj.top;
			//let rRaw = actorObj.right;
			//let bRaw = actorObj.bottom;
			
			let lRnd = Math.floor(actorObj.left + 0.01);
			let tRnd = Math.round(actorObj.top);
			let rRnd = Math.floor(actorObj.right - 0.01);
			let bRnd = Math.floor(actorObj.bottom - 0.01);
			
			let lt = this.grid[tRnd][lRnd];
			let rt = this.grid[tRnd][rRnd];
			let rb = this.grid[bRnd][rRnd];
			let lb = this.grid[bRnd][lRnd];
			
			/*
			//console.log(this.grid);
			//console.log(this.player);
			//console.log(actorObj);
			console.log('pos:', vectorPos, 'size:', vectorSize);
			
			//console.log('top raw:', tRaw, 'top rnd:', tRnd); 
			//console.log('left raw:', lRaw, 'left rnd:', lRnd);
			//console.log('bottom raw:', bRaw, 'bottom rnd:', bRnd);
			//console.log('right raw:', rRaw, 'right rnd:', rRnd);
			
			console.log('grid: left-top:', lt);
			console.log('grid: right-top:', rt);			
			console.log('grid: right-bottom:', rb);
			console.log('grid: left-bottom:', lb);
			*/
			
			if (lt == 'lava' || rb == 'lava' || rt == 'lava' || lb == 'lava') {
				return 'lava';
			}
			else if(lt == 'wall' || rb == 'wall' || rt == 'wall' || lb == 'wall') {
				return 'wall';
			}

			else {
				return undefined
			}
		}
		
	}
	
	removeActor(actorObj) {
	// метод удаляет переданный объект с игрового поля. Если такого объекта на игровом поле нет, не делает ничего
		let actorRem = this.actors.indexOf(actorObj);
		if(actorRem == -1) {
			return false;
		}
		this.actors.splice(actorRem, 1);
	}
	
	noMoreActors(vectorType) {
	// определяет, остались ли еще объекты переданного типа на игровом поле
		for(let actorIndex in this.actors) {
			if(this.actors[actorIndex].type == vectorType) {
				return false;
			}
		}
		return true;
	}
	
	playerTouched(actorType, actorObj = 0) {
	// меняет состояние игрового поля при касании игроком каких-либо объектов или препятствий
		if(this.status != null) {return;}
		
		// завершение игры
		if(actorType == 'lava' || actorType == 'fireball') {
			this.status = 'lost';
		}
		
		// игрок подобрал монету
		if(actorType == 'coin') {
			this.removeActor(actorObj);
			// проверка остались ли еще монеты
			if(this.noMoreActors(actorType)) {
				// все мнеты собраны - уровень пройден
				this.status = 'won'; // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			}
		}
	}		
}

class LevelParser {
// создает игровое поле
	constructor(actrosDisct) {
		this.actorsDict = actrosDisct;
		this.grid;
		this.actors;
	}
	
	actorFromSymbol(actorSymbol) {
	// возвращает конструктор объекта по его символу
		if(!actorSymbol) {return undefined}
		return this.actorsDict[actorSymbol]
	}
	
	obstacleFromSymbol(obstacleSymbol) {
	// возвращает строку, соответствующую символу препятствия
		if(obstacleSymbol == 'x') {
			return 'wall';
		}
		if(obstacleSymbol == '!') {
			return 'lava';
		}
		return undefined;
	}
	
	createGrid(planLevel) {
	// принимает массив строк и преобразует его в массив массивов, в ячейках которого хранится либо строка, соответствующая препятствию, либо `undefined`
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
	// принимает массив строк и преобразует его в массив движущихся объектов, используя для их создания классы из словаря
		let actors = [];  // маассив для обьектов Actors
		if(!this.actorsDict) {return actors}  // проверка что словарь не пуст
		
		for(let y in planLevel) {  // перебор строк плана уровня (y)		
			for(let x = 0; x < planLevel[y].length; x++) {  // перебор ячеек плана уровня (x)	
				let actorObjGrid;	
			
				let actorObj = this.actorFromSymbol(planLevel[y][x]);				
				if((typeof actorObj) != 'function') {continue;}  // если в не функция, то пропускаем
				
				// создание обьекта			
				actorObjGrid = new actorObj(new Vector(parseInt(x), parseInt(y)));  // создание обьекта с координатами
								
				if(!(actorObjGrid instanceof Actor)) {continue;}  // если обьект не потомок Actor, то пропускаем	
				actors.push(actorObjGrid);  // добавляем в массив
			}
		}
		return actors;
	}
	
	parse(planLevel) {
	// создает и возвращает игровое поле, заполненное препятствиями и движущимися объектами, полученными на основе символов и словаря
		return new Level(this.createGrid(planLevel), this.createActors(planLevel))
	}
	
}

class Fireball extends Actor {
// шаровая молния. Прототип для движущихся опасностей на игровом поле
	constructor(pos = 0, speed = 0) {
		super(pos? pos: new Vector(), new Vector(1,1), speed? speed: new Vector(1,0));
		Object.defineProperty(this, 'type', {writable: true});
		this.type = 'fireball';
		Object.defineProperty(this, 'type', {writable: false});
	}
	
	getNextPosition(time = 1) {
	// возвращает новую позицию — это текущая позиция плюс скорость, умноженная на время. И так по каждой из осей. 
		return new Vector(this.pos.x + (this.speed.x * time), this.pos.y + (this.speed.y * time));
	}
	
	handleObstacle() {
	// обрабатывает столкновение молнии с препятствием. Меняет вектор скорости на противоположный
		this.speed = new Vector(this.speed.x * (-1), this.speed.y * (-1));
	}
	
	act(time, level) {
	// обновляет состояние движущегося объекта
		let newPos = this.getNextPosition(time);  // получение следующей позиции

		// пролверка пересечения с каким либо преаятствием
		if(level.obstacleAt(newPos, this.size) == undefined) {
			this.pos = newPos;  // если нет препятствия, обновить текущую позицию объекта
		} 
		else {
			this.handleObstacle();  // если есть, оттолкнуться
		}	
	}
}

class HorizontalFireball extends Fireball {
// горизонтальная шаровая молния
	constructor(pos = 0, speed = 0) {
		super(pos? pos: new Vector(), speed? speed: new Vector(2,0), new Vector(1,1));
	}
	
	getNextPosition(time = 2) {
	// возвращает новую позицию — это текущая позиция плюс скорость, умноженная на время. По оси X 
		return new Vector(this.pos.x + (this.speed.x * time), this.pos.y);
	}
}

class VerticalFireball extends Fireball {
// гвертикальная шаровая молния
	constructor(pos = 0, speed = 0) {
		super(pos? pos: new Vector(), speed? speed: new Vector(0,2), new Vector(1, 1));
	}
	
	getNextPosition(time = 2) {
	// возвращает новую позицию — это текущая позиция плюс скорость, умноженная на время. По оси Y 
		return new Vector(this.pos.x, this.pos.y + (this.speed.y * time));
	}
}

class FireRain extends Fireball {
// огненный дождь. Движется по вертикали со скоростью `3` и при столкновении с препятствием начинает движение в том же направлении из исходного положения, которое задано при создании.
	constructor(pos = 0, speed = 0) {
		super(pos? pos: new Vector(), speed? speed: new Vector(0,3), new Vector(1, 1));
		this.posSave = this.pos;
	}
	
	getNextPosition(time = 3) {
	// возвращает новую позицию — это текущая позиция плюс скорость, умноженная на время. По оси Y 
		return new Vector(this.pos.x, this.pos.y + (this.speed.y * time));
	}
	
	handleObstacle() {
	// обрабатывает столкновение с препятствием. Появляется заного в месте генерации
		this.pos = this.posSave;
	}
}

class Coin extends Actor {
// реализует поведение монетки на игровом поле
	constructor(pos) {
		super(pos, new Vector(0.6, 0.6), new Vector(0,0));
		this.pos = this.pos.plus(new Vector(0.2, 0.1));
		this.posBase = this.pos;
		Object.defineProperty(this, 'type', {writable: true});
		this.type = 'coin'; 
		Object.defineProperty(this, 'type', {writable: true});
		this.springSpeed = 8;  // скорость подпрыгивания
		this.springDist = 0.07;  // радиус подпрыгивания
		this.spring = Math.random() * (2 * Math.PI); // фаза подпрыгивания - случайное число от `0` до `2π`
	}
	
	updateSpring(time = 1){
	// обновляет фазу подпрыгивания. Это функция времени
		this.spring = this.spring + (this.springSpeed * time);
	}
	
	getSpringVector() {
	// создает и возвращает вектор подпрыгивания
		return new Vector(0, Math.sin(this.spring) * this.springDist);
	}
	
	getNextPosition(time = 1) {
	// обновляет текущую фазу, создает и возвращает вектор новой позиции монетки
		this.updateSpring(time)
		return this.posBase.plus(this.getSpringVector());
	}
	
	act(time) {
	// получает новую позицию объекта и задает её как текущую
		this.pos = this.getNextPosition(time);
	}
}

class Player extends Actor {
// представляет игрока на игровом поле
		constructor(pos) {
			super(pos, new Vector(0.8, 1.5), new Vector(0,0));
			this.pos = this.pos.plus(new Vector(0.0, -0.5));
			Object.defineProperty(this, 'type', {writable: true});
			this.type = 'player'; 
			Object.defineProperty(this, 'type', {writable: true});
		}	
}
/*
//bottom wall
const grid = [
  Array(4),
  Array(4),
  Array(4),
  Array(4).fill('wall')
];
const level = new Level(grid);
const position = new Vector(2.1, 1.5);
const size = new Vector(0.8, 1.5);
const nothing = level.obstacleAt(position, size);

/*
// right wall
const grid = [
  Array(4),
  ['wall', undefined, undefined, undefined],
  Array(4),
  Array(4)
];
const level = new Level(grid);
const position = new Vector(1, 1.5);
const size = new Vector(0.8, 1.5);
const nothing = level.obstacleAt(position, size);

// left wall
const grid = [
  Array(4),
  [undefined, undefined, 'wall', undefined],
  Array(4),
  Array(4)
];
const level = new Level(grid);
const position = new Vector(1.2, 1.5);
const size = new Vector(0.8, 1.5);
const nothing = level.obstacleAt(position, size);
*/

/*
const schema = [
  '         ',
  '         ',
  '   @ x!x ',
  '         ',
  '       ! ',
  '    x    ',
  'xxxxxxxxx',
  '         '
];
const actorDict = {
  '@': Player
}
const parser = new LevelParser(actorDict);
const level = parser.parse(schema);
runLevel(level, DOMDisplay);
*/


/*
const schemas = [
	[
    '           !',
	'     x      ',
    '  xxxxxxx   ',
	'            ',
    '            ',
    'xxxxxxxxx xx',
    '            ',
	'            ', 
    '  @         ',
    'xxxxxx xxxxx',
    'xxx         '
	]
  ];
*/


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
