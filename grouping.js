"use strict";

//Constants
//Numeric Constants
var MARGINS = 50;
var WINDOW_PORTION = 0.9;
var ZOOM_AMOUNT = 0.15;
var CLOSE_BTN_HEIGHT = 10;
var CLOSE_BTN_WIDTH = 10;
var DEFAULT_NODE_HEIGHT = 40;
var DEFAULT_NODE_WIDTH = 60;
var MINIMUM_SPACING = 15;
var MIN_NODE_HEIGHT = 35;
var MIN_NODE_WIDTH = 50;
var DEFAULT_FONT_HEIGHT = 12;
var MAXIMIZE_TOGGLE_HEIGHT = 20;
var MAXIMIZE_TOGGLE_WIDTH = 45;
var MAXIMIZE_TRIANGLE_HEIGHT = 8;
var MAXIMIZE_TRIANGLE_WIDTH = 12;
var MINIMUM_SPACING = 30;
var NODE_MARGIN = 4;
var DRAG_ICON_ZONE_WIDTH = 20;
var DRAG_ICON_ZONE_HEIGHT = 15;
var DRAG_ICON_WIDTH = 12;
var DRAG_ICON_HEIGHT = 10;
var HIGHLIGHT_ZONE_BORDER_WIDTH = 5;
var PARENT_LINE_WIDTH = 2;

//String Constants

var DRAG_OVER_COLOUR = "#FF0000";
var DEFAULT_FONT = '12px Arial';
var DEFAULT_NAME = 'node';
var PAN_CURSOR = 'move';
var DRAG_CURSOR = 'move';

//Functional Constants

var ZERO_FUNCT = function () {
	return 0;
};
var WIDTH_FUNCT = function () {
	return nodeWidth;
};
var HEIGHT_FUNCT = function () {
	return nodeHeight;
};

//variables

//boolean
var panning = false; //It's pandemonium
var xTight = false;
var yTight = false;
var delayRender = false;
var dragging = false;
var highlightDragZone = false;

//numeric

var panX; //It's a pandemic
var panY; //It's causing a panic
var curXOff = 0;
var curYOff = 0;
var xOff = 0;
var yOff = 0;
var zoomRatio = 1;
var zoomCenterX = 0;
var zoomCenterY = 0;
var defaultNumber = 0;
var nodeHeight = DEFAULT_NODE_HEIGHT;
var nodeWidth = DEFAULT_NODE_WIDTH;

//ADT
var ctx;
var c;
var mainNode;
var bounding;
var dragTarget = null;
var dragSource = null;
var dragNode = null;
var oldParent = null;

//DOM Interaction

window.onresize = function () {
	resizeCanvas();
	changeTransformations();
}

function resizeCanvas() {
	c.height = window.innerHeight * WINDOW_PORTION;
	c.width = window.innerWidth * WINDOW_PORTION;
	setBounding();
}

window.onscroll = function () {
	setBounding();
}

function setBounding() {
	bounding = c.getBoundingClientRect();
}

//Mouse Functions

function deferMouse(mouse) {
	if (mainNode.deferClick(cliX(mouse), cliY(mouse)) === true) {
		return;
	} else {
		panning = true;
		c.style.cursor = PAN_CURSOR;
		panX = mouse.clientX;
		panY = mouse.clientY;
	}
}

function mouseMove(mouse) {
	if (panning === true) {
		xOff = (mouse.clientX - panX) / zoomRatio;
		yOff = (mouse.clientY - panY) / zoomRatio;
		changeTransformations();
	} else if (dragging === true) {
		var mouseX = cliX(mouse);
		var mouseY = cliY(mouse);
		if (mainNode.deferDrag(mouseX, mouseY, null) === false)
			clearTarget();
		mainNode.startRenderChain();
		var oldXTight = xTight;
		var oldYTight = yTight;
		xTight = true;
		yTight = true;
		dragNode.render(0, 0, null, mouseX, mouseY);
		xTight = oldXTight;
		yTight = oldYTight;
	}
}

function mouseOut(mouse) {
	clearPan();
	if (dragging === true) {
		if (mainNode.deferDrag(cliX(mouse), cliY(mouse), true) === false) {
			oldParent.strictlyAddChild(dragNode);
		}
	}
	clearDrag();
	highlightDragZone = false;
	mainNode.startRenderChain();
}

