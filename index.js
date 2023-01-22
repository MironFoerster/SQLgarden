
const input = document.getElementById("gamename-input");
const submit = document.getElementById("submit-choice");
const chooser = document.getElementById("chooser");
const hover = document.getElementById("choose-hover");
hover.onmouseenter = (evt) => {
    chooser.classList.add("open");
}
hover.onmouseleave = (evt) => {
    chooser.classList.remove("open");
}



for (let i of document.querySelectorAll("input[type=radio]")) {
    i.onchange = (evt) => {
        evt.currentTarget.parentElement.classList.remove("open");
        hover.style.gridRow = "1";
        
        if (!(evt.currentTarget.value == "new-game")) {
            input.value = evt.currentTarget.value;
            input.setAttribute("readonly", "true");
            input.placeholder = "Choose Game...";
            input.classList.remove("invalid");
            submit.disabled = false;
        } else {
            input.value = "";
            input.removeAttribute("readonly");
            input.placeholder = "Enter Name...";
            input.focus();
        }
    }
}


const choices = document.getElementsByName("gamechoice");

input.oninput = (evt) => {
    let invalid = false;
    evt.currentTarget.value = evt.currentTarget.value.toUpperCase();
    // check if input is equal to existing choice
    for (let choice of choices) {
        if (evt.currentTarget.value == choice.value.toUpperCase()) {
            invalid = true;
        }
    }
    // check if input has anything but letters and space
    const re = /[^ A-Z0-9]/;
    if (re.test(evt.currentTarget.value) || evt.currentTarget.value == "") {
        invalid = true;
    }

    if (invalid) {
        console.log("invalid");
        evt.currentTarget.classList.add("invalid");
        submit.disabled = true;
    } else {
        console.log("valid");
        evt.currentTarget.classList.remove("invalid");
        submit.disabled = false;
    }
}