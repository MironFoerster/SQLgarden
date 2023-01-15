
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
        if (!(evt.currentTarget.value == "new-game")) {
            input.value = evt.currentTarget.value;
            input.readonly = true;
            input.placeholder = "Choose Game...";
        } else {
            input.value = "";
            input.readonly = false;
            input.placeholder = "Enter Name...";
            input.focus();
        }
    }
}


const choices = document.getElementsByName("gamechoice");

input.oninput = (evt) => {
    let invalid = false;
    // check if input is equal to existing choice
    for (let choice of choices) {
        if (evt.currentTarget.value == choice.value) {
            invalid = true;
        }
    }
    // check if input has anything but letters and space
    const re = /[^ A-Za-z]/;
    if (re.test(evt.currentTarget.value)) {
        invalid = true;
    }

    if (invalid) {
        console.log("invalid");
        evt.currentTarget.classList.add("invalid");
        submit.readonly = true;
    } else {
        console.log("valid");
        evt.currentTarget.classList.remove("invalid");
        submit.readonly = false;
    }
}