function mouseUp(mouse) {
	if (panning === true)
		clearPan();
	if (dragging === true) {
		if (mainNode.deferDrag(cliX(mouse), cliY(mouse), true) === false) {
			oldParent.strictlyAddChild(dragNode);
		}
	}
	clearDrag();
	clearTarget();
	if (highlightDragZone) {
		highlightDragZone = false;
		mainNode.startRenderChain();
	}
}

function clearDrag() {
	if (dragging === true) {
		dragNode = null;
		dragging = false;
		c.style.cursor = 'auto';
		oldParent = null;
		mainNode.reCalculate();
	}
}

function clearPan() {
	if (panning === true) {
		c.style.cursor = "auto";
		panning = false;
		curXOff += xOff;
		xOff = 0;
		curYOff += yOff;
		yOff = 0;
	}
}

function mouseWheelFF(mouse) {
	zoomCenterX = cliX(mouse);
	zoomCenterY = cliY(mouse);
	zoom(mouse.detail);
}

function mouseWheel(mouse) {
	var temp = {};
	temp.detail = -mouse.wheelDelta;
	mouseWheelFF(temp);
}

//DnD

function clearTarget() {
	dragTarget = null;
	mainNode.startRenderChain();
}

function dragOver(e) {
	if (e.preventDefault) {
		e.preventDefault();
	}
	if (mainNode.deferDrag(cliX(e), cliY(e), null) === false) {
		if (dragTarget != null)
			clearTarget();
	}
}

function dragStart(e) {
	highlightDragZone = true;
	mainNode.startRenderChain();
	dragStart = e.target;
	dragStart.style.opacity = 0.4;
	e.dataTransfer.effectAllowed = 'copy';
	e.dataTransfer.setData('text/plain', dragStart.innerHTML);
}

function dragEnd(e) {
	if (dragStart.style.opacity != 0.6)
		dragStart.style.opacity = 1;
	clearTarget();
	dragStart = null;
	highlightDragZone = false;
	mainNode.startRenderChain();
}

function drop(e) {
	delayRender = true;
	if (mainNode.deferDrag(cliX(e), cliY(e), dragStart.innerHTML)) {
		if (dragStart != null) {
			var elemParent = dragStart.parentNode;
			var contentParent = elemParent.parentNode;
			var uses = ++elemParent.children[1].innerHTML;
			var i;
			if (uses > 0) {
				elemParent.style.opacity = 0.6;
			}
			contentParent.removeChild(elemParent);
			for (i = 0; i < contentParent.childNodes.length; i++) {
				if (contentParent.childNodes[i].className === 'contentParent' && contentParent.childNodes[i].childNodes[1].innerHTML > uses) {
					break;
				}
			}
			contentParent.insertBefore(elemParent, contentParent.childNodes[i]);
		}
	}
	delayRender = false;
}

//Drag Zone

function dragZone(parent, xMinOff, yMinOff, xMaxOff, yMaxOff, callback) {
	this.xMinOff = xMinOff;
	this.yMinOff = yMinOff;
	this.xMaxOff = xMaxOff;
	this.yMaxOff = yMaxOff;
	this.callback = callback;
	this.parent = parent;

	this.check = function (x, y, caller) {
		var xOff = x - this.parent.x;
		var yOff = y - this.parent.y;
		if (xOff > xMinOff() && xOff < xMaxOff() && yOff > yMinOff() && yOff < yMaxOff()) {
			this.callback(caller);
			return true;
		}
		return false;
	}

	this.render = function () {
		var minX = xMinOff();
		var minY = yMinOff();
		ctx.strokeStyle = "#FFFF00";
		ctx.lineWidth = HIGHLIGHT_ZONE_BORDER_WIDTH;
		ctx.strokeRect(minX + this.parent.x, minY + this.parent.y, xMaxOff() - minX, yMaxOff() - minY);
	}
}

//Contents

