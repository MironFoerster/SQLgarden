class Tile {
    constructor(x, y, flowername) {
        this.x = x;
        this.y = y;
        this.flowername = flowername;

    }
}

class View {
    constructor(parent) {
        this.ctrl = parent;
        this.gatherImages();
        this.getCanvasCtxList()
        this.updateCvsSize();
        this.updateTiles();
        this.updateMapDims();        
    }

    backdrop_render_cvs = document.createElement("canvas");
    backdrop_render_ctx = this.backdrop_render_cvs.getContext("2d");

    flower_render_cvs = document.createElement("canvas");
    flower_render_ctx = this.flower_render_cvs.getContext("2d");

    hover_hl_render_cvs = document.createElement("canvas");
    hover_hl_render_ctx = this.hover_hl_render_cvs.getContext("2d");

    active_hl_render_cvs = document.createElement("canvas");
    active_hl_render_ctx = this.active_hl_render_cvs.getContext("2d");

    animate_cvs = document.getElementById("animate-cvs");
    animate_ctx = this.animate_cvs.getContext("2d");

    canvas_cont = document.getElementById("canvas-container");
    cvs_res = 4; //canvas pixel per style pixel
    map_frame = [];
    tile_frame = undefined;
    cvs_width = 0;
    cvs_height = 0;
    tile_rows = 0;
    trans_x = 0;
    trans_y = 0;
    trans_scale = 1 * this.cvs_res;
    map_trans_x = 0;
    map_trans_y = 0;
    map_trans_scale = 1 * this.cvs_res;
    items_highlight_tiles = {};
    images = [];
    running_animations = [];  //{starttime: undefined, type: undefined, x: undefined, y: undefined, color: undefined}
    cvs_list = [];
    ctx_list = [];
    season = 0;
    seasons = ["winter", "spring", "summer", "autumn"];
    margin_rows = 5;
    drag_from = undefined;
    
    // https://www.redblobgames.com/grids/hexagons/
    tile_size = 30;  // outer radius
    tile_height = Math.sqrt(3) * this.tile_size;
    tile_width = 2 * this.tile_size;
    row_spc = this.tile_height/2;
    col_spc = 3/2 * this.tile_size;
    

    gatherImages() {  // todo execute initial draw, solve unexistent highlight-white
        for (let image of document.getElementsByClassName("img")) {
            this.images[image.id] = image;
        }
        /*
        for (let flower of this.ctrl.data.stat.flowers) {
            this.images[flower.name] = new Image();
            this.images[flower.name].src = "images/items/"+flower.name+".png";
            //TODO make canvas resolution user adjustable
        }
        for (let type of ["bushes", "earth"]) {
            for (let season of this.seasons) {
                this.images[type+"-"+season] = new Image();
                this.images[type+"-"+season].src = "images/tiles/"+type+"-"+season+".png";
            }
        }
        this.images["card"] = new Image();
        this.images["card"].src = "images/items/card.png";
        this.images["highlight-white"] = new Image();
        this.images["highlight-white"].src = "images/tiles/highlight-white.png";
        */
    }

    getCanvasCtxList() {
        this.cvs_list = document.getElementsByClassName("prerendered-cvs");
        for (let cvs of this.cvs_list) {
            let ctx = cvs.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            this.ctx_list.push(ctx);
        }
    }

    updateCvsSize() {  // always followed by this.updateMapDims();
        const cont_style = window.getComputedStyle(this.canvas_cont);
        this.cvs_width = parseInt(parseFloat(cont_style.width) * this.cvs_res);
        this.cvs_height = parseInt(parseFloat(cont_style.height) * this.cvs_res);
        for (var cvs of this.cvs_list) {
            cvs.width = this.cvs_width;
            cvs.height = this.cvs_height;
        }
        this.applyTransform();
    }
    updateTiles() {  // always followed by this.updateMapDims();
        this.tile_frame = [Infinity, Infinity, -Infinity, -Infinity]; //todo: for that, every map needs to have at least one tile (center magic stone or sth)
        for (let tile of this.ctrl.data.game.tiles) {
            // axial coords to double-height coords
            let col = tile.q;
            let row = 2 * tile.r +tile.q;

            if (col < this.tile_frame[0]) {this.tile_frame[0] = col;}
            if (row < this.tile_frame[1]) {this.tile_frame[1] = row;}
            if (col > this.tile_frame[2]) {this.tile_frame[2] = col;}
            if (row > this.tile_frame[3]) {this.tile_frame[3] = row;}
        }
    }
    
