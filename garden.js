const STATIC_DATA = {

}
let game_data = {
    "gamestates": [],
    "elapsed_time": 100000,
}

let session_data = {
    "starttime": undefined,
    "endtime": undefined,
}

const setCanvasSize = () => {
    const cvs_list = document.getElementsByTagName("canvas");
    const cont = document.getElementById("canvas-container");
    const width = parseInt(window.getComputedStyle(cont).width);
    const height = parseInt(window.getComputedStyle(cont).height);
    console.log(width);
    for (var cvs of cvs_list) {
        cvs.width = width;
        cvs.height = height;
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

// declare element objects globally
let canvas_cont, cursor_cross, cursor_img, marker, shop_pane;
window.onload = () => {
    // get element objects
    canvas_cont = document.getElementById("canvas-container");
    cursor_img = document.getElementById("cursor-img");
    cursor_cross = document.getElementById("cursor-cross");
    marker = document.getElementById("season-marker");
    shop = document.getElementById("shop");



    setCanvasSize();

    buildFromDatabase();

    canvas_cont.onmousemove = updateCursor;


    window.requestAnimationFrame(updateSeasonBar);
}

window.onresize = () => {
    setCanvasSize();
}

window.onbeforeunload = () => {

}