function populateContents(list) {
	var contents = document.getElementsByName("contents")[0];
	var i;
	for (i = 0; i < list.length; i++) {
		var parentDiv = document.createElement("div");
		var div = document.createElement("div");
		var sideDiv = document.createElement("div");
		div.innerHTML = list[i];
		div.draggable = true;
		div.className = "contentItem";
		div.addEventListener("dragstart", dragStart, false);
		div.addEventListener("dragend", dragEnd, false);
		sideDiv.className = "contentSideItem";
		sideDiv.innerHTML = mainNode.countOccurences(list[i]);
		parentDiv.className = "contentParent";
		parentDiv.appendChild(div);
		parentDiv.appendChild(sideDiv);
		contents.appendChild(parentDiv);
	}
	sortContents();
}

function sortContents() {
	var contents = document.getElementsByName("contents")[0];
	var items = document.getElementsByClassName("contentParent");
	var buff = [];
	var i;
	var j;
	var k;
	for (i = 0; i < items.length; i++) {
		buff.push(items[i]);
	}
	for (k = 0; k < buff.length; k++) {
		contents.removeChild(buff[k]);
	}
	buff.sort(sorting);
	for (j = 0; j < buff.length; j++) {
		contents.appendChild(buff[j]);
	}
}

function sorting(a, b) {
	return (a.childNodes[1].innerHTML - b.childNodes[1].innerHTML);
}

//Transformations

function zoom(amount) {
	if (amount > 0) {
		//out
		if (zoomRatio > ZOOM_AMOUNT * 2)
			zoomRatio -= ZOOM_AMOUNT;
	} else {
		//in
		zoomRatio += ZOOM_AMOUNT;
	}
	changeTransformations();
}

function changeTransformations() {
	clearTransformations();
	setTransformations();
	mainNode.startRenderChain();
}

function clearTransformations() {
	c.width = c.width;
}

function setTransformations() {
	setZoom();
	setTranslate();
}

function setZoom() {
	ctx.translate(zoomCenterX, zoomCenterY);
	ctx.scale(zoomRatio, zoomRatio);
	ctx.translate(-zoomCenterX, -zoomCenterY);
}

function setTranslate() {
	ctx.translate(xOff + curXOff, yOff + curYOff);
}

function resetTransformations() {
	center();
	resetZoom();
	changeTransformations();
}

function center() {
	curXOff = 0;
	xOff = 0;
	curYOff = 0;
	yOff = 0;
}

function resetZoom() {
	zoomRatio = 1;
}

//User Interaction

function centerOnNode(name) {
	var node = findNode(name);
	if (node === false) {
		window.alert(name + ' not found in current tree');
		return false;
	}
	center();
	c.clear();
	curXOff =  - node.x + (c.availWidth() / zoomRatio / 2);
	curYOff =  - node.y + (c.availHeight() / zoomRatio / 2);
	changeTransformations();
}

function findNode(name) {
	return mainNode.findNode(name);
}

//Object Orientation

function object(O) {
	function F() {}
	F.prototype = new O();
	return new F();
}

//Parsing

function inflate(parentChildList) {
	delayRender = true;
	searchAdd(parentChildList, mainNode);
	delayRender = false;
	mainNode.reCalculate();
}

function searchAdd(list, parent) {
	var i;
	var j;
	for (i = 0; i < list.length; i++) {
		if (list[i].parent === parent.id) {
			var temp;
			switch (list[i].childType) {
			case 0:
				temp = makeNode();
				temp.name = list[i].childName;
				temp.id = list[i].child;
				parent.addChild(temp);
				break;
			case 3:
				parent.addContent(list[i].child);
				break;
			}

		}
	}
	for (j = 0; j < parent.children.length; j++) {
		searchAdd(list, parent.children[j]);
	}
}

function flatten() {
	return mainNode.parentChildList();
}

//Node and Related

