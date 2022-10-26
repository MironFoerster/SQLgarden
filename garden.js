const STATIC_DATA = {

}
let game_data = {
    "gamestates": [],
    "elapsed_time": 100000,
    "tiles": [],
    "current_season": 2;
}

let session_data = {
    "starttime": undefined,
    "endtime": undefined,
}

let animation_data = [
    {"starttime": none, "type": none, "x": none, "y": none, "color": none}
]

let transform_data = {"x": canvas_cont.getComputedStyle().width,
    "y": canvas_cont.getComputedStyle().height,
    "scale": 1,
};

let frame_data = {
    "width": window.getComputedStyle(canvas_cont).width,
    "height": window.getComputedStyle(canvas_cont).height,
    "corners": []
}

document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';

const setCanvasSize = () => {
    const cont_style = window.getComputedStyle(canvas_cont);
    frame_data.width = parseInt(cont_style.width);
    frame_data.height = parseInt(cont_style.height);
    for (var cvs of cvs_list) {
        cvs.width = frame_data.width;
        cvs.height = frame_data.height;
    }
}

const navTo = (id) => {
    const el = document.getElementById(id);
    shop.scroll({
        top: el.offsetTop-50, 
        left: 0, 
        behavior: 'smooth'
      });
}

const alterRadios = () => {
    const top = shop.scrollTop+150;
    if (top < document.getElementById("boosters-header").offsetTop) {
        document.getElementById("tools-radio").checked = true;
    } else if (top < document.getElementById("flowers-header").offsetTop) {
        document.getElementById("boosters-radio").checked = true;
    } else if (top < document.getElementById("buildings-header").offsetTop) {
        document.getElementById("flowers-radio").checked = true;
    } else if (top < document.getElementById("awards-header").offsetTop) {
        document.getElementById("buildings-radio").checked = true;
    } else {
        document.getElementById("awards-radio").checked = true;
    }
}

const skipToSeason = (evt) => {
    alert(evt.currentTarget.classList)
}


let elapsed_time, elapsed_years, elapsed_seasons, current_season, year_percentage, prevTimestamp;
const ms_per_year = 120000*4;  // 2 mins per season
const updateSeasonBar = (timestamp) => {
    if (!session_data.starttime) {
        session_data.starttime = timestamp;
        prevTimestamp = timestamp;
        }
    if (!marker) {
        marker = document.getElementById("season-marker");
    }

    if (timestamp-prevTimestamp > 500) {
        elapsed_time = timestamp - session_data.starttime + game_data.elapsed_time;
        console.log(elapsed_time);
        elapsed_years = Math.floor(elapsed_time / ms_per_year);
        elapsed_seasons = Math.floor(elapsed_time / (ms_per_year/4));
        current_season = elapsed_seasons % 4;

        year_percentage = (elapsed_time % ms_per_year)/ms_per_year*100;
        marker.style.left = year_percentage.toString()+"%";
        prevTimestamp = timestamp;
    }

    window.requestAnimationFrame(updateSeasonBar);
}

const updateDatabase = (table_name, data=[], drop=false) => {
    fetch('/localhost/sqlgarden/update.php', {
        method: 'POST',
        headers: {'ContentType': 'application/json'},
        body: JSON.stringify({
            'table_name': table_name,
            'data': data,
            'drop': drop
            })
        }
    )
    .then(response => response.json())
    .then(responseData => {console.log(responseData)});
}

const updateCursor = (evt) => {
    cursor_img.style.left = `${evt.pageX}px`;
    cursor_img.style.top = `${evt.pageY}px`;
    cursor_cross.style.left = `${evt.pageX}px`;
    cursor_cross.style.top = `${evt.pageY}px`;
}

const addBuildingBoosters = () => {

}

const randomDecision = () => {

}

const buildScene = () => {

    
}
const buildShop = () => {
    for (let h of ["tools", "boosters", "flowers", "buildings", "awards"]) {
        let header = document.createElement("div");
        header.innerHTML = h.toUpperCase();
        header.id = h + "-header";
        header.class = "shop-header";
        shop.appendChild(header);
        let items = (h == "awards") ? game_data["awards"] : STATIC_DATA[h];
        for (let i of items) {
            let image = document.createElement("img");
            image.src = "./images/shop/" + i["name"] + ".png";

            let title = document.createElement("div");
            title.class = "item-title";
            title.innerHTML(i["name"]);

            let desc = document.createElement("div");
            desc.class = "item-desc";
            desc.innerHTML(i["description"]);

            let price = document.createElement("div");
            price.class = "item-price";
            price.innerHTML(i["price"]);

            let item = document.createElement("div");
            item.id = i["name"] + "-" + h + "-item";
            item.class = "shop-item";
            item.appendChild(title);
            item.appendChild(desc);
            item.appendChild(price);

            shop.appendChild(item);
        }
    }
    
}
const buildShelf = () => {
   for (let i of game_data["shelf"]) {
        let image = document.createElement("img");
        image.src = "./images/items/" + i["name"] + ".png";

        let title = document.createElement("div");
        title.class = "item-title";
        title.innerHTML(i["name"]);

        let desc = document.createElement("div");
        desc.class = "item-desc";
        desc.innerHTML(i["description"]);

        let price = document.createElement("div");
        price.class = "item-count";
        price.innerHTML(i["count"]);

        let item = document.createElement("div");
        item.id = i["name"] + "-shelf-item";
        item.class = "shop-item";
        item.appendChild(title);
        item.appendChild(desc);
        item.appendChild(price);

        shop.appendChild(item);
    }
}

