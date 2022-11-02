// STATIC_DATA, game_data

let sess = {
    frame_rect: undefined,
    cvs_width: undefined,
    cvs_height: undefined,

    transform_x: 0,
    transform_y: 0,
    transform_scale: 1,

    items_highlight_tiles: {},
    cvs_images: [],
    running_animations: [], //{starttime: undefined, type: undefined, x: undefined, y: undefined, color: undefined}


    dragging: false,
    current_action: "lens",
    hovered_tile: undefined,
    current_season: 1,

    vert_tile_dist: 50,
    horz_tile_dist: 60,
    tile_size: 30,  // not bigger than vert_tile_dist
}

const buildItemsHoverTiles = () => {
    // create array for every shop item, populate if possible
    sess.items_highlight_tiles["lens"] = [];
    sess.items_highlight_tiles["spade"] = [];
    sess.items_highlight_tiles["sickle"] = [];
    sess.items_highlight_tiles["seedcollector"] = game_data.seeds_collected || [];

    for (let building of STATIC_DATA.buildings) {
        sess.items_highlight_tiles[building.name] = [];
        for (let built of game_data.builts) {
            if (built.name == building.name) {
                sess.items_highlight_tiles[building.name].push([built.locx, built.locy]);
            }
        }
    }

    for (let sect of ["boosters", "flowers"]) {
        for (let item of STATIC_DATA[sect]) {
            sess.items_highlight_tiles[item.name] = [];
            for (let tile of game_data.tiles) {
                if (tile.boosters.includes(item.name) || tile.flower == item.name) {
                    sess.items_highlight_tiles[item.name].push([tile.locx, tile.locy]);
                }
            }
        }
    }
}

const gatherCvsImages = () => {
    for (let flower of STATIC_DATA.flowers) {
        sess.cvs_images[flower.name] = document.getElementById("shelf-"+flower.name+"-img");
    }
}


let transform_data;


const setCanvasSize = () => {
    const cont_style = window.getComputedStyle(canvas_cont);
    sess.cvs_width = parseInt(cont_style.width);
    sess.cvs_height = parseInt(cont_style.height);
    for (var cvs of cvs_list) {
        cvs.width = sess.cvs_width;
        cvs.height = sess.cvs_height;
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
    } else {
        document.getElementById("buildings-radio").checked = true;
    }
}

const skipToSeason = (evt) => {
    const skipped_time = undefined;
}


const updateDatabase = (table_name, data=[], drop=false) => {
    fetch('/localhost/sqlgarden/update.php', {
        method: 'POST',
        headers: {ContentType: 'application/json'},
        body: JSON.stringify({
            table_name: table_name,
            data: data,
            drop: drop
            })
        }
    )
    .then(response => response.json())
    .then(responseData => {console.log(responseData)});
}


const addBuildingBoosters = () => {

}

const randomDecision = () => {

}

const buildScene = () => {

    
}

const changeSeason = (to_season) => {
    changeBackdrop(to_season);
    // update overall probabilities...and stuff
}

const drawBackdrop = () => {
    // full redraw of backdrop
    const res = 500 // backdrop 500x500
    ctx = ctx_list[0] // backdrop context
    let img = document.getElementById("backdrop-season-"+sess.current_season);
    console.log(img);
    
    let x_num = Math.ceil((sess.frame_rect[2]) / res) + 1;
    let y_num = Math.ceil((sess.frame_rect[3]) / res) + 1;
    console.log(x_num, y_num);

    let x_offset = Math.floor(sess.frame_rect[0] / res);
    let y_offset = Math.floor(sess.frame_rect[1] / res);
    if (x_num * y_num < 200) {
    for (let i = 0; i < x_num; i++) {
        for (let j = 0; j < y_num; j++) {
          ctx.drawImage(img, (i + x_offset) * res, (j + y_offset) * res);
        }
      }
    }
}

let topleft;
const drawScene = (tiles=undefined) => {
    // full redraw of game_data["tiles"]
    ctx = ctx_list[1] // scene context
    if (!tiles) {
        ctx.clearRect(...sess.frame_rect);
    }
    for (let tile of tiles || game_data.tiles) {
        topleft = [-sess.tile_size/2 + tile.locx * sess.horz_tile_dist + (tile.locy%2)*(sess.horz_tile_dist/2), -sess.tile_size/2 + tile.locy * sess.vert_tile_dist];
        if (tiles) {
            ctx.clearRect(...topleft, ...topleft.map(v=>v+tile_size));
        }
        ctx.drawImage(sess.cvs_images[tile.flower], ...topleft);

    }
}

