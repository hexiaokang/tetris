window.$=HTMLElement.prototype.$=function(selector){
	var elems=(this==window?document:this)
				.querySelectorAll(selector);
	return elems==null?null:elems.length==1?elems[0]:elems;
}
var tetris={
	RN:20, //总行数
	CN:10, //总列数
	CELL_SIZE:26, //每个单元格(img)的宽高
	OFFSET:15, //左边框和上边框的宽度

	shape:null, //指代当前正在下落的主角图形

	interval:500,//动画的时间间隔
	timer:null,//动画的序号

	wall:[],//保存所有方块墙中方块的二维数组
	nextShape:null,//保存下一个图形对象

	score:0,//保存得分
	SCORES:[0,10,50,80,200],//保存分数的等级
	       // 1  2  3  4
	lines:0,//保存共删除的行数
	level:1,//保存游戏的难度

	state:0,//保存游戏状态
	STATE_RUNNING:1,//运行状态
	STATE_PAUSE:2,//暂停状态
	STATE_OVER:0,//游戏结束

	IMG_OVER:"img/game-over.png",
	IMG_PAUSE:"img/pause.png",

	//启动游戏
	start:function(){var self=this;//留住this
		//同时生成主角和下一个图形对象
		self.shape=self.randomShape();
		self.nextShape=self.randomShape();
		
		this.state=this.STATE_RUNNING;

		//初始化分数
		self.score=0;
		self.lines=0;
		self.level=1;

		//初始化方块墙数组
		for(var i=0;i<this.RN;self.wall[i++]=[]);
		//绑定keydown事件
		document.onkeydown=function(){
			self.keydown();
		};
		self.paint();
		self.timer=setInterval(function(){
			self.down();
		},self.interval);
	},
	//判断主角方块是否可以继续下落,返回true/false
	canDown:function(){
		//遍历主角图形Shape中每个cell对象
		for(var i=0;i<this.shape.cells.length;i++){
			var cell=this.shape.cells[i];
		//	如果cell的row等于RN-1
			if(cell.row==this.RN-1
				||this.wall[cell.row+1][cell.col]){
		//      或者 wall中相同位置的下方cell有效
				return false;//就返回false
			}
		}//(退出遍历)返回true
		return true;
	},
	//将停止下落的shape中cell移入wall中相同位置
	landIntoWall:function(){
		//遍历shape中每个cell
		for(var i=0;i<this.shape.cells.length;i++){
			var cell=this.shape.cells[i];
		//	  将当前cell保存到wall中相同位置上
			this.wall[cell.row][cell.col]=cell;
		}
	},
	paintNextShape:function(){//绘制next图形
		var frag=document.createDocumentFragment();
		for(var i=0;i<this.nextShape.cells.length;i++){
			var cell=this.nextShape.cells[i];
			var img=new Image();
			img.src=cell.img;
			img.style.left=
			(cell.col+10)*this.CELL_SIZE+this.OFFSET+"px";
			img.style.top=
			(cell.row+1)*this.CELL_SIZE+this.OFFSET+"px";
			frag.appendChild(img);
		}
		$(".playground").appendChild(frag);
	},
	down:function(){//下落方法
		if(this.canDown()){//如果可以下落，才调用下落方法
			this.shape.down();//只是修改了对象的数据
		}else{//停止下落后
			this.landIntoWall();//将shape中cell放入wall中
			
			/*消除行，并计分*/
			this.deleteRows();

			if(this.isGameOver()){//如果游戏结束
				this.gameOver();//执行结束方法
			}else{//否则，就要继续替换shape，并生成next
				this.shape=this.nextShape;
				this.nextShape=this.randomShape();
			}
		}
		this.paint();//重绘一切
	},
	gameOver:function(){
		this.state=this.STATE_OVER;
		clearInterval(this.timer);
		this.timer=null;
		this.paint();
	},
	//判断游戏是否结束：nextShape没有足够空间显示
	isGameOver:function(){
		for(var i=0;i<this.nextShape.cells.length;i++){
			var cell=this.nextShape.cells[i];
			if(this.wall[cell.row][cell.col]){
				return true;
			}
		}
		return false;
	},
	paintState:function(){
		var img=new Image();
		switch(this.state){
			case this.STATE_OVER:
				img.src=this.IMG_OVER;
				break;
			case this.STATE_PAUSE:
				img.src=this.IMG_PAUSE;
		}
		$(".playground").appendChild(img);
	},
	//在paint方法结尾，调用paintScore方法
	paintScore:function(){//将分数，行数，等级刷到界面
		//找到playground下第一个span,设置内容为score
		$(".playground>p:first-child>span").innerHTML=this.score;
		//找到playground下第二个span,设置内容为lines
		$(".playground>p:first-child+p>span").innerHTML=this.lines;
		//找到playground下第三个span,设置内容为level
		$(".playground>p:first-child+p+p>span").innerHTML=this.level;
	},
	deleteRows:function(){//消除所有行
		//r从RN-1开始，到0结束，遍历wall中每一行
		for(var r=this.RN-1,lines=0;r>=0;r--){
		//	如果当前行无缝拼接后等于"",退出循环
			if(this.wall[r].join("")==""){break;}
			else if(this.fullCells(r)){//否则 如果满格
				lines++;
		//		就调用deleteRow(r++)删除后，保持r不变
				this.deleteRow(r++);
				//重新检查下降后的当前行
			}
		}//lines保存了本次删除的行数
		this.lines+=lines;//将lines追加到总行数中
		this.score+=this.SCORES[lines];//将得分追加到总分
	},
	deleteRow:function(row){//负责判断并消除指定行
		//r从row开始，反向遍历wall中每一行，到0结束
		for(var r=row;r>=0;r--){
			this.wall[r]=this.wall[r-1];//将r-1行保存到r行
			this.wall[r-1]=[];//将r-1行设置为[]
		//  遍历r行中每个cell
			for(var c=0;c<this.CN;c++){
				//如果cell有效,将cell的row++;
				this.wall[r][c]&&(this.wall[r][c].row++);
			}
		//  如果r-2行无缝拼接后等于"",就退出循环
			if(this.wall[r-2].join("")==""){break;}	
		}
	},
	fullCells:function(row){//负责判断row行是否满格
		//遍历wall中当前行的所有格
		for(var c=0;c<this.CN;c++){
			if(!this.wall[row][c]){//如果当前格无效
				return false;//返回false
			}
		}return true;//(退出循环)返回true
	},
	paint:function(){//删除pg中所有img元素,重绘一切
		$(".playground").innerHTML=
			   $(".playground").innerHTML
							   .replace(/<img(.*?)>/g,"");
		this.paintSharp();
		this.paintNextShape();
		this.paintWall();
		this.paintScore();
		this.paintState();
	},
	paintWall:function(){
		//创建文档片段frag
		var frag=document.createDocumentFragment();
		for(var r=0;r<this.RN;r++){//遍历wall二维数组
			for(var c=0;c<this.CN;c++){
		//	将当前cell保存在cell中
				var cell=this.wall[r][c];
				if(cell){//如果cell有效
		//		new一个Image对象，保存在img中
					var img=new Image();
		//      设置img的src为cell的img
					img.src=cell.img;
		//      设置img的left为cell.col*CELL_SIZE+OFFSET;
		img.style.left=c*this.CELL_SIZE+this.OFFSET+"px";
		//      设置img的top为cell.left*CELL_SIZE+OFFSET;
		img.style.top=r*this.CELL_SIZE+this.OFFSET+"px";
		//      将img追加到frag中
					frag.appendChild(img);
				}
			}
		}//将文档片段追加到.playground中
		$(".playground").appendChild(frag);
	},
	randomShape:function(){//随机生成一个图形对象
		switch(Math.floor(Math.random()*4)){
			case 0:return new O();
			case 1:return new I();
			case 2:return new T();
			case 3:return new S();
		}
	},
	//将shape中保存的图形，转换成多个img追加到pg中
	paintSharp:function(){
		//创建文档片段frag
		var frag=document.createDocumentFragment();
		//遍历shape的cells属性中每个cell
		for(var i=0;i<this.shape.cells.length;i++){
			var cell=this.shape.cells[i];
		//    每遍历一个，就new一个Image，保存在img中
			var img=new Image();
		//    设置img的src为当前cell的img属性
			img.src=cell.img;
		//    计算img的left值: 
		//		当前cell的col*CELL_SIZE+OFFSET
			img.style.left=
				cell.col*this.CELL_SIZE+this.OFFSET+"px";
		//    计算img的top值: 
		//		当前cell的row*CELL_SIZE+OFFSET
			img.style.top=
				cell.row*this.CELL_SIZE+this.OFFSET+"px";
		//    将img追加到frag中
			frag.appendChild(img);
		}//(退出循环后)将frag追加到class为playground的元素
		$(".playground").appendChild(frag);
	},
	keydown:function(){//绑定给onkeydown的事件处理函数
		var e=window.event||arguments[0];//获得event对象e
		switch(e.keyCode){
			case 37:
				//if(this.state==this.RUNNING){
					this.left(); 
				break;
			case 39:
				//if(this.state==this.RUNNING){
					this.right(); 
				break;
			case 40:
				//if(this.state==this.RUNNING){
					this.down(); 
				break;
			case 38:
				//if(this.state==this.RUNNING){
					this.rotateR();
				break;
			case 90:
				//if(this.state==this.RUNNING){	
					this.rotateL();
				break;
			case 80:this.pause();break; //P暂停
			case 67:this.myContinue();break; //C继续游戏

			case 81:this.gameOver();break; //Q主动结束
			case 83://S 结束状态下，重新开始
				//if(this.state==this.STATE_OVER){
					this.start();
				//}
		}
	},
	pause:function(){
		if(this.state==this.STATE_RUNNING){
			clearInterval(this.timer);
			this.timer=null;
			this.state=this.STATE_PAUSE;
			this.paint();
		}
	},
	myContinue:function(){ var self=this;
		if(self.state==self.STATE_PAUSE){
			self.state=self.STATE_RUNNING;
			self.timer=setInterval(function(){
				self.down();
			},self.interval);
		}
	},
	rotateR:function(){
		this.shape.rotateR();
		if(this.canNotChange()){
			this.shape.rotateL();
		}
	},
	rotateL:function(){
		this.shape.rotateL();
		if(this.canNotChange()){
			this.shape.rotateR();
		}
	},
	canNotChange:function(){
		//遍历主角图形shape中所有cell
		for(var i=0;i<this.shape.cells.length;i++){
			var cell=this.shape.cells[i];
		/*	如果cell的row<0或>=RN
				或cell的col<0或>=CN
				或wall中和cell相同位置有格*/
			if(cell.row<0||cell.row>=this.RN
			   ||cell.col<0||cell.col>=this.CN
				||this.wall[cell.row][cell.col]){
				return true;//返回true
			}
		}//(遍历结束)返回false
		return false;
	},
	left:function(){//左移一格
		this.shape.left();//先左移一个
		//判断如果越界或碰撞
		if(this.canNotChange()){
			this.shape.right();//再右移回去
		}
	},
	right:function(){
		this.shape.right();
		if(this.canNotChange()){
			this.shape.left();
		}
	}
}
window.onload=function(){
	tetris.start();
}