    updateMapDims() {
        // add margins
        this.map_frame = this.tile_frame.map((x, i)=>{return (i<2)? x - this.margin_rows : x + this.margin_rows});
        // each line of hex-centerpoints is a row/column
        let margined_rows = this.map_frame[3] - this.map_frame[1] + 1;
        let margined_cols = this.map_frame[2] - this.map_frame[0] + 1;

        let tile_frame_ratio = (((margined_rows-1)*Math.sqrt(3))/2)/((margined_cols-1)*3/2);
        let cvs_ratio = this.cvs_height/this.cvs_width;
        // has to have the perfect cvs_ratio
        if (tile_frame_ratio >= cvs_ratio) {
            // height is fixed
            this.map_height = (margined_rows-1) * this.row_spc * this.cvs_res;
            // directly compute width
            this.map_width = this.map_height / cvs_ratio;
            // get needed n of rows, +1 important
            let target_cols = Math.ceil(this.map_width / (this.col_spc*this.cvs_res))+1;
            // compute equal padding for both sides
            let padding_cols = Math.ceil((target_cols - margined_cols)/2);
            // update map_frame
            this.map_frame[0] -= padding_cols;
            this.map_frame[2] += padding_cols;
        } else {
            // width is fixed
            this.map_width = (margined_cols-1) * this.col_spc * this.cvs_res;
            // directly compute height
            this.map_height = this.map_width * cvs_ratio;
            // get needed n of rows, +1 important
            let target_rows = Math.ceil(this.map_height / (this.row_spc*this.cvs_res))+1;
            // compute equal padding for both sides
            let padding_rows = Math.ceil((target_rows - margined_rows)/2);
            // update map_frame
            this.map_frame[1] -= padding_rows;
            this.map_frame[3] += padding_rows;
        }
        
        for (let cvs of [this.backdrop_render_cvs, this.flower_render_cvs, this.active_hl_render_cvs, this.hover_hl_render_cvs]) {
            cvs.height = this.map_height;
            cvs.width = this.map_width;
        }
        this.applyMapTransform();
        this.renderBackdrop();
        this.renderFlower();
        this.renderHighlight(this.ctrl.action, this.active_hl_render_ctx);
        this.renderHighlight(this.ctrl.icon_hover_action, this.hover_hl_render_ctx);
        this.fullDraw();
    }

    applyMapTransform() {
        for (let ctx of [this.backdrop_render_ctx, this.flower_render_ctx, this.hover_hl_render_ctx, this.active_hl_render_ctx]) {
            ctx.resetTransform();
            // translate ctx when tiles are asymmetrical so that they can be drawn with their original qr
            // move origin to center of canvas, move so that tile_frame fits and apply resolution
            ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
            this.map_trans_x = -(this.tile_frame[0]+this.tile_frame[2])/2 * this.col_spc * this.cvs_res;
            this.map_trans_y = -(this.tile_frame[1]+this.tile_frame[3])/2 * this.row_spc * this.cvs_res;
            ctx.translate(this.map_trans_x, this.map_trans_y);
            ctx.scale(this.cvs_res, this.cvs_res);
        }
    }
    clearRenderCtx(ctx) {
        //ctx.clearRect(-ctx.canvas.width/2 - this.map_trans_x*this.cvs_res, -ctx.canvas.height/2 - this.map_trans_y*this.cvs_res, ctx.canvas.width, ctx.canvas.height);
        ctx.clearRect(-ctx.canvas.width/2 - this.map_trans_x, -ctx.canvas.height/2 - this.map_trans_y, ctx.canvas.width, ctx.canvas.height);
    }
    clearDisplayCtx(ctx) {
        ctx.clearRect(-ctx.canvas.width/2/this.trans_scale - this.trans_x/this.trans_scale, -ctx.canvas.height/2/this.trans_scale - this.trans_y/this.trans_scale, ctx.canvas.width/this.trans_scale, ctx.canvas.height/this.trans_scale);
    }
    
    drawRenderedLayer(ctx, map_image) {
        this.clearDisplayCtx(ctx);
        ctx.drawImage(map_image, -map_image.width/2, -map_image.height/2, map_image.width, map_image.height);
    }
    