function makeNode() {
	var temp = object(node);
	//Constant Functions
	temp.CLOSE_BTN_X = function () {
		return 0.75 * temp.renderWidth;
	};
	temp.CLOSE_BTN_Y = function () {
		return 0.1 * temp.renderHeight;
	};
	temp.ADOPT_BTN_X = function () {
		return 0.1 * temp.renderWidth;
	};
	temp.ADOPT_BTN_Y = function () {
		return 0.1 * temp.renderHeight;
	};
	temp.RENDER_WIDTH_FUNCT = function () {
		return temp.renderWidth;
	}
	temp.RENDER_HEIGHT_FUNCT = function () {
		return temp.renderHeight;
	}
	//Variables
	temp.type = 0;
	temp.maximized = true;
	temp.bgColour = "#000000";

	//Mouse

	temp.onClick = function () {
		var input = window.prompt("Enter a new name for " + temp.name, temp.name);
		if (input != null && input.length > 0)
			temp.rename(input);
	}
	temp.onClickClose = function () {
		temp.deleteSelf(false);
	}
	temp.onClickAdopt = function () {
		temp.deleteSelf(true);
	}

	//Rendering

	temp.getRenderWidth = function () {
		var largest = nodeWidth;
		var cur = ctx.measureText(this.name).width + NODE_MARGIN * 2;
		var i;
		if (cur > largest) {
			largest = cur;
		}
		for (i = 0; i < this.contents.length; i++) {
			cur = ctx.measureText(this.contents[i]).width + NODE_MARGIN * 2;
			if (cur > largest) {
				largest = cur;
			}
		}
		return largest
	}

	temp.getRenderHeight = function () {
		if (this.maximized)
			return nodeHeight + MAXIMIZE_TOGGLE_HEIGHT + this.contents.length * DEFAULT_FONT_HEIGHT;
		else
			return nodeHeight + MAXIMIZE_TOGGLE_HEIGHT;
	}
	temp.renderSelf = function (depth, width) {
		ctx.fillStyle = temp.bgColour;
		this.renderHeight = this.getRenderHeight();
		this.renderWidth = this.getRenderWidth();
		ctx.fillRect(this.x, this.y, this.renderWidth, this.renderHeight);
		ctx.fillStyle = "#FFFFFF";
		var txtMetric = ctx.measureText(this.name);
		var startPos = this.y + DEFAULT_FONT_HEIGHT + temp.CLOSE_BTN_Y() + CLOSE_BTN_HEIGHT;
		ctx.fillText(this.name, this.x + (this.renderWidth - txtMetric.width) / 2, startPos);
		this.renderCloseButton();
		if (this.maximized)
			this.renderContents(startPos);
		this.renderSizeToggle();
		this.renderDragIcon();
		if (highlightDragZone && dragNode != this) {
			this.dragZone.render();
		}
	}

	temp.renderSizeToggle = function () {
		if (temp.maximized === false) {
			ctx.fillStyle = "#FF0000";
			drawTriangle(this.x + this.renderWidth / 2, this.y + this.renderHeight - MAXIMIZE_TOGGLE_HEIGHT / 2, MAXIMIZE_TRIANGLE_WIDTH, -MAXIMIZE_TRIANGLE_HEIGHT);
		} else {
			ctx.fillStyle = "#FFFF00";
			drawTriangle(this.x + this.renderWidth / 2, this.y + this.renderHeight - MAXIMIZE_TOGGLE_HEIGHT / 2, MAXIMIZE_TRIANGLE_WIDTH, MAXIMIZE_TRIANGLE_HEIGHT);
		}

	}

	temp.renderContents = function (startPos) {
		var curPos = startPos;
		var i;
		ctx.fillStyle = "#FFFF00";
		for (i = 0; i < this.contents.length; i++) {
			curPos += DEFAULT_FONT_HEIGHT;
			ctx.fillText(this.contents[i], this.x + (nodeWidth - ctx.measureText(this.contents[i]).width) / 2, curPos);
		}
	}

	temp.renderCloseButton = function () {
		ctx.fillStyle = "#FFF000";
		ctx.fillRect(this.x + temp.CLOSE_BTN_X(), this.y + temp.CLOSE_BTN_Y(), CLOSE_BTN_WIDTH, CLOSE_BTN_HEIGHT);
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(this.x + temp.ADOPT_BTN_X(), this.y + temp.ADOPT_BTN_Y(), CLOSE_BTN_WIDTH, CLOSE_BTN_HEIGHT);
	}
	temp.renderDragIcon = function () {
		ctx.fillStyle = "#FFFFF0";
		ctx.fillRect(this.x + (temp.RENDER_WIDTH_FUNCT() - DRAG_ICON_WIDTH) / 2, this.y + NODE_MARGIN, DRAG_ICON_WIDTH, DRAG_ICON_HEIGHT);
	}

	//DnD

	temp.onDrag = function (data) {
		if (data === null) {
			dragTarget = this.parent;
			mainNode.startRenderChain();
		} else if (data === true) {
			var target = this.parent;
			target.strictlyAddChild(dragNode);
			mainNode.reCalculate();
		} else {
			var target = this.parent;
			target.addContent(data);
			mainNode.reCalculate();
		}
	}

	temp.drag = function () {
		highlightDragZone = true;
		c.style.cursor = DRAG_CURSOR;
		dragging = true;
		dragNode = temp;
		oldParent = temp.parent;
		temp.deleteSelf();
		dragNode.depth = 0;
		dragNode.setChildDepth();
		dragNode.pos = 0;
		dragNode.realign();
	}

	//Contents

	temp.addContent = function (content) {
		var i;
		for (i = 0; i < this.contents.length; i++) {
			if (this.contents[i] === content) {
				alert('The item ' + content + ' already exists in that node');
				return false;
			}
		}
		this.contents.push(content);
	}

	//Miscellaneous

	temp.toggleSize = function () {
		temp.maximized = !temp.maximized;
		mainNode.reCalculate();
	}

	temp.rename = function (name) {
		temp.name = name;
		mainNode.reCalculate();
	}

	temp.dragZone = new dragZone(temp, ZERO_FUNCT, ZERO_FUNCT, temp.RENDER_WIDTH_FUNCT, function () {
			return temp.renderHeight
		}, temp.onDrag);
	temp.addClickItem(new clickItem(temp, temp.CLOSE_BTN_X, ZERO_FUNCT, temp.RENDER_WIDTH_FUNCT, function () {
			return temp.CLOSE_BTN_Y() + CLOSE_BTN_HEIGHT;
		}, temp.onClickClose));
	temp.addClickItem(new clickItem(temp, ZERO_FUNCT, ZERO_FUNCT, function () {
			return temp.ADOPT_BTN_X() + CLOSE_BTN_WIDTH;
		}, function () {
			return temp.ADOPT_BTN_Y() + CLOSE_BTN_HEIGHT;
		}, temp.onClickAdopt));
	temp.addClickItem(new clickItem(temp, function () {
			return (temp.RENDER_WIDTH_FUNCT() - DRAG_ICON_ZONE_WIDTH) / 2;
		}, ZERO_FUNCT, function () {
			return temp.RENDER_WIDTH_FUNCT() - (temp.RENDER_WIDTH_FUNCT() - DRAG_ICON_ZONE_WIDTH) / 2;
		}, function () {
			return DRAG_ICON_ZONE_HEIGHT;
		}, temp.drag));
	temp.addClickItem(new clickItem(temp, function () {
			return (temp.renderWidth - MAXIMIZE_TOGGLE_WIDTH) / 2;
		}, function () {
			return temp.renderHeight - MAXIMIZE_TOGGLE_HEIGHT;
		}, function () {
			return temp.renderWidth - (temp.renderWidth - MAXIMIZE_TOGGLE_WIDTH) / 2;
		}, function () {
			return temp.renderHeight;
		}, temp.toggleSize));
	temp.addClickItem(new clickItem(temp, ZERO_FUNCT, ZERO_FUNCT, temp.RENDER_WIDTH_FUNCT, function () {
			return temp.renderHeight
		}, temp.onClick));
	temp.addChild(makeAddNode());
	return temp;
}

