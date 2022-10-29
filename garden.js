let session_data = {
    starttime: undefined,
    endtime: undefined,
    current_season: 1,
    flower_predraws: []
}

for (let img of document.getElementsByClassName("shelf-flower-img")) {
    const cvs = document.createElement("canvas");
    cvs.height = cvs.width = tile_size;
    const ctx = cvs.getContext("2d");
    ctx.drawImage(document.getElementsByClassName("earth-img")[0]);
    ctx.drawImage(img);
    flower_predraws[img.id] = cvs;
}


let animation_data, transform_data, frame_data;


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
    const res = 500
    ctx = ctx_list[0] // backdrop context
    let img = document.getElementById("backdrop-season-"+session_data.current_season);
    console.log(img);
    
    let x_num = Math.ceil((frame_data.corners[2] - frame_data.corners[0]) / res) + 1;
    let y_num = Math.ceil((frame_data.corners[3] - frame_data.corners[1]) / res) + 1;
    console.log(x_num, y_num);

    let x_offset = Math.floor(frame_data.corners[0] / res);
    let y_offset = Math.floor(frame_data.corners[1] / res);
    if (x_num * y_num < 200) {
    for (let i = 0; i < x_num; i++) {
        for (let j = 0; j < y_num; j++) {
          ctx.drawImage(img, (i + x_offset) * res, (j + y_offset) * res);
        }
      }
    }
}

const tile_size = 50; 
const flower_size = 30;
const vert_dist = 50;
const horz_dist = 60;
let topleft;
const drawScene = (tiles=undefined) => {
    // full redraw of game_data["tiles"]
    ctx = ctx_list[1] // scene context
    if (!tiles) {
        ctx.clearRect(...frame_data.corners);
    }
    for (let tile of tiles || game_data.tiles) {
        topleft = [-tilesize/2 + tile.locx * horz_dist, -tilesize/2 + tile.locy * vert_dist];
        if (tiles) {
            ctx.clearRect(...topleft, ...topleft.map(v=>v+tile_size));
        }
        ctx.drawImage(flower_tiles[tile.flower], ...topleft);

    }
}

const animationLoop = (timestamp) => {
    // draw all current animations
    ctx = ctx_list[2] // animations context
    ctx.clearRect(...frame_data.corners);


    window.requestAnimationFrame(animationLoop);
}


let elapsed_time, elapsed_years, elapsed_seasons, year_percentage, prevTimestamp;

const ms_per_season = 120000;  // 2 mins per season
const ms_per_year = ms_per_season*4;
const game_updates_per_season = 100;
const ms_per_update = ms_per_season / game_updates_per_season;


let curr_gtime, prev_gtime, next_update_time;
const gameLoop = (timestamp) => {
    // check if update needed
    curr_gtime = timestamp - session_data.starttime + game_data.elapsedtime;
    next_update_time = Math.ceil(prev_gtime / ms_per_update) * ms_per_update;
    if (prev_gtime < next_update_time && next_update_time <= curr_gtime) {
        // update season bar
        year_percentage = (curr_gtime % ms_per_year)/ms_per_year*100;
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
        session_data.current_season = elapsed_seasons % 4;

    prev_gtime = curr_gtime;
    window.requestAnimationFrame(gameLoop);
}

const updateTransform = () => {
    console.log("transform");
    for (let ctx of ctx_list) {
        ctx.resetTransform();
        ctx.translate(transform_data.x, transform_data.y);
        ctx.scale(transform_data.scale, transform_data.scale);

        frame_data.corners = [-transform_data.x/transform_data.scale,
            -transform_data.y/transform_data.scale,
            (frame_data.width - transform_data.x)/transform_data.scale,
            (frame_data.height - transform_data.y)/transform_data.scale
        ]
    }
    console.log(transform_data);
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
        i.classList.toggle("affordable", (parseFloat(i.querySelector("div").innerHTML)<game_data.money&&!i.classList.contains("affordable"))||
                                         (parseFloat(i.querySelector("div").innerHTML)>game_data.money&&i.classList.contains("affordable")))
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

    animation_data = [
        //{starttime: undefined, type: undefined, x: undefined, y: undefined, color: undefined}
    ]
    
    transform_data = {x: parseInt(window.getComputedStyle(canvas_cont).width)/2,
        y: parseInt(window.getComputedStyle(canvas_cont).height)/2,
        scale: 1,
    };
    
    frame_data = {
        width: window.getComputedStyle(canvas_cont).width,
        height: window.getComputedStyle(canvas_cont).height,
        corners: []
    }

    let dragStart, prevPoint;
    ui_cvs.onmousedown = (evt) => {dragStart=true; prevPoint={x: evt.offsetX, y: evt.offsetY}};
    ui_cvs.onmousemove = (evt) => {
        if (dragStart){
            transform_data.x += evt.offsetX - prevPoint.x;
            transform_data.y += evt.offsetY - prevPoint.y;
            prevPoint={x: evt.offsetX, y: evt.offsetY};
            updateTransform();
        } else {

        }
    };
    ui_cvs.onmouseup = () => {dragStart = false;};

    ui_cvs.onwheel = (evt) => {
        d = -evt.deltaY * 10;
        let factor = Math.pow(1.001, d);
        transform_data.x += (evt.offsetX - transform_data.x) * (1-factor);
        transform_data.y += (evt.offsetY - transform_data.y) * (1-factor);
        transform_data.scale *= factor;
        updateTransform();
    };

    setCanvasSize();
    updateMoney(0);
    //buildFromDatabase();
    buildScene();

    updateTransform();

    window.requestAnimationFrame((stmp) => {session_data.starttime = stmp;});
    window.requestAnimationFrame(gameLoop);
    window.requestAnimationFrame(animationLoop);
}

window.onresize = () => {
    setCanvasSize();
}

window.onbeforeunload = () => {

}