    renderBackdrop() {
        let bush_tiles = [];
        
        for (let col=this.map_frame[0]; col<=this.map_frame[2]; col++) {
            for (let row=this.map_frame[1]; row<=this.map_frame[3]; row++) {
                if (!Boolean((col-row)%2)) { // even-even || odd-oddf
                    // double-height coordinates to axial coordinates
                    let q = col;
                    let r = (row - col) / 2;
                    //bush_tiles.push({image_name: "bushes-"+this.seasons[this.season], q: q, r: r});
                    bush_tiles.push({image_name: "bushes-summer", q: q, r: r});
                }
            }
        }
    
        this.drawTiles(this.backdrop_render_ctx, bush_tiles);

        let earth_tiles = [];
        for (let tile of this.ctrl.data.game.tiles) {
            //earth_tiles.push({image_name: "earth-"+this.seasons[this.season], q: tile.q, r: tile.r});
            earth_tiles.push({image_name: "earth-summer", q: tile.q, r: tile.r});
        }
        this.drawTiles(this.backdrop_render_ctx, earth_tiles);
        
    }

    renderFlower() {
        let flower_tiles = [];
        this.clearRenderCtx(this.flower_render_ctx);
        
        
        for (let tile of this.ctrl.data.game.tiles) {
            if (tile.flowername) {
                if (true||tile.germed) { // todo find way to handle germination
                    flower_tiles.push({image_name: tile.flowername, q: tile.q, r: tile.r, opacity: 1});
                } else {
                    flower_tiles.push({image_name: "card", q: tile.q, r: tile.r});
                }
            }
        }
        this.drawTiles(this.flower_render_ctx, flower_tiles, 0.7); // todo fix hover highlighting
    }

    renderHighlight(action, ctx) {// render highlights on every game update when auto-reducing booster is hovered
        this.clearRenderCtx(ctx);
        let highlight_tiles = [];
        
        let opacity = 0.7;
        if (action) {
            action = action.split("-");
            if (action[0] == "boosters") {
                for (let tile of this.ctrl.data.game.tiles) {
                    highlight_tiles.push({image_name: "highlight-white", q: tile.q, r: tile.r, opacity: (tile.boosters[action[1]]??0)/100*opacity}); // all boosters go 0-100 0.7 for  // todo: make boosters: {"water": 45, "fertilizer": 3, ...}
                }
            }  else if (action[0] == "buildings") { // todo find way to handle buildings (per tile->repair is hard/ spanning multiple tiles->hover-highlight is hard)
                // with multiple allow building on top?
                for (let tile of this.ctrl.data.game.tiles) {
                    if (tile.buildings.hasOwnProperty(action[1])) {
                        highlight_tiles.push({image_name: this.highlight_action || "highlight-white", q: tile.q, r: tile.r, opacity: opacity}); // todo: make buildings: {"sprinkler": {"weeksleft": 78, "amount": 4}, "slugfleece": {"weeksleft": 50}, ...}
                    }
                }
            } else if (action[0] == "flowers") {
                for (let tile of this.ctrl.data.game.tiles) {
                    if (tile.flowername == action[1]) {
                        highlight_tiles.push({image_name: "highlight-white", q: tile.q, r: tile.r, opacity: opacity});
                    }
                }
            } else if (action[0] == "expand") { // 
                // todo make expandable tiles list when updating tiles (updateTiles)
                for (let tile of this.ctrl.data.game.tiles) {
                    if (expand_tiles.some(exp_tile=>tile.q == exp_tile.q && tile.r == exp_tile.r)) {
                        highlight_tiles.push({image_name: "highlight-white", q: tile.q, r: tile.r, opacity: opacity});
                    }
                }

            }
            this.drawTiles(ctx, highlight_tiles);
        }
    }

    drawTiles(ctx, tiles, tile_scale=1) { // tiles: [{image_name: , q: , r: (, opacity: )}, ...]
        // transform so that originally tile center coords can be used as top-left corner coords
        ctx.translate(-this.tile_width*tile_scale/2, -this.tile_height*tile_scale/2);
        for (let tile of tiles) {
            if (tile.opacity !== undefined) {
                ctx.globalAlpha = tile.opacity;
            }
            ctx.drawImage(this.images[tile.image_name],
                    this.tile_size * (          3./2 * tile.q                          ),
                    this.tile_size * (Math.sqrt(3)/2 * tile.q  +  Math.sqrt(3) * tile.r),
                    this.tile_width*tile_scale, this.tile_height*tile_scale);
        }
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, 10, 10);
        // transform back
        ctx.translate(this.tile_width*tile_scale/2, this.tile_height*tile_scale/2);
        ctx.globalAlpha = 1;
    }

    modifyScene(tiles) {
        // redraw only of given tiles

    }

    // how do animations and/or highlightings? highlightings pre-rendered, animations with animationframe