function makeAddNode() {
	var temp = object(node);
	temp.type = 1;
	temp.bgColour = "#FF0000";
	temp.onClick = function () {
		temp.parent.addDefault();
	}
	temp.renderSelf = function (depth, width) {
		ctx.fillStyle = this.bgColour;
		ctx.fillRect(this.x, this.y, nodeWidth, nodeHeight);
		ctx.fillStyle = "#006B54";
		ctx.font = 'Bold 30px Sans-Serif';
		ctx.fillText("+", this.x + (nodeWidth - ctx.measureText("+").width) / 2, this.y + 10 + nodeHeight / 2);
		ctx.font = DEFAULT_FONT;
	}
	temp.addClickItem(new clickItem(temp, ZERO_FUNCT, ZERO_FUNCT, WIDTH_FUNCT, HEIGHT_FUNCT, temp.onClick));
	return temp;
}

function makePrimaryNode() {
	var temp = object(node);
	temp.type = 2;
	temp.bgColour = "#000000";
	temp.renderSelf = function (depth, width) {
		ctx.fillStyle = temp.bgColour;
		ctx.fillRect(this.x, this.y, nodeWidth, nodeHeight);
		ctx.fillStyle = "#FFFFFF";
		var txtMetric = ctx.measureText(this.name);
		ctx.fillText(this.name, this.x + (nodeWidth - txtMetric.width) / 2, this.y + (nodeHeight) / 2);
	}
	temp.addChild(makeAddNode());
	return temp;
}