const buildFromDatabase = () => {
    buildScene();
    buildShop();
    buildShelf();
}

const changeSeason = (to_season) => {
    changeBackdrop(to_season);
    // update overall probabilities...and stuff
}

const drawBackdrop = () => {
    // full redraw of backdrop
    let img = document.getElementById("backdrop-season-"+parseInt(game_data.current_season));
    
    let x_num = Math.ceil((frame_data.corners[2] - frame_data.corners[0]) / 100) + 1;
    let y_num = Math.ceil((frame_data.corners[3] - frame_data.corners[1]) / 100) + 1;

    let x_offset = Math.floor(frame_data.corners[0] / 100);
    let y_offset = Math.floor(frame_data.corners[1] / 100);

    for (let i = 0; i < x_num; i++) {
        for (let j = 0; j < y_num; j++) {
          ctx.drawImage(img, (i - x_offset) * 100, (j - y_offset) * 100);
        }
      }
    
}

const drawScene = () => {
    // full redraw of game_data["tiles"]
    ctx.clearRect(
        ...frame_data.corners
    );

}

const animationLoop = () => {
    // draw all current animations
    ctx.clearRect(
        ...frame_data.corners
    );


    window.requestAnimationFrame(animationLoop);
}

const updateTransform = () => {
    for (let ctx of ctx_list) {
        ctx.resetTransform();
        ctx.translate(transform_data.x, transform_data.y);
        ctx.scale(transform_data.scale, transform_data.scale);

        frame_data.corners = [-transform_data.x/transform_data.scale,
            -transform_data.y/transform_data.scale,
            (frame_data.width - transform_data.x)/transform_data.scale,
            (frame_data.height - transform_data.y)/transform_data.scale
        ]

        drawBackdrop();
        drawScene();
        // animations redraw themselves
    }
}

// declare element objects globally
let canvas_cont, cursor_cross, cursor_img, marker, shop_pane, ui_cvs, cvs_list, ctx_list;
window.onload = () => {
    // get element objects
    canvas_cont = document.getElementById("canvas-container");
    cursor_img = document.getElementById("cursor-img");
    cursor_cross = document.getElementById("cursor-cross");
    marker = document.getElementById("season-marker");
    shop = document.getElementById("shop");
    ui_cvs = document.getElementById("ui-cvs");
    cvs_list = document.getElementsByTagName("canvas");
    ctx_list = cvs_list.map(cvs=>cvs.getContext("2d"));

    let dragStart, prevPoint;
    ui_cvs.onmousedown = (evt) => {dragStart=true; prevPoint={"x": evt.offsetX, "y": evt.offsetY}};
    ui_cvs.onmousemove = (evt) => {
        transform_data.x += evt.offsetX - prevPoint.x;
        transform_data.y += evt.offsetY - prevPoint.y;
        updateTransform();
    };
    ui_cvs.onmouseup = () => {dragStart = false;};

    ui_cvs.onwheel = (evt) => {
        factor = evt.deltaY / 40;
        transform_data.x -= (evt.offsetX - transform_data.x) * factor;
        transform_data.y -= (evt.offsetY - transform_data.y) * factor;
        transform_data.scale *= factor;
        updateTransform();
    };

    setCanvasSize();

    buildFromDatabase();

    canvas_cont.onmousemove = updateCursor;


    window.requestAnimationFrame(updateSeasonBar);
    window.requestAnimationFrame(animationLoop);
}

window.onresize = () => {
    setCanvasSize();
}

window.onbeforeunload = () => {

}






