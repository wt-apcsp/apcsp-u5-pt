let ctx;
let width;
let height;

let barWidth = 9; // px width of each bar
const barBorder = 1;
const pxReservedFromTop = 30; // px reserved from the top
let timeDelay = 1; // 10ms
let volume = 0.1;

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
    valueStr = ("&nbsp;".repeat(3-value.toString().length))+value; // shift the number so that the bar won't move
    document.getElementById("blockSizeValue").innerHTML = valueStr;
    barWidth = value;
}

function updateVolume(value) {
    value = parseInt(value);
    volume = value/100;
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
    document.getElementById("header").innerHTML = "<h1>"+[...document.getElementById("algorithmSelect").children].find(x => x.value == document.getElementById("algorithmSelect").value).innerHTML + "</h1>";
    document.getElementById("main").style.opacity = "0";
    document.getElementById("overlay").style.opacity = "0.8";

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

// Algorithm: a general abstract class that will be the base/parent of the actual algorithms
class Algorithm {
    name = ""; // algorithm name

    constructor(arr) {
        this.arr = arr;
        this.comparisons = 0; // No. of comparisons (if statements)
        this.arrayAccesses = 0; // No. of array accesses (eg. arr[i] or arr[i+1])
        // this.interval = setInterval(this.next); // Store the interval that repeatedly runs the next() function, needed to pause it later in renderComplete
    }

    start() {
        this.renderInfo();
        this.interval = setInterval(this.next, timeDelay);
    }

    renderInfo() {
        document.getElementById("info").innerHTML = `${this.name} - ${this.comparisons} comparisons - ${this.arrayAccesses} array accesses`;
    }
    

    incrementComparisons(i) {
        this.comparisons += i;
        this.renderInfo();
    }

    incrementArrayAccesses(i) {
        this.arrayAccesses += i;
        this.renderInfo();
    }

    drawBar(i, color="#FFF") {
        // erase previous bar
        ctx.fillStyle = "#131313";
        ctx.clearRect(i*(barWidth+barBorder), 0, barWidth, height);
    
        // draw new bar
        ctx.fillStyle = color;
        ctx.fillRect(i*(barWidth+barBorder), height-this.arr[i], barWidth, this.arr[i]);
    }

    playSound(i) {
        playSingleFrequency(200+this.arr[i]*2, 'sine', 0.005, volume);
    }

    renderComplete() {
        // stops the interval
        clearInterval(this.interval);

        // render completed animation, green from left to right
        let completionInt;
        let i = 1;

        let completion = () => {
            if(i != this.arr.length) {
                this.drawBar(i-1, "#00D600");
                this.drawBar(i, "#FF170D");
                this.playSound(i);
                i++;
            } else {
                clearInterval(completionInt);
            }
        }
        
        completionInt = setInterval(completion, timeDelay); // this cannot be used inside a callback func for setInterval, so we just pass in the array
    }

    next() {
        // a function called every interval

    }
}

class BubbleSort extends Algorithm {
    name = "bubble sort";
    i = 0;
    s = false;
    h = arr.length;

    constructor(arr) {
        super(arr);
    }

    next = () => {
        if(this.i == this.h) {
            this.drawBar(this.i, "#FFF");
            if(!this.s) {
                this.renderComplete();
            }
            this.h--;
            this.i = 0;
            this.s = false;
        }

        // compare i to i+1
        this.incrementComparisons(1);
        this.incrementArrayAccesses(2)
        if(this.arr[this.i] > this.arr[this.i+1]) {
            this.s = true;
            // swap
            let temp = this.arr[this.i+1];
            this.arr[this.i+1] = this.arr[this.i];
            this.arr[this.i] = temp;

            this.incrementArrayAccesses(3);

            // rerender the bars
            this.drawBar(this.i+1, "#FF170D");
            this.playSound(i);
        }
        this.drawBar(this.i, "#FFF");
        this.i++;
    }
}


class SelectionSort extends Algorithm {
    name = "selection sort";
    i = 0; // start index of the unsorted array
    j = 0; // pointer for searching in min value in the unsorted array
    k = 0; // index of min
    min;

    constructor(arr) {
        super(arr);
    }

    next = () => {
        // TODO: MAKE THIS BETTERRR, AND FIX IT

        if (this.i != this.arr.length+1) {
            if (this.i != this.j) {
                this.drawBar(this.j-1);
                this.drawBar(this.j, "#FF170D");
            }

            if(!this.min || this.arr[this.j] < this.min) {

                this.min = arr[this.j];
                this.k = this.j;
            }

            if (this.j == this.arr.length) {
                // found the minimum, move from index k to i
                let e = this.arr[this.k];
                this.arr.splice(this.k, 1); // delete
                this.arr.splice(this.i, 0, e) // add to index i

                // draw
                for(let l=0;l<this.arr.length;l++) {
                    this.drawBar(l);
                }
                this.drawBar(this.i, "#00D600");

                this.i++;
                this.j = this.i; // set j to i
                this.min = 0;
                this.k;
            }
            this.j++;
        } else {
            this.renderComplete();
        }
    }
}


class BogoSort extends Algorithm {
    name = "bogo sort";

    constructor(arr) {
        super(arr);
    }

    next = () => {
        // check if the array is sorted

        let s = true;

        // check the permutation
        for(let i=0;i<arr.length-1;i++) {
            if(arr[i] > arr[i+1]) {
                // unsorted
                this.drawBar(i, "#FF170D");
                s = false;
                break;
            }
        }

        if (s == true) {
            this.renderComplete();
            return;
        }

        // if not shuffle again, generate a random permuation of the array
        this.arr = shuffle(this.arr)
        for(let i=0;i<this.arr.length;i++) {
            this.drawBar(i);
        }
    }
}

class MergeSort extends Algorithm {
    name = "merge sort"

    constructor(arr) {
        super(arr);
    }

    next = () => {
        
    }
}

function simulate(algorithm) {
    let algo;

    switch(algorithm) {
        case "bubble": algo = new BubbleSort(arr); break;
        case "bogo": algo = new BogoSort(arr); break;
        case "selection": algo = new SelectionSort(arr); break;
    }

    algo.start();
}