function node() {
	//Variables
	this.parent = null;
	this.children = [];
	this.contents = [];
	this.clickItems = [];
	this.bgColour;
	this.depth = 1;
	this.childPos = 1;
	this.pos = 1;
	this.x;
	this.y;
	this.renderHeight;
	this.renderWidth;
	this.name = DEFAULT_NAME + defaultNumber;
	this.id = defaultNumber;
	defaultNumber++;
	
	//Status
	
	this.terminal = function(){
		return this.children.length < 1;
	}
	
	this.holding = function(){
		return this.contents.length > 0;
	}

	//Mouse
	this.deferClick = function (x, y) {
		if (this.checkClick(x, y) === true) {
			return true;
		} else {
			var i;
			for (i = 0; i < this.children.length; i++) {
				if (this.children[i].deferClick(x, y) === true) {
					return true;
				}
			}
		}
		return false;
	}

	this.checkClick = function (x, y) {
		var i;
		for (i = 0; i < this.clickItems.length; i++) {
			if (this.clickItems[i].check(x, y) === true) {
				return true;
			}
		}
		return false;
	}

	this.addClickItem = function (clickItem) {
		this.clickItems.push(clickItem);
	}

	this.dropClickItem = function (clickItem) {
		var i;
		for (i = 0; i < this.clickItems.length; i++) {
			if (this.clickItems[i] === clickItem) {
				this.clickItems.splice(i, 1);
				return true;
			}
		}
		return false;
	}

	//Dnd

	this.deferDrag = function (x, y, data) {
		if (this.checkDrag(x, y, data) === true) {
			return true;
		} else {
			var i;
			for (i = 0; i < this.children.length; i++) {
				if (this.children[i].deferDrag(x, y, data) === true)
					return true;
			}
		}
		return false;
	}

	this.checkDrag = function (x, y, data) {
		if (this.type === 0) {
			return this.dragZone.check(x, y, data);
		}
		return false;
	}

	//Flattening

	this.parentChildList = function () {
		var ret = [];
		var i;
		for (i = 0; i < this.children.length; i++) {
			if (this.children[i].type === 0) {
				var temp = {};
				var j;
				temp.parent = this.id;
				temp.child = this.children[i].id;
				temp.childName = this.children[i].name;
				temp.childType = this.children[i].type;
				ret.push(temp);
				for (j = 0; j < this.children[i].contents.length; j++) {
					var tempContent = {};
					tempContent.parent = this.children[i].id;
					tempContent.child = this.children[i].contents[j];
					tempContent.childType = 3;
					ret.push(tempContent);
				}
				ret = ret.concat(this.children[i].parentChildList());
			}
		}
		return ret;
	}

	//Parental Duties

	this.addChild = function (child) {
		this.strictlyAddChild(child);
		if (mainNode)
			mainNode.reCalculate();
	}

	this.addDefault = function () {
		this.addChild(makeNode());
	}

	this.strictlyAddChild = function (child) {
		child.parent = this;
		child.setDepth();
		child.pos = this.childPos;
		child.primary = false;
		this.children.push(child);
		this.childPos += child.getWidth();
	}

	this.deleteSelf = function (adoption) {
		this.parent.deleteChild(this, adoption);
	}

	this.deleteChild = function (child, adoption) {
		var i;
		for (i = 0; i < this.children.length; i++) {
			if (this.children[i] === child) {
				if (adoption) {
					var j;
					for (j = 0; j < this.children[i].children.length; j++) {
						if (this.children[i].children[j].type === 0) {
							this.strictlyAddChild(this.children[i].children[j]);
						}
					}
				}
				this.children.splice(i, 1);
				mainNode.reCalculate();
				break;
			}
		}
	}

	//Formatting

	this.reCalculate = function () {
		this.realign();
		this.startRenderChain();
	}

	this.realign = function () {
		var i;
		this.childPos = this.pos;
		for (i = 0; i < this.children.length; i++) {
			this.children[i].pos = this.childPos;
			this.childPos += this.children[i].getWidth();
			this.children[i].realign();
		}
	}

	this.setDepth = function () {
		this.depth = this.parent.depth + 1;
		this.setChildDepth();
	}

	this.setChildDepth = function () {
		var i;
		for (i = 0; i < this.children.length; i++) {
			this.children[i].setDepth();
		}
	}

	this.getWidth = function () {
		if (this.terminal() && !this.holding())
			return 1;
		var out = 0;
		var i;
		for (i = 0; i < this.children.length; i++)
			out += this.children[i].getWidth();
		if (this.holding() && this.maximized) {
			var temp = (this.contents.length * DEFAULT_FONT_HEIGHT) / nodeHeight + 1;
			if (temp > out) {
				return temp;
			}
		}
		return out;

	}

	this.getMaxDepth = function () {
		if (this.terminal())
			return this.depth;
		var maxDepth = 0;
		var i;
		for (i = 0; i < this.children.length; i++) {
			var temp = this.children[i].getMaxDepth();
			if (temp > maxDepth) {
				maxDepth = temp;
			}
		}
		return maxDepth;
	}

	//Rendering

	this.startRenderChain = function () {
		if (delayRender === true)
			return;
		c.clear();
		var maxDepth = this.getMaxDepth();
		var width = this.getWidth();
		var tempWidth = (c.availWidth() - maxDepth * MINIMUM_SPACING) / maxDepth;
		var tempHeight = (c.availHeight() - width * MINIMUM_SPACING) / width;
		var curxTight = false;
		var curyTight = false;

		if (dragTarget !== null) {
			var oldColour = dragTarget.bgColour;
			dragTarget.bgColour = DRAG_OVER_COLOUR;
		}
		if (tempWidth < DEFAULT_NODE_WIDTH) {
			if (tempWidth > MIN_NODE_WIDTH) {
				nodeWidth = tempWidth;
			} else {
				nodeWidth = MIN_NODE_WIDTH;
				curxTight = true;
			}
		} else {
			nodeWidth = DEFAULT_NODE_WIDTH;
		}
		if (tempHeight < DEFAULT_NODE_HEIGHT) {
			if (tempHeight > MIN_NODE_HEIGHT) {
				nodeHeight = tempHeight;
			} else {
				nodeHeight = MIN_NODE_HEIGHT;
				curyTight = true;
			}
		} else {
			nodeHeight = DEFAULT_NODE_HEIGHT;
		}
		yTight = curyTight;
		xTight = curxTight;
		this.render(maxDepth, width, null, 0, 0);
		if (oldColour)
			dragTarget.bgColour = oldColour;
	}

	this.render = function (depth, width, parent, xOff, yOff) {
		if (xTight) {
			this.x = this.depth * (nodeWidth + MINIMUM_SPACING) + xOff; //The tight approach
		} else {
			this.x = this.depth / depth * c.availWidth() + xOff;
		}

		if (yTight) {
			this.y = this.pos * (nodeHeight + MINIMUM_SPACING) + yOff; //The tight approach
		} else {
			this.y = this.pos / width * c.availHeight() + yOff;
		}

		this.renderChildren(depth, width, xOff, yOff);
		if (parent !== null) {
			this.renderParentLine(parent);
		}
		this.renderSelf(depth, width);
	}

	this.renderParentLine = function (parent) {
		ctx.strokeStyle = "#000000";
		ctx.beginPath();
		ctx.moveTo(parent.x, parent.y);
		ctx.lineTo(this.x, this.y);
		ctx.lineWidth = PARENT_LINE_WIDTH;
		ctx.closePath();
		ctx.stroke();
	}

	this.renderChildren = function (depth, width, xOff, yOff) {
		var i;
		for (i = 0; i < this.children.length; i++) {
			this.children[i].render(depth, width, this, xOff, yOff);
		}
	}

	//Searching

	this.findNode = function (name) {
		if (this.name === name) {
			return this;
		} else {
			var i;
			for (i = 0; i < this.children.length; i++) {
				var temp = this.children[i].findNode(name);
				if (temp !== false) {
					return temp;
				}
			}
		}
		return false;
	}

	//Aggregation

	this.countOccurences = function (value) {
		var count = 0;
		var i;
		var j;
		for (i = 0; i < this.contents.length; i++) {
			if (this.contents[i] == value)
				count++;
		}
		for (j = 0; j < this.children.length; j++) {
			if (this.children[j].type == 0) {
				count += this.children[j].countOccurences(value);
			}
		}
		return count;
	}

	this.aggregateContentList = function () {
		var out = [];
		var i;
		if (this.holding())
			out = out.concat(this.contents);
		for (i = 0; i < this.children.length; i++) {
			out = out.concat(this.children[i].aggregateContentList());
		}
		return out
	}
}

