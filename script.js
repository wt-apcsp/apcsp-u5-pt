/* 
BASIC GLOBAL VARIABLE SETTING
*/

// window variables
let ctx; // canvas context (CanvasRenderingContext2D)
let width; // initial client width
let height; // initial client height

// constant unchangable variables
const barBorder = 1;
const pxReservedFromTop = 30; // some px reserved on the top, so that we can display the metrics

// initial user adjustable variables
let timeDelay = 1; // delay between each step in milliseconds, default: 1ms
let barWidth = 9; // px width of each bar
let volume = 0.01; // algorithm sound volume

/*
!END! BASIC GLOBAL VARIABLE SETTING !END!
*/ 

window.onload = () => {

    // set up canvas
    const canvas = document.getElementById("canvas");

    // set canvas to client's dimensions
    width = document.body.clientWidth;
    height = document.body.clientHeight
    canvas.width = width;
    canvas.height = height;

    // check for brower's canvas support
    // source: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_usage#checking_for_support:~:text=its%20getContext()%20method.-,Checking%20for%20support,-The%20fallback%20content
    ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.fillStyle = "#FFF"; // set default color to white

    } else {
        // canvas-unsupported code here
        alert("Sorry, but your browser doesn't support javascript canvas.");
        window.close(); // close client's tab
    }

    // set max for blockSize
    let maxBlockSize = (width / 3)-3;
    document.getElementById("blockSizeRange").max = maxBlockSize; // set range max
    document.getElementById("blockSizeRange").value = barWidth; // set range to default value
}


/*
UTIL FUNCTIONS
*/

function shuffle(arr) {
    // shuffle(arr): shuffle an array `arr` by repeated swapping every item

    for(let i=0;i<arr.length;i++) {
        let j = Math.floor(Math.random()*arr.length); // generate random number between 0-arr.length

        // swap
        let temp = arr[j];
        arr[j] = arr[i];
        arr[i] = temp;
    }

    return arr;
}


function fadeDelayTransition(elementId, opacity, delay) {
    // fadeDelayTransition(elementId, opacity, delay): for a given `elementId`, set a delay for the fade transition, basically, after `delay` ms, set opacity of the element to `opacity`
    setTimeout(() => document.getElementById(elementId).style.opacity = opacity, delay);
}

/*
!END! UTIL FUNCTIONS !END!
*/

function drawAllBars(arr) {
    // drawAllBars(arr): draw the entire screen of bars, given an array `arr`'s  values are the height of each bar

    for(let i=0;i<arr.length;i++) {
        let h = arr[i]; // bar height
        ctx.fillStyle = "#FFF";
        ctx.fillRect(i*(barWidth+barBorder), height-h,barWidth, h); // x=0 and y=0 starts at the top left, so we need to subtract the bar height from the height of the canvas
    }
}

function updateBlockSize(value) {
    // updateBlockSize(value): update block size slider, called onclick and onchange

    value = parseInt(value)
    valueStr = ("&nbsp;".repeat(3-value.toString().length))+value; // shift the number so that the bar won't move
    document.getElementById("blockSizeValue").innerHTML = valueStr;
    barWidth = value; // modify the global variable `barWidth`
}

function updateSpeed(value) {
    // updateSpeed(value): update speed slider, called onclick and onchange

    value = parseInt(value)
    valueStr = ("&nbsp;".repeat(3-value.toString().length))+value; // shift the number so that the bar won't move
    document.getElementById("speedValue").innerHTML = valueStr;
    timeDelay = value; // modify the global variable `barWidth`
}

function updateVolume(value) {
    // updateVolume(value): set volume global variable, called from volume slider

    // user gesture is required to play audio (https://developers.google.com/web/updates/2017/09/autoplay-policy-changes)
    context.resume(); // so we need to resume() the AudioContext
    console.log(value);

    value = parseInt(value);
    volume = value/100;
}

let prepArray = {
    // functions to prepare the array

    random: (arr) => {
        // completely random permutation
        return shuffle(arr);
    },
    reverse: (arr) => {
        // reverse order
        arr.reverse();
        return arr;
    }
}

function start() {
    // Start simulation

    // prepare the array
    
    // create the initial array: from y to (height-pxReservedFromTop)
    let arr = []; // simulated array
    let n = Math.floor(width / (barWidth+barBorder)); // max amount of bars that can fit
    let diff = Math.floor((height-pxReservedFromTop) / (n+1)); // difference in height of each bar
    let y = height-pxReservedFromTop-(n*diff); // initial bar height

    for(let i=0;i<n;i++) {
        arr.push(y+diff*i); // initial height + (difference*i)
    }

    arr = prepArray[document.getElementById("arraySetupSelect").value](arr); // simulate user-given array condition

    drawAllBars(arr);


    // fade away main, and fade in canvas
    document.getElementById("headerText").innerHTML = "<h1>"+[...document.getElementById("algorithmSelect").children].find(x => x.value == document.getElementById("algorithmSelect").value).innerHTML + "</h1>";
    document.getElementById("main").style.opacity = "0";
    document.getElementById("overlay").style.opacity = "0.8";

    fadeDelayTransition("header", 1, 1000);
    fadeDelayTransition("canvas", 1, 1000);


    function countdown(s, doneCallback) {
        // function to run the countdown, given `i`, the number of seconds, and `doneCallback` a function to run when countdown is completed
        if(s > 0) {
            document.getElementById("countdown").innerHTML = s;
            document.getElementById("countdown").style.opacity = "1";
            setTimeout(() => countdown(s-1, doneCallback), 1000)
        } else {
            // document.getElementById("countdown").innerHTML = "GO";
            document.getElementById("countdown").style.opacity = "0";
            // done, run doneCallback function
            doneCallback()
        }
    }

    // do a 3 sec countdown
    setTimeout(() => countdown(3, () => {
        // after 3 sec, run this code

        // remove some overlays and headers, and make info visible
        document.getElementById("overlay").remove();
        document.getElementById("header").remove();
        document.getElementById("info").style.opacity = "1";
        
        // time to simulate!
        simulate(document.getElementById("algorithmSelect").value, arr);
    }), 1000);
}