/*
    drawFullScene = (tiles) => {
        // full redraw of game_data["tiles"]
        ctx = ctx_list[1] // scene context
        // draw prerendered backdrop
        ctx.drawImage(this.backdrop_render_cvs, this.backdrop_render_cvs.width/2, this.backdrop_render_cvs.height/2);
        //ctx.drawImage(this.flower_render_cvs, this.backdrop_render_cvs.width/2, this.backdrop_render_cvs.height/2);


        for (let tile of tiles) {  //to_do implement douoble grid...
            //let topleft = [-this.tile_width/2 + tile.locx * this.col_spc + tile.locy*(sess.horz_tile_dist/2), -sess.tile_size/2 + tile.locy * sess.vert_tile_dist];
            ctx.drawImage(this.images[tile.flowername],
                tile.locx * 2*this.col_spc + tile.locy*this.col_spc,
                tile.locy * this.row_spc/2,
                this.tile_width, this.tile_height);
        }
    }
*/
    applyScale(x, y, d) {
        let factor = Math.pow(1.001, d);
        let old_scale = this.trans_scale;
        this.trans_scale = Math.max(0.1 * this.cvs_res, Math.min(factor * this.trans_scale, 5 * this.cvs_res));
        if (this.trans_scale != old_scale) {
            this.trans_x += (x-this.cvs_width/2 - this.trans_x) * (1-factor);
            this.trans_y += (y-this.cvs_height/2 - this.trans_y) * (1-factor);
            this.applyTransform();
        }
    }


    applyDrag(x, y) {
        this.trans_x += x - this.drag_from.x;
        this.trans_y += y - this.drag_from.y;
        this.drag_from = {x: x, y: y};
        this.applyTransform();
    }

    applyTransform() {
        for (let ctx of this.ctx_list) {
            ctx.resetTransform();
            ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
            ctx.translate(this.trans_x, this.trans_y);
            ctx.scale(this.trans_scale, this.trans_scale);
            //this.drawRenderedLayer(ctx, this.images["highlight-red"]);
        }
        this.fullDraw();
    }

    fullDraw() {        
        //this.drawRenderedLayer(this.ctx_list[0], this.backdrop_render_cvs);
        
        this.drawRenderedLayer(this.ctx_list[0], this.backdrop_render_cvs);
        this.drawRenderedLayer(this.ctx_list[1], this.flower_render_cvs);
        this.drawRenderedLayer(this.ctx_list[2], (this.ctrl.icon_hover_action)? this.hover_hl_render_cvs : this.active_hl_render_cvs);
        this.ctx_list[2].fillStyle = "blue";
        this.ctx_list[2].fillRect(0, 0, 10, 10);
        // animations redraw themselves
        
    }
    
    animationLoop(timestamp) {
        // draw all current animations
        
        this.clearDisplayCtx(this.animate_ctx);
        
        for (let a of this.running_animations) {
            switch (a.type) {
                case "tile-hover":
                    this.drawTiles(ctx, [{image_name: a.image_name, q: a.q, r: a.r, opacity: a.opacity}]);
                    break;
            }
        }    
        window.requestAnimationFrame(this.animationLoop.bind(this));
    }
}

class Data {
    constructor(data, parent) {
        this.ctrl = parent;
        this.stat = data[0];
        this.game = data[1];
    }