//Click Item

function clickItem(parent, xMinOff, yMinOff, xMaxOff, yMaxOff, callback) {
	this.xMinOff = xMinOff;
	this.yMinOff = yMinOff;
	this.xMaxOff = xMaxOff;
	this.yMaxOff = yMaxOff;
	this.callback = callback;
	this.parent = parent;

	this.check = function (x, y) {
		var xOff = x - this.parent.x;
		var yOff = y - this.parent.y;
		if (xOff > xMinOff() && xOff < xMaxOff() && yOff > yMinOff() && yOff < yMaxOff()) {
			this.callback();
			return true;
		}
		return false;
	}
}

//Main

function main(canvas) {
	c = canvas;
	resizeCanvas();
	c.addEventListener("mousedown", deferMouse, false);
	c.addEventListener("mousewheel", mouseWheel, false);
	c.addEventListener("DOMMouseScroll", mouseWheelFF, false);
	c.addEventListener("mouseup", mouseUp, false);
	c.addEventListener("mousemove", mouseMove, false);
	c.addEventListener("mouseout", mouseOut, false);
	c.addEventListener("dragover", dragOver, false);
	c.addEventListener("drop", drop, false);
	ctx = c.getContext('2d');
	ctx.font = DEFAULT_FONT;
	c.availWidth = function () {
		return c.width - MARGINS * 2;
	}
	c.availHeight = function () {
		return c.height - MARGINS * 2;
	}
	c.clear = function () {
		ctx.clearRect(-curXOff, -curYOff, (c.width) / zoomRatio, (c.height) / zoomRatio);
	}
	buildTree();
	populateContents(getContents());
	mainNode.startRenderChain();
}