const animationLoop = (timestamp) => {
    // draw all current animations
    ctx = ctx_list[2] // animations context
    ctx.clearRect(...sess.frame_rect);
    
    for (let a of sess.running_animations) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        switch (a.type) {
            case "item-highlight":
                ctx.arc(a.x * sess.horz_tile_dist + (a.y%2)*(sess.horz_tile_dist/2), a.y * sess.vert_tile_dist, sess.tile_size/2, 0, 2 * Math.PI);
                break;
            case "tile-hover":
                ctx.arc(a.x * sess.horz_tile_dist + (a.y%2)*(sess.horz_tile_dist/2), a.y * sess.vert_tile_dist, sess.tile_size/2, 0, 2 * Math.PI);
                break;
            case "building-hover":
                ctx.arc(a.x * sess.horz_tile_dist + (a.y%2)*(sess.horz_tile_dist/2), a.y * sess.vert_tile_dist, sess.tile_size/2*3, 0, 2 * Math.PI);
                break;
        }
        ctx.fill();
    }
    

    window.requestAnimationFrame(animationLoop);
}


let elapsed_time, elapsed_years, elapsed_seasons, year_percentage, prevTimestamp;

const ms_per_season = 120000;  // 2 mins per season
const ms_per_year = ms_per_season*4;
const game_updates_per_season = 100;
const ms_per_update = ms_per_season / game_updates_per_season;

const getSeasonParams = () => {
    return undefined
}

