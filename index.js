document.getElementById("chooser").onmouseenter = (evt) => {
    evt.currentTarget.classList.add("open");
}
document.getElementById("chooser").onmouseleave = (evt) => {
    evt.currentTarget.classList.remove("open");
}

for (let i of document.querySelectorAll("label")) {
    i.onclick = (evt) => {
        evt.currentTarget.parentElement.classList.remove("open");
        evt.currentTarget.parentElement.scrollTo({top: evt.currentTarget.getBoundingClientRect().top, behavior: 'instant'});
        console.log(evt.currentTarget.getBoundingClientRect().top);
    }
}