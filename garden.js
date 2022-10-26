const STATIC_DATA = {
    "tools":[], "boosters":[], "flowers":[], "buildings":[],

}
let game_data = {
    "gamestates": [],
    "elapsed_time": 100000,
    "tiles": [],
    "current_season": 2,
    "awards": [],
    "shelf": [],
}

let session_data = {
    "starttime": undefined,
    "endtime": undefined,
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
        header.className = "shop-header";
        shop.appendChild(header);
        let items = (h == "awards") ? game_data["awards"] : STATIC_DATA[h];
        for (let i of items) {
            let image = document.createElement("img");
            image.src = "./images/shop/" + i["name"] + ".png";

            let title = document.createElement("div");
            title.className = "item-title";
            title.innerHTML(i["name"]);

            let desc = document.createElement("div");
            desc.className = "item-desc";
            desc.innerHTML(i["description"]);

            let price = document.createElement("div");
            price.className = "item-price";
            price.innerHTML(i["price"]);

            let item = document.createElement("div");
            item.id = i["name"] + "-" + h + "-item";
            item.className = "shop-item";
            item.appendChild(title);
            item.appendChild(desc);
            item.appendChild(price);

            shop.appendChild(item);
        }
    }
    
}
const buildShelf = () => {
   for (let i of game_data.shelf) {
        let image = document.createElement("img");
        image.src = "./images/items/" + i["name"] + ".png";

        let title = document.createElement("div");
        title.className = "item-title";
        title.innerHTML(i["name"]);

        let desc = document.createElement("div");
        desc.className = "item-desc";
        desc.innerHTML(i["description"]);

        let price = document.createElement("div");
        price.className = "item-count";
        price.innerHTML(i["count"]);

        let item = document.createElement("div");
        item.id = i["name"] + "-shelf-item";
        item.className = "shop-item";
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
    ctx = ctx_list[0] // backdrop context
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
    ctx = ctx_list[1] // scene context
    ctx.clearRect(
        ...frame_data.corners
    );

}

const animationLoop = () => {
    // draw all current animations
    ctx = ctx_list[2] // animations context
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
let canvas_cont, cursor_cross, cursor_img, marker, shop_pane, ui_cvs, cvs_list;
let ctx_list = [];
window.onload = () => {
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';

    // get element objects
    canvas_cont = document.getElementById("canvas-container");
    cursor_img = document.getElementById("cursor-img");
    cursor_cross = document.getElementById("cursor-cross");
    marker = document.getElementById("season-marker");
    shop = document.getElementById("shop");
    ui_cvs = document.getElementById("ui-cvs");
    cvs_list = document.getElementsByTagName("canvas");
    for (let cvs of cvs_list) {
        ctx_list.push(cvs.getContext("2d"));
    }

    animation_data = [
        //{"starttime": undefined, "type": undefined, "x": undefined, "y": undefined, "color": undefined}
    ]
    
    transform_data = {"x": window.getComputedStyle(canvas_cont).width/2,
        "y": window.getComputedStyle(canvas_cont).height/2,
        "scale": 1,
    };
    
    frame_data = {
        "width": window.getComputedStyle(canvas_cont).width,
        "height": window.getComputedStyle(canvas_cont).height,
        "corners": []
    }

    let dragStart, prevPoint;
    ui_cvs.onmousedown = (evt) => {dragStart=true; prevPoint={"x": evt.offsetX, "y": evt.offsetY}};
    ui_cvs.onmousemove = (evt) => {
        if (dragStart){
            transform_data.x += evt.offsetX - prevPoint.x;
            transform_data.y += evt.offsetY - prevPoint.y;
            updateTransform();
        }
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

    updateTransform();

    window.requestAnimationFrame(updateSeasonBar);
    window.requestAnimationFrame(animationLoop);
}

window.onresize = () => {
    setCanvasSize();
}

window.onbeforeunload = () => {

}