    changeMoney(amount) {
        this.game.money += amount;
        this.updateDatabase("games", [{name: this.game.name, money: this.game.money, elapsedweeks: this.game.elapsedweeks, shelf: this.game.shelf}]);
    }
    incWeek() {
        this.game.elapsedweeks++;
        this.ctrl.next_update_time += this.ctrl.ms_per_week;
        this.updateDatabase("games", [{name: this.game.name, money: this.game.money, elapsedweeks: this.game.elapsedweeks, shelf: this.game.shelf}]);
    }
    changeFlowerInShelf(flower_name, amount) {
        this.game.shelf[flower_name] += amount;
        this.updateDatabase("games", [{name: this.game.name, money: this.game.money, elapsedweeks: this.game.elapsedweeks, shelf: this.game.shelf}]);
    }
    createTileAtQR(q,r) {
        if (!this.game.tiles.some(tile=>tile.q == q && tile.r == r)) {
            // create new tile with random prequisites
            let boosters_init = {water: Math.floor((Math.random() * 40) + 21), fertilizer: 0, compost: Math.floor((Math.random() * 40) + 21), manure: 0, mulch: Math.floor((Math.random() * 40) + 21), slugkiller: 0, bugkiler: 0};
            let tile = {q: q, r: r, gamename: undefined, flowername: undefined, boosters: boosters_init, age: undefined};
            this.updateDatabase("tiles", [tile], "ins");
        } else {
            console.warn("Attempting to create existing tile.");
        }
    }
    delTile(tile) {
        this.updateDatabase("tiles", [tile], "del");
    }
    addFlowerToTile(flower_name, tile) {
        if (!tile.flowername) {
            tile.flowername = flower_name;
            this.updateDatabase("tiles", [tile]);
        } else {
            console.warn("Attempting to overwrite flower with new flower.");
        }
    }
    removeFlowerFromTile(tile) {
        if (tile.flowername) {
            tile.flowername = undefined;
            this.updateDatabase("tiles", [tile]);
        } else {
            console.warn("Attempting to remove undefined flower");
        }
    }
    addDecoToTile(deco_name, tile) {
        if (!tile.deconame) {
            tile.deconame = deco_name;
            this.updateDatabase("tiles", [tile]);
        } else {
            console.warn("Attempting to overwrite deco with new deco.");
        }
    }
    removeDecoFromTile(tile) {
        if (tile.deconame) {
            tile.deconame = undefined;
            this.updateDatabase("tiles", [tile]);
        } else {
            console.warn("Attempting to remove undefined deco");
        }
    }
    applyBoosterOnTile(booster_name, tile) {
        tile.boosters[booster_name] = Math.min(tile.boosters[booster_name]+1, 100);
        this.updateDatabase("tiles", [tile]);
    }
    addBuildingToTile(building_name, tile, intensity) {
        tile.buildings[building_name] = {weeksleft: this.stat.buildings[building_name].weeks, intensity: intensity};
        this.updateDatabase("tiles", [tile]);
    }
    repairBuildingOnTile(building_name, tile) {
        tile.buildings[building_name].weeksleft = this.stat.buildings[building_name].weeks;
        this.updateDatabase("tiles", [tile]);
    }
    changeBuildingIntensity(building_name, tile, intensity) {
        tile.buildings[building_name].intensity = intensity;
        this.updateDatabase("tiles", [tile]);
    }


    weeklyUpdate() {
        // apply update logic
        // tile deletes if tile gets überwachsen (this.delTile(tile))
        this.updateDatabase("tiles", this.game.tiles);
        this.incWeek();
    }




    updateDatabase(table_name, rows=[], action="upd") { // upd/ins/del
        fetch('/sqlgarden/update.php', {
            method: 'POST',
            headers: {ContentType: 'application/json'},
            body: JSON.stringify({
                tablename: table_name,
                rows: rows, // full associative rows
                action: action,
                gamename: game_data["name"]
                })
            }
        )
        .then(response => response.json())
        .then(responseData => {});
    }

}

class Control {
    
    action = "lens";
    hovered_tile = undefined;
    season = 1;
    shop_info = document.getElementById("shop-info");
    shop = document.getElementById("shop");
    ui_cvs = document.getElementById("ui-cvs");
    hover_icons = Array.from(document.getElementsByClassName("hover-icon"));
    hover_contents = Array.from(document.getElementsByClassName("hover-content"));
    action_btns = Array.from(document.getElementsByClassName("action-btn"));
    nav_labels = Array.from(document.getElementsByClassName("nav-label"));
    skip_btns = Array.from(document.getElementsByClassName("skip-btn"));
    ms_per_week = 2000;
    weeks_per_year = 52;
    
    prev_timestamp = 0;

    constructor(data) {
        this.next_update_time = this.ms_per_week;
        this.data = new Data(data, this);
        this.updateMoney(0);
        this.view = new View(this);
        this.marker = document.getElementById("season-marker");
        this.marker.style.transitionDuration = this.ms_per_week/1000+"s";
        this.attachEventListeners();
    }