// Algorithm: a general abstract class that will be the base/parent of the actual algorithms
class Algorithm {
    name = ""; // algorithm name

    constructor(arr) {
        this.arr = arr;
        this.steps = 0; // No. steps
        this.comparisons = 0; // No. of comparisons (if statements)
        this.arrayAccesses = 0; // No. of array accesses (eg. arr[i] or arr[i+1])
        // this.interval = setInterval(this.next); // Store the interval that repeatedly runs the next() function, needed to pause it later in renderComplete
    }

    start() {
        // must be called to start the simulation visualization
        this.renderInfo();
        this.interval = setInterval(this._next, timeDelay);
    }

    renderInfo() {
        // render the metrics in the info div, on the top left of the screen
        document.getElementById("info").innerHTML = `${this.name} - ${this.steps} steps - ${this.comparisons} comparisons - ${this.arrayAccesses} array accesses`;
    }
    

    incrementComparisons(i) {
        // add to the no. comparisons, as well as re-rendering the info div
        this.comparisons += i;
        this.renderInfo();
    }

    incrementArrayAccesses(i) {
        // add to the no. array accesses, as well as re-rendering the info div
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
        // play the sound of the element at index `i`
        playSingleFrequency(200+this.arr[i]*2, 'sine', 0.05, volume);
        // TODO: somehow audio cuts out when too many sounds are played (at the same time?), still unsolved
    }

    renderComplete() {
        // run when the simulation is completed

        // stops the interval
        clearInterval(this.interval);

        // render completed animation, green going left to right
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

    _next = () => {
        // function that is ACTUALLY called in setInterval, to do some other stuff before calling next()
        this.steps++; // increment steps
        this.renderInfo();

        this.next()
    }

    next = () => {
        // the function called every time interval

        // where all inherited code must fill
        
        // should simulate a single step in the time frame, not an entire iteration

    }
}

class BubbleSort extends Algorithm {
    name = "bubble sort";
    i = 0; // pointer index
    s = false; // if current pass has undergone a swap, if it hasn't then the array is fully sorted

    constructor(arr) {
        super(arr);
        this.h = arr.length; // the index at which pass it, all elements are already sorted (so we can skip it)
    }

    next = () => {
        // Bubble sort algorithm (step by step)
        
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
            this.playSound(this.i);
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
    min; // value of min

    constructor(arr) {
        super(arr);
    }

    next = () => {
        // Selection sort algorithm (step by step)
        // TODO: MAKE THIS BETTER

        if (this.i != this.arr.length+1) {
            if (this.i != this.j) {
                this.drawBar(this.j-1);
                this.drawBar(this.j, "#FF170D");
            }

            if(!this.min || this.arr[this.j] < this.min) {

                this.min = this.arr[this.j];
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
        // Bogo sort algorithm: (1) check if array is sorted, if not (2) shuffle it, repeat step(1)

        // check if the array is sorted

        let s = true; // is array sorted

        // check the permutation
        for(let i=0;i<this.arr.length-1;i++) {
            // iterate all values 0-(arr.length-1) and check if it is bigger than the next value
            this.incrementArrayAccesses(2);
            this.incrementComparisons(1);
            if(this.arr[i] > this.arr[i+1]) {
                // if not, then array is unsorted
                this.drawBar(i, "#FF170D");
                s = false;
                break;
            }
        }

        if (s == true) {
            // if array is sorted, STOP
            this.renderComplete();
            return;
        }

        // if not sorted, shuffle again by generating a random permuation of the array
        this.incrementArrayAccesses(this.arr.length);
        this.arr = shuffle(this.arr); // use util func shuffle(arr)
        for(let i=0;i<this.arr.length;i++) {
            this.drawBar(i);
        }
    }
}

class MergeSort extends Algorithm {
    // TODO: finish this

    name = "merge sort"

    constructor(arr) {
        super(arr);
    }

    next = () => {
        
    }
}

function simulate(algorithm, arr) {
    // simulate(algorithm, arr): simulate the specified `algorithm` with the `arr`
    let algo;

    switch(algorithm) {
        // initialize class given the algorithm name
        case "bubble": algo = new BubbleSort(arr); break;
        case "bogo": algo = new BogoSort(arr); break;
        case "selection": algo = new SelectionSort(arr); break;
    }

    // start algorithm!
    algo.start();
}