var canvas = document.getElementsByTagName('canvas')[0];
	canvas.width = 800; canvas.height = 600;
	var gkhead = new Image;
	var ball   = new Image;
	window.onload = function(){		
		var ctx = canvas.getContext('2d');
		trackTransforms(ctx);
		function redraw(){
			// Clear the entire canvas
			var p1 = ctx.transformedPoint(0,0);
			var p2 = ctx.transformedPoint(canvas.width,canvas.height);
			ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);

			// Alternatively:
			// ctx.save();
			// ctx.setTransform(1,0,0,1,0,0);
			// ctx.restore();

			ctx.drawImage(gkhead,200,50);

			ctx.beginPath();
			ctx.lineWidth = 6;
			ctx.moveTo(399,250);
			ctx.lineTo(474,256);
			ctx.stroke();

			ctx.save();
			ctx.translate(4,2);
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.moveTo(436,253);
			ctx.lineTo(437.5,233);
			ctx.stroke();

			ctx.save();
			ctx.translate(438.5,223);
			ctx.strokeStyle = '#06c';
			ctx.beginPath();
			ctx.lineWidth = 0.05;
			for (var i=0;i<60;++i){
				ctx.rotate(6*i*Math.PI/180);
				ctx.moveTo(9,0);
				ctx.lineTo(10,0);
				ctx.rotate(-6*i*Math.PI/180);
			}
			ctx.stroke();
			ctx.restore();

			ctx.beginPath();
			ctx.lineWidth = 0.2;
			ctx.arc(438.5,223,10,0,Math.PI*2);
			ctx.stroke();
			ctx.restore();
			
			ctx.drawImage(ball,379,233,40,40);
			ctx.drawImage(ball,454,239,40,40);
			ctx.drawImage(ball,310,295,20,20);
			ctx.drawImage(ball,314.5,296.5,5,5);
			ctx.drawImage(ball,319,297.2,5,5);
		}
		redraw();
		
		var lastX=canvas.width/2, lastY=canvas.height/2;
		var dragStart,dragged;
		canvas.addEventListener('mousedown',function(evt){
			document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
			lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
			lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
			dragStart = ctx.transformedPoint(lastX,lastY);
			dragged = false;
		},false);
		canvas.addEventListener('mousemove',function(evt){
			lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
			lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
			dragged = true;
			if (dragStart){
				var pt = ctx.transformedPoint(lastX,lastY);
				ctx.translate(pt.x-dragStart.x,pt.y-dragStart.y);
				redraw();
			}
		},false);
		canvas.addEventListener('mouseup',function(evt){
			dragStart = null;
			if (!dragged) zoom(evt.shiftKey ? -1 : 1 );
		},false);

		var scaleFactor = 1.1;
		var zoom = function(clicks){
			var pt = ctx.transformedPoint(lastX,lastY);
			ctx.translate(pt.x,pt.y);
			var factor = Math.pow(scaleFactor,clicks);
			ctx.scale(factor,factor);
			ctx.translate(-pt.x,-pt.y);
			redraw();
		}

		var handleScroll = function(evt){
			var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
			if (delta) zoom(delta);
			return evt.preventDefault() && false;
		};
		canvas.addEventListener('DOMMouseScroll',handleScroll,false);
		canvas.addEventListener('mousewheel',handleScroll,false);
	};
	
	// Adds ctx.getTransform() - returns an SVGMatrix
	// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
	function trackTransforms(ctx){
		var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
		var xform = svg.createSVGMatrix();
		ctx.getTransform = function(){ return xform; };
		
		var savedTransforms = [];
		var save = ctx.save;
		ctx.save = function(){
			savedTransforms.push(xform.translate(0,0));
			return save.call(ctx);
		};
		var restore = ctx.restore;
		ctx.restore = function(){
			xform = savedTransforms.pop();
			return restore.call(ctx);
		};

		var scale = ctx.scale;
		ctx.scale = function(sx,sy){
			xform = xform.scaleNonUniform(sx,sy);
			return scale.call(ctx,sx,sy);
		};
		var rotate = ctx.rotate;
		ctx.rotate = function(radians){
			xform = xform.rotate(radians*180/Math.PI);
			return rotate.call(ctx,radians);
		};
		var translate = ctx.translate;
		ctx.translate = function(dx,dy){
			xform = xform.translate(dx,dy);
			return translate.call(ctx,dx,dy);
		};
		var transform = ctx.transform;
		ctx.transform = function(a,b,c,d,e,f){
			var m2 = svg.createSVGMatrix();
			m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
			xform = xform.multiply(m2);
			return transform.call(ctx,a,b,c,d,e,f);
		};
		var setTransform = ctx.setTransform;
		ctx.setTransform = function(a,b,c,d,e,f){
			xform.a = a;
			xform.b = b;
			xform.c = c;
			xform.d = d;
			xform.e = e;
			xform.f = f;
			return setTransform.call(ctx,a,b,c,d,e,f);
		};
		var pt  = svg.createSVGPoint();
		ctx.transformedPoint = function(x,y){
			pt.x=x; pt.y=y;
			return pt.matrixTransform(xform.inverse());
		}
	}