    attachEventListeners() {
        window.addEventListener("resize", this.view.updateCvsSize.bind(this.view))
        this.shop.addEventListener("scroll", this.alterRadios.bind(this));
        this.ui_cvs.addEventListener("mousedown", this.handleMouseDown.bind(this));
        this.ui_cvs.addEventListener("mousemove", this.handleMouseMove.bind(this));
        this.ui_cvs.addEventListener("click", this.handleMouseClick.bind(this));
        this.ui_cvs.addEventListener("wheel", this.handleMouseWheel.bind(this));
        this.hover_icons.forEach(item => {item.addEventListener("mouseenter", this.iconHover.bind(this))});
        this.hover_icons.forEach(item => {item.addEventListener("mouseleave", this.iconHover.bind(this))});
        this.hover_contents.forEach(item => {item.addEventListener("mouseenter", this.contentHover.bind(this))});
        this.hover_contents.forEach(item => {item.addEventListener("mouseleave", this.contentHover.bind(this))});
        this.action_btns.forEach(item => {item.addEventListener("click", this.setAction.bind(this))});
        this.nav_labels.forEach(item => {item.addEventListener("click", this.navTo.bind(this))});
        this.skip_btns.forEach(item => {item.addEventListener("click", this.skipSeason.bind(this))});
        document.body.onkeyup = (evt) => {
            if (evt.key === "Escape") {
                // change current action to lens
                document.getElementById("tools-lens").dispatchEvent("click");
            }
        }
    }

    initDeco() {
        // todo init ranks

        // todo init progress
    }

    updateMoney(amount) {
        this.data.changeMoney(amount);
        document.getElementById("money-display").innerHTML = this.data.game.money;
        // update state of shop items
        let items = document.getElementsByClassName("buy-btn");
    
        for (let i of items) {
            if (i.dataset.price<=this.data.game.money) {
                i.classList.add("affordable");
            } else {
                i.classList.remove("affordable");
            }
        }
    }

    handleMouseClick(evt) {
        if (this.view.drag_from) {
            this.view.drag_from = undefined;
        } else if (this.action_valid) {
            // handle clicks on tiles regarding current action
            switch (this.action) {
                case "lens":
                    // fill popup with data
                    document.getElementById("tile-info").parentElement.classList.add("opened")
                    // open popup
                    break;
                case "spade":
                    break;
            }
        }
    }

    handleMouseWheel(evt) {this.view.applyScale(evt.offsetX*this.view.cvs_res, evt.offsetY*this.view.cvs_res, -evt.deltaY * 10)}

    handleMouseDown(evt) {this.view.drag_from={x: evt.offsetX*this.view.cvs_res, y: evt.offsetY*this.view.cvs_res}}