function buildTree() {
	mainNode = makePrimaryNode();
}

function getContents() {
	var mockContents = [];
	mockContents.push(7000000);
	mockContents.push(7000001);
	mockContents.push(7000002);
	mockContents.push(7000003);
	mockContents.push(7000004);
	mockContents.push(7000005);
	mockContents.push(7000006);
	mockContents.push(7000007);
	mockContents.push(7000008);
	mockContents.push(7000009);
	mockContents.push(7000010);
	mockContents.push(7000011);
	mockContents.push(7000012);
	mockContents.push(7000013);
	mockContents.push(7000014);
	mockContents.push(7000015);
	mockContents.push(7000016);
	mockContents.push(7000017);
	mockContents.push(7000018);
	mockContents.push(7000019);
	mockContents.push(7000020);
	mockContents.push(7000021);
	mockContents.push(7000022);
	mockContents.push(7000023);
	return mockContents;
}

// Utilities

function drawTriangle(x, y, width, height) {
	ctx.beginPath();
	ctx.moveTo(x - width / 2, y + height / 2);
	ctx.lineTo(x + width / 2, y + height / 2);
	ctx.lineTo(x, y - height / 2);
	ctx.lineTo(x - width / 2, y + height / 2);
	ctx.closePath();
	ctx.fill();
}

function cliX(e) {
	return (e.clientX - bounding.left) / zoomRatio - curXOff;
}

function cliY(e) {
	return (e.clientY - bounding.top) / zoomRatio - curYOff;
}
