/*
 * Copyright (C) 2019-2023 Yahweasel
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

(function() {
    function isWebAssemblySupported(module) {
        module = module || [0x0, 0x61, 0x73, 0x6d, 0x1, 0x0, 0x0, 0x0];
        if (typeof WebAssembly !== "object" || typeof WebAssembly.instantiate !== "function")
            return false;
        try {
            var module = new WebAssembly.Module(new Uint8Array(module));
            if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        } catch (e) {}
        return false;
    }

    function isSIMDSupported() {
        return isWebAssemblySupported([0x0, 0x61, 0x73, 0x6d, 0x1, 0x0, 0x0,
            0x0, 0x1, 0x5, 0x1, 0x60, 0x0, 0x1, 0x7b, 0x3, 0x2, 0x1, 0x0, 0xa,
            0xa, 0x1, 0x8, 0x0, 0x41, 0x0, 0xfd, 0xf, 0xfd, 0x62, 0xb]);
    }

    var base = ".";
    var nodejs = (typeof process !== "undefined");

    if (typeof LibSpecBleach === "undefined")
        LibSpecBleach = {};

    if (LibSpecBleach.base)
        base = LibSpecBleach.base;

    var wasm = !LibSpecBleach.nowasm && isWebAssemblySupported();
    var simd = wasm && !LibSpecBleach.nosimd && isSIMDSupported();
    var target =
        simd ? "simd" :
        wasm ? "wasm" :
        "asm";
    LibSpecBleach.target = target;

    // The loader itself
    LibSpecBleach.LibSpecBleach = function() {
        var args = arguments;

        return Promise.all([]).then(function() {
            // Load it
            if (typeof LibSpecBleachFactory === "undefined") {
                var toLoad = base + "/libspecbleach-@VER." + target + ".js";
                if (nodejs) {
                    LibSpecBleachFactory = require(toLoad);
                } else {
                    return new Promise(function(res, rej) {
                        var scr = document.createElement("script");
                        scr.type = "text/javascript";
                        scr.src = toLoad;
                        scr.onload = res;
                        scr.onerror = rej;
                        document.body.appendChild(scr);
                    });
                }
            }

        }).then(function() {
            // Replace this with it
            LibSpecBleach.LibSpecBleach = LibSpecBleachFactory;
            delete LibSpecBleachFactory;

            // And create the instance
            return LibSpecBleach.LibSpecBleach.call(LibSpecBleach, args);

        });
    }

    if (nodejs)
        module.exports = LibSpecBleach;

})();