    computeActionValidCoords() { // todo clean up, structure action vocab
        this.avc = {boost: [], flower: [], deco: [], expand: [], build: [], sickle: [], lens: [], spade: []}
        for (let tile of this.data.game.tiles) {
            avc["boost"].push({q:tile.q,r:tile.r})
            if (!tile.flowername && ! tile.deconame) {

            }
        }
    }
    handleMouseLeave(evt) {
        this.hovered_tile = undefined;
    }
    handleMouseMove(evt) {
        if (this.view.drag_from){
            this.view.applyDrag(evt.offsetX*this.view.cvs_res, evt.offsetY*this.view.cvs_res);
        } else {
            /*
            // handle hover effects
            let cursor_on_cvs = [(evt.offsetX-sess.trans_x)/sess.trans_scale,
                                (evt.offsetY-sess.trans_y)/sess.trans_scale];

    
            let next_on_tg = []; // tg = tile-grid
    
            next_on_tg[1] = Math.round(cursor_on_cvs[1]/sess.vert_tile_dist);
            next_on_tg[0] = Math.round(cursor_on_cvs[0]/sess.horz_tile_dist - next_on_tg[1]/2);
    
            let next_on_cvs = tgToCvs(next_on_tg);
            // Math.pow(next_on_cvs[0]-cursor_on_cvs[0], 2) + Math.pow(next_on_cvs[1]-cursor_on_cvs[1], 2) <= Math.pow(sess.tile_size/2, 2)
            // if hovering a tile

            */
            let [q, r] = this.getHoveredTileCoords(evt);
            //todo how hNDLE CURRENT ACTIONS
           if (!this.hovered_tile || this.hovered_tile.q != q || this.hovered_tile.r != r) {
                this.hovered_tile = this.data.game.tiles.find(t => t.q == q && t.r == r);

                if (action_valid_coords[this.action].some(coords=>coords.q == q && coords.r == r)) {


                }
                // todo handle tile hover effects
                let hover_type = undefined;
                if (this.action_valid) { // todo way to deal with expanding (hovering not on existing tile)
                    // set hover effect based on current action
                    if (this.action.includes("lens")) {
                        hover_type = "tile-hover";
                    } else if (this.action.includes("flower")) {
                        if (!this.hovered_tile.flowername) {
                            hover_type = "tile-hover";
                        }
                    } else if (this.action.includes("shelf")) { // todo how to handle special items (gnomes etc.)
                        if (!this.hovered_tile.flowername) {
                            hover_type = "tile-hover";
                        }
                    } else if (this.action.includes("booster")) {
                        if (!this.hovered_tile.boosters.includes(this.action.replace("booster-", ""))) {
                            hover_type = "tile-hover";
                        }
                    } else if (this.action.includes("building")) {
                        if (!this.hovered_tile.boosters.includes(this.action.replace("building-", ""))) {
                            if (!game_data.tiles.filter(t=>[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]].some(loc=> t.locx == next_on_tg[0]+loc[0] && t.locy == next_on_tg[1]+loc[1]).some(t=>t.boosters.includes(this.action.replace("building-", ""))))) {
                                hover_type = "building-hover";
                            }
                        }
                    } else if (this.action.includes("sickle")) {
                        if (this.hovered_tile.flowername) {
                            hover_type = "tile-hover";
                        }
                    } else if (this.action.includes("seedcoll")) {
                        if (this.hovered_tile.seeding) {
                            hover_type = "tile-hover";
                        }
                    } else if (this.action.includes("spade")) {
                        // hovering the diggable tiles
                        if (this.items_highlight_tiles["spade"].find(loc => loc[0] == next_on_tg[0] && loc[1] == next_on_tg[1])) {
                            hover_type = "tile-hover";
                        }
                    }
                }    
                // remove any hovering animations NONONONONONONONON
                let i = this.view.running_animations.findIndex(a => a.type.includes("tile-hover"));
                if (i>-1) {this.view.running_animations.splice(i, 1);}
        
                if (!hover_type) {
                    this.hovered_tile = undefined;
                } else {
                    this.view.running_animations.push({starttime: undefined, type: hover_type, x: next_on_cvs[0], y: next_on_cvs[1], color: "white"});
                } 

                }
           
        }
    }

    navTo(evt) {
        let id = evt.currentTarget.htmlFor + "-header";
        const el = document.getElementById(id);
        this.shop.scroll({
            top: el.offsetTop-50, 
            left: 0, 
            behavior: 'smooth'
          });
    }
    
    alterRadios(evt) {
        const top = this.shop.scrollTop+150;
        if (top < document.getElementById("boosters-header").offsetTop) {
            document.getElementById("tools-radio").checked = true;
        } else if (top < document.getElementById("flowers-header").offsetTop) {
            document.getElementById("boosters-radio").checked = true;
        } else if (top < document.getElementById("buildings-header").offsetTop) {
            document.getElementById("flowers-radio").checked = true;
        } else {
            document.getElementById("buildings-radio").checked = true;
        }
    }

    getShopInfo(action) {
        return action;
    }

    contentHover(evt) {
        if (evt.type == "mouseenter") {
            this.shop_info.innerHTML = this.getShopInfo(evt.currentTarget.parentElement.id);
            let item_rect = evt.currentTarget.getBoundingClientRect();
            this.shop_info.style.setProperty("--pos", (item_rect.top + item_rect.height/2).toString()+"px");
            this.shop_info.classList.remove("hidden");
        } else if (evt.type == "mouseleave") {
            this.shop_info.classList.add("hidden");
        }
    }

    iconHover(evt) {
        if (evt.type == "mouseenter") {
            this.icon_hover_action = evt.currentTarget.parentElement.id;
            this.view.renderHighlight(evt.currentTarget.parentElement.id, this.view.hover_hl_render_ctx);
            this.view.drawRenderedLayer(this.view.ctx_list[2], this.view.hover_hl_render_cvs);
        } else if (evt.type == "mouseleave") {
            this.icon_hover_action = undefined;
            this.view.drawRenderedLayer(this.view.ctx_list[2], this.view.active_hl_render_cvs);
        }
    }

    getHoveredTileCoords(evt) { // source: hexgrids page
        // raw
        let x = (evt.offsetX * this.view.cvs_res - this.view.trans_x - this.view.cvs_width/2) / this.view.trans_scale - this.view.map_trans_x;
        let y = (evt.offsetY * this.view.cvs_res - this.view.trans_y - this.view.cvs_height/2) / this.view.trans_scale - this.view.map_trans_y;
        
        let q = ( 2./3 * x                     ) / this.view.tile_size / this.view.cvs_res;
        let r = (-1./3 * x + Math.sqrt(3)/3 * y) / this.view.tile_size / this.view.cvs_res;
        let s = -q-r;

        // rounded
        let q_r = Math.round(q);
        let r_r = Math.round(r);
        let s_r = Math.round(s);

        // differences
        let q_d = Math.abs(q_r-q);
        let r_d = Math.abs(r_r-r);
        let s_d = Math.abs(s_r-s);

        // hovered
        let q_h;
        let r_h;

        if (q_d > r_d && q_d > s_d) {
            q_h = -r_r-s_r;
            r_h = r_r;
        } else if (r_d > s_d) {
            r_h = -q_r-s_r;
            q_h = q_r;
        } else {
            r_h = r_r;
            q_h = q_r;
        }
        return [q_h, r_h]
    }



    computeExpandableTiles(tiles) {
        const directions = [[1, 0], [1, -1], [0, 1], 
                            [-1, 0], [-1, 1], [0, -1]]
        this.expandable_tiles = [];
        for (let tile of tiles) {
            for (let dir of directions) {
                let q = tile.q + dir[0];
                let r = tile.r + dir[1];
                if (!tiles.some((tile)=>{return tile.q == q && tile.r == r})) {
                    this.expandable_tiles.push({q: q, r: r, cost: (abs(q)+ abs(q+r)+ abs(r)) / 2});
                }
            }
        }
    }

    setAction = (evt) => {
        // to can be "shelf-something" or "flower-plant-something" or "booster-something"
    
        for (let el of document.getElementsByClassName("active-item")) {
            // only one
            el.classList.remove("active-item");
        }
        this.action = evt.currentTarget.parentElement.parentElement.id;
        console.log(this.action)
        //this.ui_cvs.style = "--cursorloc: url(images/cursors/"+to+".png);"
        document.getElementById(this.action).classList.add("active-item");
    }

    addTile(q, r) {
        this.data.createTileAtQR(q, r);
        computeExpandableTiles(this.data.game.tiles);
    }

    gameLoop = (timestamp) => {
        // check if update needed
        if (this.prev_timestamp < this.next_update_time && this.next_update_time <= timestamp) {

            this.data.incWeek();
            // update season bar
            let year_percentage = (this.data.game.elapsedweeks % this.weeks_per_year)*100/this.weeks_per_year;
            this.marker.style.left = year_percentage.toString()+"%";
            // todo manage weekly updates
            // todo maybe make function for randomly delaying weekly effects

            // get global season parameters
            let season_params = getSeasonParams();

            for (let tile of game_data.tiles) {                
                // update boosters (remove expired)

                // llalalalalalal: wakeupprob
                // check for flower
                if (tile.flowername) {
                    // check for seeding
                    if (Math.floor(Math.random() * tile.invseedingprob) == 1) {
                        // execute seeding
                    }

                    // check for germing
                    if (Math.floor(Math.random() * tile.invgermingprob) == 1) {
                        // execute germing
                    }

                    // check for bugs
                    if (Math.floor(Math.random() * tile.invbugsprob) == 1) {
                        // execute bugs
                    }

                    // check for snails
                    if (Math.floor(Math.random() * tile.invsnailsprob) == 1) {
                        // execute snails
                    }

                    // check for death
                    if (Math.floor(Math.random() * tile.invdeathprob) == 1) {
                        // execute death
                    }
                }
            }
            this.view.renderFlower();
            if (this.icon_hover_action) {
                this.view.renderHighlight(this.icon_hover_action, this.view.hover_hl_render_ctx);
            } else {
                this.view.renderHighlight(this.action, this.view.active_hl_render_ctx);
            }
        }
        this.prev_timestamp = timestamp;
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }
    skipSeason(evt) {
        const skipped_time = undefined;
    }
}







const addBuildingBoosters = () => {

}

const randomDecision = () => {

}


const changeSeason = (to_season) => {
    changeBackdrop(to_season);
    // update overall probabilities...and stuff
}

const addTile = (x, y) => {

}


const getSeasonParams = () => {
    return undefined
}

window.onload = () => {
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';

    // get element objects
    let control = new Control([STATIC_DATA, game_data]);
    //applyTransform();

    control.gameLoop(0);
    control.view.animationLoop(0);
}


window.onbeforeunload = () => {

}