/*
____ ___ ____ ____ _  _ ____ ____    ____ ___ ___ ____ ____ ____ ___ ____ ____ ____
[__   |  |__/ |__| |\ | | __ |___    |__|  |   |  |__/ |__| |     |  |  | |__/ [__
___]  |  |  \ |  | | \| |__] |___    |  |  |   |  |  \ |  | |___  |  |__| |  \ ___]
Copyright (C) 2016 jackw01

This program is distrubuted under the MIT License, see LICENSE for details
*/

// Constants
var TypeQuadratic = 0,
    TypeTrigonometric = 1,
    TypeDeJong = 2;

var renderScale = 3;

// Prevent user from starting another render while it is currently rendering
var rendering = false;

// Clamp/constrain
function clamp(n, min, max) {

    return Math.min(Math.max(parseInt(n), min), max);
}

$("#select-type").change(function(event) {

    $("#seed").val("");
});

$(".validate-resolution").blur(function(event) {

    var value = $("#" + event.target.id).val();

    if (value < 540) {
        $("#" + event.target.id).val(540);
        $("#" + event.target.id).removeClass("text-input-error");
    } else if (value > 2560) {
        $("#" + event.target.id).val(2560);
        $("#" + event.target.id).removeClass("text-input-error");
    }
});

$("#render").click(function() {

    if (!rendering) calculate();
});

$("#save").click(function() {

    // Convert image to blob
    $("#save").attr("href", rc.canvas.toDataURL("image/png"));
    $("#save").attr("download", $("#seed").val() + ".png");
});

function forceSave() {
    window.location = rc.canvas.toDataURL("image/jpg");
}

