let data = {
    "gamestates": [],
    "elapsed_time": 100000,
}

let global = {
    "session_starttime": undefined,
    "session_endtime": undefined,
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
    document.getElementById('ctrl-pane').scroll({
        top: el.offsetTop-50, 
        left: 0, 
        behavior: 'smooth'
      });
}

const alterRadios = () => {
    const scroll_elem = document.getElementById("ctrl-pane");
    const top = scroll_elem.scrollTop+150;
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


let marker, elapsed_time, elapsed_years, elapsed_seasons, current_season, year_percentage, prevTimestamp = data.starttime;
const ms_per_year = 120000*4;  // 2 mins per season
const updateSeasonBar = (timestamp) => {
    if (!global.session_starttime) {
        global.session_starttime = timestamp;
        prevTimestamp = timestamp;
        }
    if (!marker) {
        marker = document.getElementById("season-marker");
    }

    if (timestamp-prevTimestamp > 500) {
        elapsed_time = timestamp - global.session_starttime + data.elapsed_time;
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

window.onload = () => {
    window.onload = setCanvasSize();
    window.requestAnimationFrame(updateSeasonBar);
}

window.onresize = () => {
    window.onresize = setCanvasSize();
}

window.onbeforeunload = () => {

}