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
        this.updateTrans("display");    
    }

    backdrop_render_cvs = document.createElement("canvas");
    backdrop_render_ctx = this.backdrop_render_cvs.getContext("2d");

    flower_render_cvs = document.createElement("canvas");
    flower_render_ctx = this.flower_render_cvs.getContext("2d");

    hover_hl_render_cvs = document.createElement("canvas");
    hover_hl_render_ctx = this.hover_hl_render_cvs.getContext("2d");

    active_hl_render_cvs = document.createElement("canvas");
    active_hl_render_ctx = this.active_hl_render_cvs.getContext("2d");

    canvas_cont = document.getElementById("canvas-container");
    cvs_res = 4; //canvas pixel per style pixel // todo allow different settings (correct clearrect for animations)
    map_frame = [];
    tile_frame = [0,0,0,0];
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
    

    gatherImages() {
        for (let image of document.getElementsByClassName("img")) {
            this.images[image.id] = image;
        }
    }

    getCanvasCtxList() {
        this.cvs_list = document.getElementsByClassName("display-cvs");
        for (let cvs of this.cvs_list) {
            let ctx = cvs.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            this.ctx_list.push(ctx);
        }
    }

    updateCvsSize() {  // always followed by this.updateTiles() OR this.updateMapDims();
        const cont_style = window.getComputedStyle(this.canvas_cont);
        this.cvs_width = parseInt(parseFloat(cont_style.width) * this.cvs_res);
        this.cvs_height = parseInt(parseFloat(cont_style.height) * this.cvs_res);
        for (var cvs of this.cvs_list) {
            cvs.width = this.cvs_width;
            cvs.height = this.cvs_height;
        } // todo ???
        this.updateMapDims();
    }
    updateTiles() {
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
        
        this.ctrl.computeExpandableTiles();
        this.ctrl.buildAllBuildableTiles();
        this.updateMapDims()
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
        this.computeMapTransform();
        this.updateTrans("render");
        this.updateTrans("animate");
        this.renderBackdrop();
        this.renderFlower();
        this.renderHighlight(this.ctrl.action, this.active_hl_render_ctx);
        this.renderHighlight(this.ctrl.icon_hover_action, this.hover_hl_render_ctx);
        this.fullDraw();
    }

    computeMapTransform() {
        this.map_trans_x = -(this.tile_frame[0]+this.tile_frame[2])/2 * this.col_spc * this.cvs_res;
        this.map_trans_y = -(this.tile_frame[1]+this.tile_frame[3])/2 * this.row_spc * this.cvs_res;
    }
    applyScale(x, y, d) {
        let factor = Math.pow(1.001, d);
        let old_scale = this.trans_scale;
        this.trans_scale = Math.max(0.1 * this.cvs_res, Math.min(factor * this.trans_scale, 5 * this.cvs_res));
        if (this.trans_scale != old_scale) {
            this.trans_x += (x-this.cvs_width/2 - this.trans_x) * (1-factor);
            this.trans_y += (y-this.cvs_height/2 - this.trans_y) * (1-factor);
            this.updateTrans("display");
            this.updateTrans("animate");
        }
    }
    applyDrag(x, y) {
        this.trans_x += x - this.drag_from.x;
        this.trans_y += y - this.drag_from.y;
        this.drag_from = {x: x, y: y};
        this.updateTrans("display");
        this.updateTrans("animate");
    }

    updateTrans(type) {        
        switch (type) {
            case "render":
                for (let ctx of [this.backdrop_render_ctx, this.flower_render_ctx, this.hover_hl_render_ctx, this.active_hl_render_ctx]) {
                    ctx.resetTransform();
                    ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
                    ctx.translate(this.map_trans_x, this.map_trans_y);
                    ctx.scale(this.cvs_res, this.cvs_res);
                }
                this.renderBackdrop();
                this.renderFlower();
                this.renderHighlight(this.ctrl.action, this.active_hl_render_ctx);
                this.renderHighlight(this.ctrl.icon_hover_action, this.hover_hl_render_ctx);
                break;
            case "display":
                for (let ctx of this.ctx_list.slice(0, 3)) {
                    ctx.resetTransform();
                    ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
                    ctx.translate(this.trans_x, this.trans_y);
                    ctx.scale(this.trans_scale, this.trans_scale);
                }
                this.displayRenderedMap(this.ctx_list[0], this.backdrop_render_cvs);
                this.displayRenderedMap(this.ctx_list[1], this.flower_render_cvs);
                this.displayRenderedMap(this.ctx_list[2], (this.ctrl.icon_hover_action)? this.hover_hl_render_cvs : this.active_hl_render_cvs);
         // todo make to display rendered map
                break;
            case "animate":
                let ctx = this.ctx_list[3];
                ctx.resetTransform();
                ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
                ctx.translate(this.trans_x, this.trans_y);
                ctx.scale(this.trans_scale, this.trans_scale);
                ctx.translate(this.map_trans_x, this.map_trans_y);
                ctx.scale(this.cvs_res, this.cvs_res);
                break;
        }
    }

    clearCtx(ctx) {
        ctx.save();
        ctx.resetTransform();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }
    displayRenderedMap(ctx, map_image) {
        this.clearCtx(ctx);
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
        this.clearCtx(this.flower_render_ctx);
        
        for (let tile of this.ctrl.data.game.tiles) {
            if (tile.flowername) {
                if (true||tile.germed) { // todo find way to handle germination -> age + germtime
                    flower_tiles.push({image_name: tile.flowername, q: tile.q, r: tile.r, opacity: 1});
                } else {
                    flower_tiles.push({image_name: "card", q: tile.q, r: tile.r});
                }
            } else if (tile.deconame) {
                flower_tiles.push({image_name: tile.deconame, q: tile.q, r: tile.r, opacity: 1});
            }
        }
        this.drawTiles(this.flower_render_ctx, flower_tiles, 0.7, true); // todo fix hover highlighting
    }

    renderHighlight(action=this.ctrl.action, ctx=this.active_hl_render_ctx) {// render highlights on every game update when auto-reducing boost is hovered
        this.clearCtx(ctx);
        let highlight_tiles = [];
        let opacity = 0.5;
        let scale = 1;
        if (action) {
            if (action[0] == "boost") {
                for (let tile of this.ctrl.data.game.tiles) {
                    highlight_tiles.push({image_name: "highlight-white", q: tile.q, r: tile.r, opacity: (tile.boosts[action[1]]??0)/100*opacity}); // all boosts go 0-100 0.7 for  // todo: make boosts: {"water": 45, "fertilizer": 3, ...}
                }
            }  else if (action[0] == "building") { // todo find way to handle buildings (per tile->repair is hard/ spanning multiple tiles->hover-highlight is hard)
                scale = 3;
                // with multiple allow building on top?
                for (let tile of this.ctrl.data.game.tiles) {
                    if (tile.buildings.hasOwnProperty(action[1])) {
                        highlight_tiles.push({image_name: "building-hl-white", q: tile.q, r: tile.r, opacity: opacity}); // todo: make buildings: {"sprinkler": {"weeksleft": 78, "amount": 4}, "slugfleece": {"weeksleft": 50}, ...}
                    }
                }
            } else if (action[0] == "flower") {
                for (let tile of this.ctrl.data.game.tiles) {
                    if (tile.flowername == action[1]) {
                        highlight_tiles.push({image_name: "highlight-white", q: tile.q, r: tile.r, opacity: opacity});
                    }
                }
            } else if (action[0] == "expand") {
                // todo make expandable_tiles list when updating tiles (updateTiles)
                for (let tile of this.ctrl.expandable_tiles) {
                    highlight_tiles.push({image_name: "highlight-white", q: tile.q, r: tile.r, opacity: opacity});
                }

            }
            this.drawTiles(ctx, highlight_tiles, scale);
        }
    }

    drawTiles(ctx, tiles, tile_scale=1, square=false) { // tiles: [{image_name: , q: , r: (, opacity: )}, ...]
        // transform so that originally tile center coords can be used as top-left corner coords
        ctx.translate(-this.tile_width*tile_scale/2, -this.tile_height*tile_scale/2);
        for (let tile of tiles) {
            if (tile.opacity !== undefined) {
                ctx.globalAlpha = tile.opacity;
            }
            let img = this.images[tile.image_name]
            let height = this.tile_height*tile_scale;
            let width = (square)? height : this.tile_width*tile_scale;
            let left = (square)? (this.tile_width*tile_scale - width) /2: 0;
            ctx.drawImage(img,
                    this.tile_size * (          3./2 * tile.q                          ) + left,
                    this.tile_size * (Math.sqrt(3)/2 * tile.q  +  Math.sqrt(3) * tile.r),
                    //this.tile_width*tile_scale, this.tile_height*tile_scale);
                    width, height);
                    //img.width*tile_scale, img.height*tile_scale);
        }
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

    fullDraw() {        
        this.displayRenderedMap(this.ctx_list[0], this.backdrop_render_cvs);
        this.displayRenderedMap(this.ctx_list[1], this.flower_render_cvs);
        this.displayRenderedMap(this.ctx_list[2], (this.ctrl.icon_hover_action)? this.hover_hl_render_cvs : this.active_hl_render_cvs);
        // animations redraw themselves
        
    }
    
    animationLoop(timestamp) {
        // draw all current animations
        
        //this.ctx_list[3].scale(this.cvs_res, this.cvs_res);
        this.clearCtx(this.ctx_list[3]);
        //this.ctx_list[3].scale(1/this.cvs_res, 1/this.cvs_res);

        
        for (let a of this.running_animations) {
            switch (a.type) {
                case "highlight-tile":
                    this.drawTiles(this.ctx_list[3], [{image_name: a.image_name, q: a.q, r: a.r, opacity: a.opacity}], a.scale);
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
    changeInfections(tile, infection_name, state) {
        tile.infections[infection_name] = state;
        this.updateDatabase("tiles", [tile]);
    }
    changeSeedsInShelf(flower_name, amount) {
        this.game.shelf[flower_name] += amount;
        this.updateDatabase("games", [{name: this.game.name, money: this.game.money, elapsedweeks: this.game.elapsedweeks, shelf: this.game.shelf}]);
    }
    createTileAtQR(q,r) {
        if (!this.game.tiles.some(tile=>tile.q == q && tile.r == r)) {
            // create new tile with random prequisites
            let boosts_init = {water: Math.floor((Math.random() * 40) + 21), fertilizer: 0, compost: Math.floor((Math.random() * 40) + 21), manure: 0, mulch: Math.floor((Math.random() * 40) + 21), slugkiller: 0, bugkiler: 0};
            let tile = {q: q, r: r, gamename: this.game.name, flowername: null, deconame: null, decorank: 0, boosts: boosts_init, buildings: {}, infections: {}, age: 0};
            this.game.tiles.push(tile);
            this.updateDatabase("tiles", [tile], "ins");
        } else {
            console.warn("Attempting to create existing tile.");
        }
    }
    delTile(tile) {
        this.updateDatabase("tiles", [tile], "del");
    }
    addFlowerToTile(flower_name, tile, mode) { // seed "seed"/"plant"
        if (!tile.flowername) {
            tile.flowername = flower_name;
            tile.age = (mode=="seed")? 0 : this.stat.flowers.find(flower=>flower.name==flower_name).germtime; // todo germtime or functiondependent?
            this.updateDatabase("tiles", [tile]);
        } else {
            console.warn("Attempting to overwrite flower with new flower.");
        }
    }
    removeFlowerFromTile(tile) {
        if (tile.flowername) {
            tile.flowername = null;
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
            tile.deconame = null;
            this.updateDatabase("tiles", [tile]);
        } else {
            console.warn("Attempting to remove undefined deco");
        }
    }
    applyBoostOnTile(boost_name, tile) {
        tile.boosts[boost_name] = Math.min(tile.boosts[boost_name]+1, 100);
        this.updateDatabase("tiles", [tile]);
    }
    addBuildingToTile(building_name, tile, intensity) {
        tile.buildings[building_name] = {weeksleft: this.stat.buildings.find(building=>building.name == building_name).weeks, intensity: intensity};
        this.updateDatabase("tiles", [tile]);
        this.ctrl.building_tiles[building_name].push(tile);
        this.ctrl.getBuildingBuildableTiles(building_name);
        }
    repairBuildingOnTile(building_name, tile) {
        tile.buildings[building_name].weeksleft = this.stat.buildings.find(building=>building.name == building_name).weeks;
        this.updateDatabase("tiles", [tile]);
    }
    changeBuildingIntensity(building_name, tile, intensity) {
        tile.buildings[building_name].intensity = intensity;
        this.updateDatabase("tiles", [tile]);
    }
    deleteBuildingFromTile(building_name, tile) {
        delete tile.buildings[building_name];
        this.updateDatabase("tiles", [tile]);
        this.ctrl.building_tiles[building_name].splice(this.ctrl.building_tiles[building_name].indexOf(tile), 0);
        this.ctrl.getBuildingBuildableTiles(building_name);
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
        .then(responseData => {console.log(responseData)});
    }

}









class Logic {
    constructor(data, parent) {
        this.data = data;
        this.ctrl = parent;
    }
    getValue(tile) {
        return this.data.stat.flowers.find(flower=>flower.name==tile.flowername).price*2; // todo
    }
}








class Control {
    
    action = ["tool","lens"];
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
    ms_per_week = 20000;
    weeks_per_year = 52;
    seeding_tiles = [];
    
    prev_timestamp = 0;

    constructor(data) {
        this.initInfos();
        this.next_update_time = this.ms_per_week;
        this.data = new Data(data, this);
        this.changeMoney(0);
        this.logic = new Logic(this.data, this);
        this.buildBuildingTiles();
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
        this.ui_cvs.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
        this.ui_cvs.addEventListener("mouseup", this.handleMouseUp.bind(this));
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
                document.getElementById("tool-lens").dispatchEvent(new Event('click'));
            }
        }
    }

    initDeco() {
        // todo init ranks

        // todo init progress
    }

    initInfos() {
        let infos = document.getElementsByClassName("item-info");
        this.item_infos = {};
        for (let info of infos) {
            this.item_infos[info.id] = info;
        }
    }

    changeMoney(amount) {
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
        let action = this.action;
        if (["boost", "flower", "building"].indexOf(this.action[0])>-1) { // todo find solution for out of money deactivation but still repair or see building state/set intensity
            if (this.data.game.money < this.data.stat[action[0]+"s"].find(boost=>boost.name == action[1]).price) { //todo repair buildings how?
                // change current action to lens
                document.getElementById("tool-lens").dispatchEvent(new Event('click'));
            }
        }
    }

    // ACTION HANDLERS
    
    actionAddFlower() {
        this.data.addFlowerToTile(this.action[1], this.hovered_tile, this.action[2]);
        let plant_factor = (this.action[2]=="plant")? 3 : 1;
        this.changeMoney(-this.data.stat.flowers.find(flower=>flower.name==this.action[1]).price * plant_factor);
        this.checkActionValid(this.hovered_tile.q, this.hovered_tile.r);
        this.view.renderFlower();
        this.view.displayRenderedMap(this.view.ctx_list[1], this.view.flower_render_cvs);
        this.view.renderHighlight(this.action);
        this.view.displayRenderedMap(this.view.ctx_list[2], this.view.active_hl_render_cvs);
    }
    actionAddBuilding() {
        this.data.addBuildingToTile(this.action[1], this.hovered_tile, this.data.stat.buildings.find(building=>building.name == this.action[1]).stdintensity);
        this.changeMoney(-this.data.stat.buildings.find(building=>building.name==this.action[1]).price);
        this.checkActionValid(this.hovered_tile.q, this.hovered_tile.r);
        this.view.renderHighlight(this.action);
        this.view.displayRenderedMap(this.view.ctx_list[2], this.view.active_hl_render_cvs);
    
    }
    actionApplyBoost() {
        this.data.applyBoostOnTile(this.action[1], this.hovered_tile);
        this.changeMoney(-this.data.stat.boosts.find(boost=>boost.name==this.action[1]).price);
        this.view.renderHighlight(this.action);
        this.view.displayRenderedMap(this.view.ctx_list[2], this.view.active_hl_render_cvs);
    }
    actionAddDeco() {
        this.data.addDecoToTile(this.action[1], this.hovered_tile);
        this.checkActionValid(this.hovered_tile.q, this.hovered_tile.r);
        this.view.renderFlower();
        this.view.displayRenderedMap(this.view.ctx_list[1], this.view.flower_render_cvs);
        this.view.renderHighlight(this.action);
        this.view.displayRenderedMap(this.view.ctx_list[2], this.view.active_hl_render_cvs);
    }
    actionCollectSeeds() {
        let amount = 3; // todo link to tiles seedprob or so
        this.data.changeSeedsInShelf(this.hovered_tile.flowername, amount);
    }
    actionPopupInfo() {
        // fill popup with data
        document.getElementById("cvs-popup").parentElement.classList.remove("hidden")
        // open popup
    }
    actionCutFlower() {
        this.changeMoney(this.logic.getValue(this.hovered_tile));
        this.data.removeFlowerFromTile(this.hovered_tile);
        this.checkActionValid(this.hovered_tile.q, this.hovered_tile.r);
        this.view.renderFlower();
        this.view.displayRenderedMap(this.view.ctx_list[1], this.view.flower_render_cvs);
    }
    actionPopupBuilding() {
        // fill popup with data
        document.getElementById("cvs-popup").parentElement.classList.remove("hidden")
        // open popup
    }
    actionExpandMap() {
        this.data.createTileAtQR(this.hovered_tile.q, this.hovered_tile.r);
        this.view.updateTiles();
        this.checkActionValid(this.hovered_tile.q, this.hovered_tile.r);
    }
    actionDiscoverInfection(infection_name) { // todo include infections into highlight drawing
        this.data.changeInfections(this.hovered_tile, infection_name, "visible");
        // todo redraw
    }

    handleMouseUp(evt) {        
        this.view.drag_from = undefined;

        if (this.view.dragging) {
            this.view.dragging = false;
        } else if (this.action_valid) {
            if (this.action[0] == "tool") {
                if (this.action[1] == "lens") {
                    this.actionPopupInfo();
                } else if (this.action[1] == "sickle") {
                    this.actionCutFlower();
                } else if (this.action[1] == "spade") {
                    if (this.action[2] == "dig") {
                        this.actionDigTile();
                    } else if (this.action[2] == "place") {
                        this.actionPlaceDiggedFlower();
                    }
                }
            } else if (this.action[0] == "boost") {
                this.actionApplyBoost();
            } else if (this.action[0] == "flower") {
                
                this.actionAddFlower();
            } else if (this.action[0] == "building") {
                this.actionAddBuilding();
            } else if (this.action[0] == "deco") {
                this.actionAddDeco();
            } else if (this.action[0] == "expand") {
                this.actionExpandMap();
            }
        }
    }

    handleMouseWheel(evt) {this.view.applyScale(evt.offsetX*this.view.cvs_res, evt.offsetY*this.view.cvs_res, -evt.deltaY * 10)}

    handleMouseDown(evt) {this.view.drag_from={x: evt.offsetX*this.view.cvs_res, y: evt.offsetY*this.view.cvs_res}}

    // todo clean up, structure action vocab

    computeExpandableTiles() {
        const directions = [[1, 0], [1, -1], [0, 1], 
                            [-1, 0], [-1, 1], [0, -1]]
        this.expandable_tiles = [];
        for (let tile of this.data.game.tiles) {
            for (let dir of directions) {
                let q = tile.q + dir[0];
                let r = tile.r + dir[1];
                if (!this.expandable_tiles.some((tile)=>{return tile.q == q && tile.r == r})
                && !this.data.game.tiles.some((tile)=>{return tile.q == q && tile.r == r})) {
                    this.expandable_tiles.push({q: q, r: r, cost: (Math.abs(q) + Math.abs(q+r) + Math.abs(r)) / 2});
                }
            }
        }
    }

    hexDistance(tilea, tileb) {
        let a = {q: tilea.q, r: tilea.r, s: -tilea.r-tilea.q};
        let b = {q: tileb.q, r: tileb.r, s: -tileb.r-tileb.q};
        var vec = {q: a.q - b.q, r: a.r - b.r, s: a.s - b.s};
        return Math.max(Math.abs(vec.q), Math.abs(vec.r), Math.abs(vec.s))
    }

    buildBuildingTiles() {
        this.building_tiles = {};
        // prepare buildings tile lists
        for (let building of this.data.stat.buildings) {
            this.building_tiles[building.name] = [];
        }
        // fill buildings tile lists
        for (let tile of this.data.game.tiles) {

            for (let building_name in tile.buildings) {
                this.building_tiles[building_name].push(tile);
            }
        }
    }

    buildAllBuildableTiles() { // call on startup, on tileUpdate
        this.buildable_tiles = {};
        
        // iterate buildings
        for (let building of this.data.stat.buildings) {            
            this.getBuildingBuildableTiles(building.name);
        }
    }
    getBuildingBuildableTiles(building_name) { // called on build or unbuild in Data
        this.buildable_tiles[building_name] = [];

        // iterate tiles in combinations
        for (let tile of this.data.game.tiles) {
            if (!this.building_tiles[building_name].some(building_tile=>this.hexDistance(tile, building_tile) < 3)
            && !this.expandable_tiles.some(border_tile=>this.hexDistance(tile, border_tile) < 2)) {
                this.buildable_tiles[building_name].push({q: tile.q, r: tile.r})
            }
        }
    }

    handleMouseLeave(evt) {
        this.hovered_tile = undefined;
        this.hovered_coords = undefined;
        let i = this.view.running_animations.findIndex(a => a.type == "highlight-tile");
        if (i>-1) {this.view.running_animations.splice(i, 1);}
    }
    handleMouseMove(evt) {
        if (this.view.drag_from){
            this.view.dragging = true;
            this.view.applyDrag(evt.offsetX*this.view.cvs_res, evt.offsetY*this.view.cvs_res);
        } else {
            let [q, r] = this.getHoveredTileCoords(evt);
            
            // if first move or move onto other tile
            if (!this.hovered_coords || this.hovered_coords.q != q || this.hovered_coords.r != r) {
                this.hovered_coords = {q: q, r: r};

                this.hovered_tile = this.data.game.tiles.find(t => t.q == q && t.r == r);
                this.checkActionValid(q,r)
            }
        }
    }

    checkActionValid(q,r) {
        this.action_valid = false;
        console.log(this.action)
        if (this.hovered_tile) {
            if (this.action[0] == "tool") {
                if (this.action[1] == "lens") {
                    // valid as long on tile
                    this.action_valid = true;
                    // check for seeds
                    if (this.seeding_tiles.indexOf(this.hovered_tile)>-1) {this.actionCollectSeeds();} // todo create seeding_tiles
                    // check for infections
                    for (let infection_name in this.hovered_tile.infections) {
                        if (this.hovered_tile.infections[infection_name] == "hidden") {this.actionDiscoverInfection(infection_name);}
                    }
                } else if (this.action[1] == "sickle") {
                    // check for flower
                    if (this.hovered_tile.flowername) {this.action_valid = true;}

                } else if (this.action[1] == "spade") {
                    if (this.action[2] == "dig") {
                        if (this.hovered_tile.flowername || this.hovered_tile.deconame) {this.action_valid = true;}
                        
                    } else if (this.action[2] == "place") {
                        if (!this.hovered_tile.flowername && !this.hovered_tile.deconame) {this.action_valid = true;}

                    }
                }
            
            } else if (this.action[0] == "boost") {
                this.action_valid = true;

            } else if (this.action[0] == "flower") {
                if (!this.hovered_tile.flowername && !this.hovered_tile.deconame) {this.action_valid = true;}
                
            } else if (this.action[0] == "building") {
                if (this.buildable_tiles[this.action[1]].some(t=>t.q == q && t.r == r)) {this.action_valid = true;}
                
            } else if (this.action[0] == "deco") {
                if (!this.hovered_tile.flowername && !this.hovered_tile.deconame) {this.action_valid = true;}

            }

        } else if (this.action[0] == "expand") {
            if (this.expandable_tiles.some(t=>t.q == q && t.r == r)) {
                this.action_valid = true;
                this.hovered_tile = {q: q, r: r};
            } 
        }
                    
            // remove any hovering animations
            let i = this.view.running_animations.findIndex(a => a.type == "highlight-tile");
            if (i>-1) {this.view.running_animations.splice(i, 1);}
            
            let highlight_type = "highlight";
            let highlight_color = "white";
            let opacity = 0.5;
            let scale = 1;

            if (!this.action_valid) {
                highlight_color = "red";
            } 
            if (this.action[0] == "building") {
                highlight_type = "building-hl";
                scale = 3
            }
            this.view.running_animations.push({type: "highlight-tile", q: q, r: r, image_name: highlight_type+"-"+highlight_color, opacity: opacity, scale: scale});
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
        if (top < document.getElementById("boost-header").offsetTop) {
            document.getElementById("tool-radio").checked = true;
        } else if (top < document.getElementById("flower-header").offsetTop) {
            document.getElementById("boost-radio").checked = true;
        } else if (top < document.getElementById("building-header").offsetTop) {
            document.getElementById("flower-radio").checked = true;
        } else {
            document.getElementById("building-radio").checked = true;
        }
    }

    contentHover(evt) {
        if (evt.type == "mouseenter") {
            this.shop_info.innerHTML = this.item_infos[evt.currentTarget.dataset.action+"-info"].innerHTML;
            let item_rect = evt.currentTarget.getBoundingClientRect();
            this.shop_info.style.setProperty("--pos", (item_rect.top + item_rect.height/2).toString()+"px");
            this.shop_info.classList.remove("hidden");
        } else if (evt.type == "mouseleave") {
            this.shop_info.classList.add("hidden");
        }
    }

    iconHover(evt) {
        if (evt.type == "mouseenter") {
            this.icon_hover_action = evt.currentTarget.dataset.action.split("-");
            this.view.renderHighlight(this.icon_hover_action, this.view.hover_hl_render_ctx);
            this.view.displayRenderedMap(this.view.ctx_list[2], this.view.hover_hl_render_cvs);
        } else if (evt.type == "mouseleave") {
            this.icon_hover_action = undefined;
            this.view.displayRenderedMap(this.view.ctx_list[2], this.view.active_hl_render_cvs);
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

    setAction = (evt) => {
        // to can be "shelf-something" or "flower-plant-something" or "boost-something"
    
        for (let el of document.getElementsByClassName("active-item")) {
            // only one
            el.classList.remove("active-item");
        }
        this.action = evt.currentTarget.dataset.action.split("-");
        //this.ui_cvs.style = "--cursorloc: url(images/cursors/"+to+".png);"
        evt.currentTarget.classList.add("active-item");
        this.view.renderHighlight(this.action, this.view.active_hl_render_ctx);
        this.view.displayRenderedMap(this.view.ctx_list[2], this.view.active_hl_render_cvs);
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
                // update boosts (remove expired)

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


const randomDecision = () => {

}


const changeSeason = (to_season) => {
    changeBackdrop(to_season);
    // update overall probabilities...and stuff
}



const getSeasonParams = () => {
    return undefined
}

window.onload = () => {
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';

    // get element objects
    let control = new Control([STATIC_DATA, game_data]);

    control.gameLoop(0);
    control.view.animationLoop(0);
}


window.onbeforeunload = () => {

}