// Rendering code
function calculate() {

    rendering = true;

    var type;
    var width, height,
        initialWidth, initialHeight;
    var quality;
    var iterations;
    var data;
    var hue, hueVariation, saturation, value, glowAmount;
    var xMin, xMax, yMin, yMax,
        x, y,
        h,
        seed;
    var progress;
    var attractorFound;
    var xRange, yRange;

    // Get inputs
    type = parseInt($("#select-type").val());

    var seedInput = $("#seed").val();
    var seedEntered = true;

    if (seedInput === "" || parseInt(seedInput) === 0 || isNaN(parseInt(seedInput))) {
        seed = 0;
        seedEntered = false;
    } else {
        seed = parseInt(seedInput);
    }

    quality = parseFloat($("#quality").val());

    // Set up canvas for rendering
    width = parseInt($("#resolution-w").val());
    height = parseInt($("#resolution-h").val());

    initialWidth = width;
    initialHeight = height;

    if (width > height) width = height;
    if (height > width) height = width;

    iterations = width * height * 10 * quality;

    width *= renderScale;
    height *= renderScale;

    rc.canvas.width = width;
    rc.canvas.height = height;
    rc.canvas.style.width = rc.canvas.width + "px";
    rc.canvas.style.height = rc.canvas.height + "px";

    rc.fillStyle = "#000000";
    rc.fillRect(0, 0, width, height);

    // Get image data
    data = rc.getImageData(0, 0, width, height);

    // Get render parameters
    hue = parseFloat($("#hue").val());
    hueVariation = parseFloat($("#variation").val());
    saturation = parseFloat($("#saturation").val());
    value = 0.08 / quality * parseFloat($("#brightness").val());
    glowAmount = parseFloat($("#glow").val());

    if (parseFloat($("#glow").val()) < 2) value += (2 - parseFloat($("#glow").val())) * 0.02;

    // Main loop
    progress = 0;
    attractorFound = false;

    var i;
    var end;
    var kx0, kx1, kx2, kx3, kx4, kx5, ky0, ky1, ky2, ky3, ky4, ky5;
    var xe, ye, d0, dd, dx, dy, lyapunov;

    function newAttractor() {

        if (attractorFound) return;

        i = 1;
        end = false;

        // Determine constants
        if (!seedEntered) {

            seed = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
            $("#seed").val(seed);

        } else {

            //attractorFound = true;
        }

        Math.seedrandom(seed);

        kx0 = (Math.random() - 0.5) * 4;
        kx1 = (Math.random() - 0.5) * 4;
        kx2 = (Math.random() - 0.5) * 4;
        kx3 = (Math.random() - 0.5) * 4;
        kx4 = (Math.random() - 0.5) * 4;
        kx5 = (Math.random() - 0.5) * 4;
        ky0 = (Math.random() - 0.5) * 4;
        ky1 = (Math.random() - 0.5) * 4;
        ky2 = (Math.random() - 0.5) * 4;
        ky3 = (Math.random() - 0.5) * 4;
        ky4 = (Math.random() - 0.5) * 4;
        ky5 = (Math.random() - 0.5) * 4;

        // Prepare variables
        xMin = 1e32;
        xMax = -1e32;
        yMin = 1e32;
        yMax = -1e32;
        x = [Math.random() - 0.5, Math.random() - 0.5];
        y = [Math.random() - 0.5, Math.random() - 0.5];
        h = [0, 0];
        xe = 0;
        ye = 0;
        d0 = 0;
        dd = 0;
        dx = 0;
        dy = 0;
        lyapunov = 0;

        // Get initial d0, xe, ye, dx, dy
        while (d0 <= 0) {

            xe = x[0] + (Math.random() - 0.5) / 1000;
            ye = x[0] + (Math.random() - 0.5) / 1000;
            dx = x[0] - xe;
            dy = y[0] - ye;
            d0 = Math.sqrt(dx * dx + dy * dy);
        }

        $(".progress-bar-track").fadeIn(200);
        iterate();
    }

    function iterate() {

        // Calculate progress
        var newProgress = Math.round(i / iterations * 100) / 100;

        if (newProgress > progress) {

            progress = newProgress;
            //console.log("Progress: " + (progress / 2));
            $(".progress-bar").css("width", (progress / 2) * ($(".progress-bar-track").width() - 2) + "px");
        }

        for (var z = 0; z < 100000; z++) {

            if (i >= iterations) {
                setTimeout(render, 0);
                break;
            }

            if (end === true) {
                seedEntered = false;
                setTimeout(newAttractor, 0);
                break;
            }

            // Calculate next point
            i += 1;

            var i1 = i - 1;
            var x1 = x[i1],
                y1 = y[i1];

            var xx = x1 * x1,
                yy = y1 * y1,
                xy = x1 * y1;

            var xi, yi;

            if (type == TypeQuadratic) {
                xi = kx0 + kx1 * x1 + kx2 * xx + kx3 * xy + kx4 * y1 + kx5 * yy;
                yi = ky0 + ky1 * x1 + ky2 * xx + ky3 * xy + ky4 * y1 + ky5 * yy;
            } else if (type == TypeTrigonometric) {
                xi = kx0 * Math.sin(kx1 * y1) + kx2 * Math.cos(kx3 * x1);
                yi = ky0 * Math.sin(ky1 * x1) + ky2 * Math.cos(ky3 * y1);
            } else if (type == TypeDeJong) {
                xi = kx0 * Math.sin(kx1 * y1) - Math.cos(kx2 * x1);
                yi = ky0 * Math.sin(kx1 * x1) - Math.cos(kx2 * y1);
            }

            x.push(xi);
            y.push(yi);

            xMin = Math.min(xi, xMin);
            yMin = Math.min(yi, yMin);
            xMax = Math.max(xi, xMax);
            yMax = Math.max(yi, yMax);

            // Calculate deltas and hue
            if (xMax - xMin === 0) dx = 0;
            else dx = (xi - x1) / (xMax - xMin);

            if (yMax - yMin === 0) dy = 0;
            else dy = (yi - y1) / (yMax - yMin);

            h.push(dx * dx + dy * dy);

            // Check if series goes towards infinity
            if ((xMin < -1e10 || yMin < -1e10 || xMax > 1e10 || yMax > 1e10)) {
                end = true;
                //console.log("inf");
            }

            // Calculate new values
            var xexe = xe * xe,
                xeye = xe * ye,
                yeye = ye * ye;

            var xeNew = 0,
                yeNew = 0;

            if (type == TypeQuadratic) {
                xeNew = kx0 + kx1 * xe + kx2 * xexe + kx3 * xeye + kx4 * ye + kx5 * yeye;
                yeNew = ky0 + ky1 * xe + ky2 * xexe + ky3 * xeye + ky4 * ye + ky5 * yeye;
            } else if (type == TypeTrigonometric) {
                xeNew = kx0 * Math.sin(kx1 * ye) + kx2 * Math.cos(kx3 * xe);
                yeNew = ky0 * Math.sin(ky1 * xe) + ky2 * Math.cos(ky3 * ye);
            } else if (type == TypeDeJong) {
                xeNew = kx0 * Math.sin(kx1 * ye) - Math.cos(kx2 * xe);
                yeNew = ky0 * Math.sin(kx1 * xe) - Math.cos(kx2 * ye);
            }

            // Check if series stays at a point
            dx = x[i] - x[i - 1];
            dy = y[i] - y[i - 1];

            var dxAbs = Math.abs(dx), dyAbs = Math.abs(dy);

            if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) {
                end = true;
                //console.log("pt");
            }

            // Calculate Lyapunov exponent
            if (i > 1000) {
                dx = x[i] - xeNew;
                dy = y[i] - yeNew;
                dd = Math.sqrt(dx * dx + dy * dy);
                lyapunov += Math.log(Math.abs(dd / d0));
                xe = x[i] + d0 * dx / dd;
                ye = y[i] + d0 * dy / dd;
            }

            if (i > 10000 && !attractorFound) {
                //console.log("lya" + lyapunov);
                if (Math.abs(lyapunov) < 1000) {
                    // Stable system
                    end = true;
                } else if (lyapunov < 0) {
                    // Periodic system
                    end = true;
                } else {
                    attractorFound = true;
                }
            }
        }

        if (i < iterations && !end) setTimeout(iterate, 0);
    }

    function render() {

        // Calculate x and y range
        xRange = (xMax - xMin) / 0.8;
        yRange = (yMax - yMin) / 0.8;

        // Render
        iterations = x.length;
        i = 0;
        progress = 0;

        function blend() {

            var newProgress = Math.round(i / iterations * 100) / 100;

            if (newProgress > progress) {

                progress = newProgress;
                //console.log("Progress: " + ((progress / 2) + 0.5));
                $(".progress-bar").css("width", (progress / 2 + 0.5) * ($(".progress-bar-track").width() - 2) + "px");
            }

            for (var z = 0; z < 100000; z++) {

                if (i >= iterations) {
                    setTimeout(composite, 0);
                    break;
                }

                // Calculate new coords
                var scaledX = (x[i] - xMin) / xRange + 0.1,
                    scaledY = (y[i] - yMin) / yRange + 0.1;

                var finalX = clamp(scaledX * width, 0, width - 1),
                    finalY = clamp(scaledY * height, 0, height - 1);

                var hi = (hue + h[i] * hueVariation) * 360, si = saturation, vi = value;
                var r, g, b;
                vi *= 255;

                if (si === 0) r = g = b = vi;
                else {
                    if (hi == 360) hi = 0;
                    else if (hi > 360) hi -= 360;
                    else if (hi < 0) hi += 360;
                    hi /= 60;
                    var k = Math.floor(hi);
                    var f = hi - k;
                    var p = vi * (1 - si);
                    var q = vi * (1 - si * f);
                    var t = vi * (1 - si * (1 - f));
                    switch (k) {
                        case 0:
                            r = vi;
                            g = t;
                            b = p;
                            break;
                        case 1:
/*  ()()    */             r = q;
/*  ('.')   */             g = vi;
/*  (()()   */             b = p;
/* c(_()()x */             break;
                        case 2:
                            r = p;
                            g = vi;
                            b = t;
                            break;
                        case 3:
                            r = p;
                            g = q;
                            b = vi;
                            break;
                        case 4:
                            r = t;
                            g = p;
                            b = vi;
                            break;
                        case 5:
                            r = vi;
                            g = p;
                            b = q;
                            break;
                    }
                }

                data.data[((finalY * (width * 4)) + (finalX * 4)) + 0] += Math.round(r);
                data.data[((finalY * (width * 4)) + (finalX * 4)) + 1] += Math.round(g);
                data.data[((finalY * (width * 4)) + (finalX * 4)) + 2] += Math.round(b);

                i += 1;
            }

            if (i < iterations) setTimeout(blend, 0);
        }

        blend();
    }

    function composite() {

        rc.putImageData(data, 0, 0);

        var image = new Image();
        image.src = rc.canvas.toDataURL();

        var tCanvas = document.createElement("canvas"),
            tc = tCanvas.getContext("2d");

        tc.canvas.width = Math.round(image.width / 2);
        tc.canvas.height = Math.round(image.height / 2);

        tc.drawImage(image, 0, 0, tc.canvas.width, tc.canvas.height);

        rc.canvas.width = Math.round(width / renderScale);
        rc.canvas.height = Math.round(height / renderScale);
        rc.drawImage(tc.canvas, 0, 0, rc.canvas.width, rc.canvas.height);

        data = rc.getImageData(0, 0, rc.canvas.width, rc.canvas.height);
        var blurData = rc.getImageData(0, 0, rc.canvas.width, rc.canvas.height);
        StackBlur.imageDataRGBA(blurData, 0, 0, rc.canvas.width, rc.canvas.height, Math.round(rc.canvas.width / 24));

        // Compositing
        for (var a = 0; a < rc.canvas.width; a++) {
            for (var b = 0; b < rc.canvas.height; b++) {

                data.data[((b * (rc.canvas.width * 4)) + (a * 4)) + 0] += blurData.data[((b * (rc.canvas.width * 4)) + (a * 4)) + 0] * glowAmount;
                data.data[((b * (rc.canvas.width * 4)) + (a * 4)) + 1] += blurData.data[((b * (rc.canvas.width * 4)) + (a * 4)) + 1] * glowAmount;
                data.data[((b * (rc.canvas.width * 4)) + (a * 4)) + 2] += blurData.data[((b * (rc.canvas.width * 4)) + (a * 4)) + 2] * glowAmount;
            }
        }

        rc.fillRect(0, 0, initialWidth, initialHeight);
        rc.putImageData(data, 0, 0);
        c.fillStyle = "#000000";
        c.fillRect(0, 0, c.canvas.width, c.canvas.height);
        c.drawImage(rc.canvas, 0, 0, c.canvas.width, c.canvas.height);

        var nx = 0, ny = 0;

        if (initialWidth > rc.canvas.width) nx = Math.round((initialWidth - rc.canvas.width) / 2);
        else if (initialHeight > rc.canvas.height) ny = Math.round((initialHeight - rc.canvas.height) / 2);

        rc.canvas.width = initialWidth;
        rc.canvas.height = initialHeight;
        rc.canvas.style.width = rc.canvas.width + "px";
        rc.canvas.style.height = rc.canvas.height + "px";
        rc.fillRect(0, 0, initialWidth, initialHeight);
        rc.putImageData(data, nx, ny);

        $(".progress-bar-track").fadeOut(200);
        $(".progress-bar").css("width", "0px");
        $("#save").fadeIn(200);

        rendering = false;
    }

    newAttractor();
}

// Elements
var c = document.getElementById("canvas").getContext("2d"),
    rc = document.getElementById("renderCanvas").getContext("2d");

window.onload = function() {

    c.fillStyle = "#000000";
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
};
