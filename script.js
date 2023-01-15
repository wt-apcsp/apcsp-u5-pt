let ctx;
let width;
let height;

let barWidth = 9; // px width of each bar
const barBorder = 1;
const pxReservedFromTop = 30; // px reserved from the top

let arr;
let n;

window.onload = () => {
    const canvas = document.getElementById("canvas");

    // set canvas to client's dimensions
    width = document.body.clientWidth;
    height = document.body.clientHeight
    canvas.width = width;
    canvas.height = height;

    // check for brower's canvas support
    // source: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_usage#checking_for_support
    ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.fillStyle = "#FFF";
        // ctx.fillRect(0,canvas.height-100,5,100);
        // ctx.fillRect(6,canvas.height-200,5,200);
        // drawing code here
    } else {
        // canvas-unsupported code here
    }

    // set max for blockSize
    let maxBlockSize = (width / 3)-3;
    document.getElementById("blockSizeRange").max = maxBlockSize;
    document.getElementById("blockSizeRange").value = barWidth;
}

function drawBars() {
    for(let i=0;i<n;i++) {
        let h = arr[i];
        ctx.fillStyle = "#FFF";
        ctx.fillRect(i*(barWidth+barBorder), height-h,barWidth, h);
    }
}

function drawBar(i, color="#FFF") {
    // erase previous bar
    ctx.fillStyle = "#131313";
    ctx.clearRect(i*(barWidth+barBorder), 0, barWidth, height);

    // draw new bar
    ctx.fillStyle = color;
    ctx.fillRect(i*(barWidth+barBorder), height-arr[i],barWidth, arr[i]);
}

// util function to shuffle an array by repeated swapping every index
function shuffle(arr) {
    for(let i=0;i<arr.length;i++) {
        let j = Math.floor(Math.random()*arr.length);
        let temp = arr[j];
        arr[j] = arr[i];
        arr[i] = temp;
    }

    return arr;
}

function fadeTransition(elementId, opacity, delay) {
    setTimeout(() => document.getElementById(elementId).style.opacity = opacity, delay);
}

function updateBlockSize(value) {
    // update block size
    value = parseInt(value)
    document.getElementById("blockSizeValue").innerHTML = value;
    barWidth = value;
}

function start() {
    // prep array
    // array from y to (height-pxReservedFromTop)
    arr = [];
    n = Math.floor(width / (barWidth+barBorder));
    let diff = Math.floor((height-pxReservedFromTop) / (n+1));
    let y = height-pxReservedFromTop-(n*diff);
    for(let i=0;i<n;i++) {
        arr.push(y+diff*i);
    }
    arr = shuffle(arr);

    drawBars();

    // fade away main, and fade in canvas
    document.getElementById("main").style.opacity = "0";
    document.getElementById("overlay").style.opacity = "0.8";

    document.getElementById("header").innerHTML = "<h1>"+[...document.getElementById("algorithmSelect").children].find(x => x.name = document.getElementById("algorithmSelect").value).innerHTML + "</h1>";
    fadeTransition("header", 1, 1000);
    fadeTransition("canvas", 1, 1000);

    function countdown(i, callback) {
        if(i > 0) {
            document.getElementById("countdown").innerHTML = i;
            document.getElementById("countdown").style.opacity = "1";
            setTimeout(() => countdown(i-1, callback), 1000)
        } else {
            // document.getElementById("countdown").innerHTML = "GO";
            document.getElementById("countdown").style.opacity = "0";
            // done, run callback function
            callback()
        }
    }

    // do a 3 sec countdown
    setTimeout(() => countdown(3, () => {
        document.getElementById("overlay").remove();
        document.getElementById("header").remove();
        document.getElementById("info").style.opacity = "1";
        
        // time to simulate
        simulate(document.getElementById("algorithmSelect").value);
    }), 1000);
}

function simulate(algorithm) {
    let i = 0;
    let s = false;
    let h = arr.length;
    let int;

    let comparison = 0;
    let arrayAccesses = 0;

    function renderInfo() {
        document.getElementById("info").innerHTML = `${algorithm} - ${comparison} comparisons - ${arrayAccesses} array accesses`;
    }

    function incrementComparisons(i) {
        comparison += i;
        renderInfo();
    }

    function incrementArrayAccesses(i) {
        arrayAccesses += i;
        renderInfo();
    }

    function bubbleSort() {
        if(i == h) {
            drawBar(i, "#FFF");
            if(!s) {
                done = true;
                clearInterval(int);
                i = 1;
                int = setInterval(completion, 10);
            }
            h--;
            i = 0;
            s = false;
        }

        // compare i to i+1
        incrementComparisons(1);
        incrementArrayAccesses(2)
        if(arr[i] > arr[i+1]) {
            s = true;
            // swap
            let temp = arr[i+1];
            arr[i+1] = arr[i];
            arr[i] = temp;

            incrementArrayAccesses(3);

            // rerender the bars
            drawBar(i+1, "#FF170D");
            playSingleFrequency(200+arr[i]*2, 'sine', 0.05);
        }
        drawBar(i, "#FFF");
        i++;
    }

    function completion() {
        if(i != arr.length) {
            drawBar(i-1, "#00D600");
            drawBar(i, "#FF170D");
            playSingleFrequency(200+arr[i]*2, 'sine', 0.05);
            i++;
        } else {
            clearInterval(int);
        }
    }
        
    if (algorithm === "bubble") {
        // BUBBLE SORT
        int = setInterval(bubbleSort,10);
    }


}