let curr_gtime, prev_gtime, next_update_time;
const gameLoop = (timestamp) => {
    // check if update needed
    curr_gtime = timestamp + game_data.elapsedtime;
    next_update_time = Math.ceil(prev_gtime / ms_per_update) * ms_per_update;
    if (prev_gtime < next_update_time && next_update_time <= curr_gtime) {
        // update season bar
        year_percentage = (curr_gtime % ms_per_year)*100/ms_per_year;
        marker.style.left = year_percentage.toString()+"%";

        // get global season parameters
        let season_params = getSeasonParams();

        let updated, updated_tiles;
        for (let tile of game_data.tiles) {
            updated = false;
            
            // update boosters (remove expired)

            // llalalalalalal: wakeupprob
            // check for flower
            if (tile.flower) {
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
            if (updated) {
                updated_tiles.push(tile)
            }
        }
        drawScene(updated_tiles);
    }
        
        elapsed_years = Math.floor(elapsed_time / ms_per_year);
        elapsed_seasons = Math.floor(elapsed_time / (ms_per_year/4));
        //sess.current_season = elapsed_seasons % 4;

    prev_gtime = curr_gtime;
    window.requestAnimationFrame(gameLoop);
}

const updateTransform = () => {
    console.log("transform");
    for (let ctx of ctx_list) {
        ctx.resetTransform();
        ctx.translate(sess.transform_x, sess.transform_y);
        ctx.scale(sess.transform_scale, sess.transform_scale);

        sess.frame_rect = [- sess.transform_x/sess.transform_scale,
            - sess.transform_y/sess.transform_scale,
            sess.cvs_width/sess.transform_scale,
            sess.cvs_height/sess.transform_scale
        ]
    }
    drawBackdrop();
    drawScene();
    // animations redraw themselves
}

const updateMoney = (amount) => {
    game_data.money += amount;
    document.getElementById("money-display").innerHTML = game_data.money;
    // update state of shop items
    let items = document.getElementsByClassName("buy-btn")

    for (let i of items) {
        i.classList.toggle("affordable", (parseFloat(i.querySelector("div").innerHTML)<=game_data.money&&!i.classList.contains("affordable"))||
                                         (parseFloat(i.querySelector("div").innerHTML)>game_data.money&&i.classList.contains("affordable")))
    }
}

const handleMouseClick = (evt) => {
    if (sess.hovered_tile) {
        // handle clicks on tiles regarding current action
        switch (sess.current_action) {
            case "lens":
                // fill popup with data
                document.getElementById("tile-info").classList.add("opened")

                // open popup

                break;
            case "spade":
                break;
        }

    }
}

const handleMouseMove = (evt) => {
    if (sess.dragging){
        // handle drag
        sess.transform_x += evt.offsetX - prevPoint.x;
        sess.transform_y += evt.offsetY - prevPoint.y;
        prevPoint={x: evt.offsetX, y: evt.offsetY};
        updateTransform();
    } else {
        // handle hover effects
        let cursor_on_cvs = {x: evt.offsetX/sess.transform_scale-sess.transform_x,
                       y: evt.offsetY/sess.transform_scale-sess.transform_y};

        let next_on_tg = {}; // tg = tile-grid

        next_on_tg.y = Math.round(cursor_on_cvs.y/sess.vert_tile_dist);
        next_on_tg.x = Math.round(cursor_on_cvs.x/sess.horz_tile_dist - (next_on_tg.y%2)*(sess.horz_tile_dist/2));
        
        let next_on_cvs = {x: next_on_tg.x*sess.horz_tile_dist + (next_on_tg.y%2)*(sess.horz_tile_dist/2),
                           y: next_on_tg.y*sess.vert_tile_dist};
        // Math.pow(next_on_cvs.x-cursor_on_cvs.x, 2) + Math.pow(next_on_cvs.y-cursor_on_cvs.y, 2) <= Math.pow(sess.tile_size/2, 2)
        // if hovering a tile
        sess.hovered_tile = game_data.tiles.find(t => t.locx == next_on_tg.x && t.locy == next_on_tg.y);
        let hover_type = undefined;
        if (sess.hovered_tile) {
            // set hover effect based on current action
            // tools + flowers
            if (!sess.items_highlight_tiles[sess.current_action].find(loc => loc.x == next_on_tg.x && loc.y == next_on_tg.y)) {
                if (sess.current_action.includes("flower") || sess.current_action.includes("shelf")) {
                    if (!sess.tiles.find(t => t.locx == next_on_tg.x && t.locy == next_on_tg.y).flower) {
                        hover_type = "tile-hover";
                    } 
                } else if (sess.current_action.includes("booster")) {
                    hover_type = "tile-hover";
                } else if (sess.current_action.includes("building")) {
                    hover_type = "building-hover";
                } else if (sess.current_action.includes("sickle")) {
                    hover_type = "tile-hover";
                } else if (sess.current_action.includes("seedcoll")) {
                    hover_type = "tile-hover";
                }

            } else if (sess.current_action.includes("spade")) {
                // hovering the diggable tiles
                hover_type = "tile-hover";
            }

            
            // remove any hovering animations
            if (sess.running_animations.findIndex(a => a.type.includes("tile-hover"))>-1) {
                if (!hover_type) {
                    sess.running_animations.splice(i, 1);
                    sess.hovered_tile = undefined;
                }                
            } else {
                if (hover_type) {
                    sess.running_animations.push({starttime: undefined, type: hover_type, x: next_on_cvs.x, y: next_on_cvs.y, color: "white"});
                } 
            }
        }
    }
}

const toggleItemHighlights = (item_name) => {
    if (item_name) {
        for (let loc of sess.items_highlight_tiles[item_name]) {
            sess.running_animations.push({starttime: undefined, type: "item-highlight", x: loc[0], y: loc[1], color: "white"})
        }
    } else {
        // remove all highlight animations
        sess.running_animations = sess.running_animations.filter(a=>!a.type.includes("item-highlight"));
    }
}

const changeCurrentActionTo = (to) => {
    // to be "shelf-something" or "flower-something" or "booster-something"
    if (!sess.current_action == "inspect") {
        for (let el of document.getElementsByClassName("active-item")) {
            el.classList.remove("active-item");
        }
    }

    sess.current_action == to;
    ui_cvs.style = "--cursorloc: url(images/cursors/"+to+".png);"

    if (!to == "inspect") {
        for (let el of document.getElementsById(to+"-item")) {
            el.classList.add("active-item");
        }
    }
}

// declare element objects globally
let canvas_cont, marker, shop_pane, ui_cvs, cvs_list;
let ctx_list = [];
window.onload = () => {
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';

    // get element objects
    canvas_cont = document.getElementById("canvas-container");
    marker = document.getElementById("season-marker");
    shop = document.getElementById("shop");
    ui_cvs = document.getElementById("ui-cvs");
    cvs_list = document.getElementsByTagName("canvas");
    for (let cvs of cvs_list) {
        ctx_list.push(cvs.getContext("2d"));
    }
    
    sess.transform_x =  parseInt(window.getComputedStyle(canvas_cont).width)/2;
    sess.transform_y =  parseInt(window.getComputedStyle(canvas_cont).height)/2;
    sess.transform_scale =  1;

    ui_cvs.onmousedown = (evt) => {sess.dragging=true; prevPoint={x: evt.offsetX, y: evt.offsetY}};
    ui_cvs.onmousemove = handleMouseMove;
    ui_cvs.onmouseup = () => {sess.dragging = false;};

    ui_cvs.onwheel = (evt) => {
        d = -evt.deltaY * 10;
        let factor = Math.pow(1.001, d);
        sess.transform_scale = Math.max(0.2, Math.min(factor * sess.transform_scale, 3));
        if (sess.transform_scale < 3 && sess.transform_scale > 0.2) {
            sess.transform_x += (evt.offsetX - sess.transform_x) * (1-factor);
            sess.transform_y += (evt.offsetY - sess.transform_y) * (1-factor);
            updateTransform();
        }
    };
    document.body.onkeyup = (evt) => {
        if (evt.key === "Escape") {
            // change current action to inspect
            changeCurrentActionTo("inspect");
        }
    }
    buildItemsHoverTiles();
    gatherCvsImages();

    setCanvasSize();
    updateMoney(0);
    //buildFromDatabase();
    buildScene();

    updateTransform();

    window.requestAnimationFrame(gameLoop);
    window.requestAnimationFrame(animationLoop);
}

window.onresize = () => {
    setCanvasSize();
}

window.onbeforeunload = () => {

}